const axios = require('axios');
const geminiService = require('./geminiService');

const DOTLOOKUP_BASE = 'https://api.dotlookup.dev/v1';

const POLICY_TYPE_LABELS = {
  'BIPD': 'Auto Liability',
  'CARGO': 'Cargo Insurance',
  'GL': 'General Liability',
  'BIPD_AND_GL': 'Auto Liability & General Liability',
  'BOND': 'Surety Bond',
  'TRUST_FUND': 'Trust Fund',
};

function formatCurrency(amount) {
  if (!amount) return 'N/A';
  return '$' + Number(amount).toLocaleString('en-US');
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapDotLookupCarrier(data, safetyData, insuranceData) {
  const status = data.status || 'UNKNOWN';
  const authStatus = status === 'ACTIVE' ? 'ACTIVE' : data.authority?.status === 'AUTHORIZED_FOR_HHG'
    ? 'ACTIVE' : status === 'NOT_AUTHORIZED' ? 'NOT_AUTHORIZED' : status;

  const safetyRating = data.safety?.rating || safetyData?.rating || 'None';
  const safetyRatingDate = data.safety?.rating_date || safetyData?.rating_date || null;
  const crashes = safetyData?.crashes || { fatal: 0, injury: 0, towaway: 0, total: 0 };
  const inspections = safetyData?.inspections || {};
  const violations = safetyData?.violations || {};
  const driverInsp = inspections.driver || { total: 0, oos: 0, oos_rate: 0, national_avg: 0 };
  const vehicleInsp = inspections.vehicle || { total: 0, oos: 0, oos_rate: 0, national_avg: 0 };
  const violationCount = (violations.unsafe_driving || 0) + (violations.driver_fitness || 0)
    + (violations.hos || 0) + (violations.drug_alcohol || 0) + (violations.vehicle_maint || 0);

  const policies = insuranceData?.policies || data.insurance_history || [];
  const insurance = policies.map((p) => ({
    policyType: POLICY_TYPE_LABELS[p.policy_type] || p.policy_type || 'Unknown',
    carrier: p.insurer_name || 'Unknown',
    limit: formatCurrency(p.coverage_amount || p.bipd_on_file || p.cargo_on_file),
    expiration: formatDate(p.expiration_date),
    status: p.status === 'Cancelled' || p.status === 'EXPIRED' ? 'EXPIRED' : 'VALID',
  }));

  if (data.insurance?.bipd_on_file && !policies.some(p => p.policy_type === 'BIPD')) {
    insurance.push({
      policyType: 'Auto Liability',
      carrier: 'On File',
      limit: formatCurrency(data.insurance.bipd_on_file),
      expiration: 'Current',
      status: 'VALID',
    });
  }
  if (data.insurance?.cargo_on_file && !policies.some(p => p.policy_type === 'CARGO')) {
    insurance.push({
      policyType: 'Cargo Insurance',
      carrier: 'On File',
      limit: formatCurrency(data.insurance.cargo_on_file),
      expiration: 'Current',
      status: 'VALID',
    });
  }

  let riskScore = 75;
  if (safetyRating === 'Satisfactory') riskScore += 15;
  else if (safetyRating === 'Conditional') riskScore -= 15;
  else if (safetyRating === 'Unsatisfactory') riskScore -= 35;
  riskScore -= Math.min(crashes.total * 4, 20);
  riskScore -= Math.min(violationCount * 2, 15);
  if (authStatus !== 'ACTIVE') riskScore -= 30;
  if (driverInsp.oos_rate > driverInsp.national_avg) riskScore -= 5;
  if (vehicleInsp.oos_rate > vehicleInsp.national_avg) riskScore -= 5;
  if ((data.fleet?.power_units || 0) > 20) riskScore += 5;
  riskScore = Math.max(10, Math.min(99, riskScore));

  const cargoTypes = data.cargo_carried || [];
  const mcs150 = data.mcs150 || {};

  let aiSummary;
  if (riskScore >= 70) {
    aiSummary = `This carrier demonstrates strong compliance with a "${safetyRating}" safety rating and ${violationCount} violations across ${driverInsp.total + vehicleInsp.total} inspections. Insurance coverage is on file and authority status is ${authStatus}. Recommended for standard brokerage.`;
  } else if (riskScore >= 40) {
    aiSummary = `This carrier has a "${safetyRating}" safety rating with ${violationCount} violations and ${crashes.total} reported crash(es). ${driverInsp.oos_rate > driverInsp.national_avg ? 'Driver OOS rates exceed the national average. ' : ''}${vehicleInsp.oos_rate > vehicleInsp.national_avg ? 'Vehicle OOS rates exceed the national average. ' : ''}Additional due diligence recommended.`;
  } else {
    aiSummary = `Warning: This carrier has a "${safetyRating}" safety rating with ${violationCount} violations and ${crashes.total} reported crash(es). ${authStatus !== 'ACTIVE' ? `Authority status is ${authStatus}. ` : ''}Thorough due diligence and alternative carrier evaluation strongly advised.`;
  }

  return {
    dotNumber: data.dot_number?.toString() || '',
    mcNumber: data.mc_number ? `MC-${data.mc_number}` : '',
    legalName: data.legal_name || 'Unknown',
    dbaName: data.dba_name || data.legal_name || 'Unknown',
    address: data.address?.street || '',
    city: data.address?.city || '',
    state: data.address?.state || '',
    zip: data.address?.zip || '',
    phone: data.contact?.phone || '',
    safetyRating,
    safetyRatingDate: safetyRatingDate ? formatDate(safetyRatingDate) : 'N/A',
    reviewDate: mcs150.date ? formatDate(mcs150.date) : 'N/A',
    authorityStatus: authStatus,
    outOfServiceRate: `${vehicleInsp.oos_rate?.toFixed(1) || '0'}%`,
    outOfServiceNationalAvg: `${vehicleInsp.national_avg?.toFixed(1) || '0'}%`,
    driverOOSRate: `${driverInsp.oos_rate?.toFixed(1) || '0'}%`,
    vehicleOOSRate: `${vehicleInsp.oos_rate?.toFixed(1) || '0'}%`,
    crashTotal: crashes.total || 0,
    fatalCrashes: crashes.fatal || 0,
    injuryCrashes: crashes.injury || 0,
    towCrashes: crashes.towaway || 0,
    inspections: (driverInsp.total || 0) + (vehicleInsp.total || 0),
    violations: violationCount,
    vehicleInspections: vehicleInsp.total || 0,
    driverInspections: driverInsp.total || 0,
    hazmatStatus: data.hazmat_indicator === 'Y',
    insurance,
    fleetSize: data.fleet?.power_units || 0,
    powerUnits: data.fleet?.power_units || 0,
    drivers: data.fleet?.drivers || 0,
    operationType: (data.operation_classification || []).join(', ') || 'Interstate',
    cargoTypes,
    riskScore,
    aiSummary,
  };
}

async function searchViaDotLookup({ dotNumber, mcNumber }) {
  let dot = dotNumber;

  if (mcNumber && !dot) {
    const cleanMc = mcNumber.replace(/^MC-?/i, '');
    const searchResp = await axios.get(`${DOTLOOKUP_BASE}/carriers/search`, {
      params: { mc_number: cleanMc, per_page: 1, status: 'ALL' },
      timeout: 15000,
    });
    const results = searchResp.data?.data || [];
    if (results.length === 0) throw new Error('Carrier not found');
    dot = results[0].dot_number;
  }

  const [profileResp, safetyResp, insuranceResp] = await Promise.all([
    axios.get(`${DOTLOOKUP_BASE}/carriers/${dot}`, { timeout: 15000 }),
    axios.get(`${DOTLOOKUP_BASE}/carriers/${dot}/safety`, { timeout: 15000 }).catch(() => ({ data: {} })),
    axios.get(`${DOTLOOKUP_BASE}/carriers/${dot}/insurance`, { timeout: 15000 }).catch(() => ({ data: {} })),
  ]);

  const profile = profileResp.data;
  if (!profile || !profile.dot_number) throw new Error('Carrier not found');

  const carrier = mapDotLookupCarrier(profile, safetyResp.data, insuranceResp.data);
  carrier.aiSummary = await geminiService.generateSummary(carrier);
  return carrier;
}

function generateMockCarrierData({ mcNumber, dotNumber }) {
  const seed = parseInt((mcNumber || dotNumber || '0').replace(/\D/g, '').slice(-4), 10) || Math.floor(Math.random() * 9999);
  const rand = (min, max) => Math.floor(((seed * 9301 + 49297) % 233280) / 233280 * (max - min + 1)) + min;

  const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'NOT_AUTHORIZED'];
  const ratings = ['Satisfactory', 'Satisfactory', 'Satisfactory', 'Conditional', 'None'];
  const names = ['Express', 'Logistics', 'Transport', 'Trucking', 'Hauling', 'Freight', 'Lines', 'Distribution', 'Carriers', 'Fleet'];
  const prefixes = ['Swift', 'Apex', 'Prime', 'Elite', 'National', 'Pioneer', 'Summit', 'Crown', 'Beacon', 'Titan'];
  const cities = ['Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'Dallas', 'Austin', 'Denver', 'Seattle'];
  const states = ['CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'TX', 'TX', 'CO', 'WA'];
  const cargoTypes = ['General Freight', 'Refrigerated', 'Flatbed', 'Tanker', 'Auto Transport', 'LTL', 'Heavy Haul', 'Expedited'];

  const idx = rand(0, 9);
  const carrierName = `${prefixes[idx]} ${cities[idx].split(' ')[0]} ${names[rand(0, 9)]} LLC`;

  const safetyRating = ratings[rand(0, 4)];
  const authorityStatus = statuses[rand(0, 4)];
  const totalCrashes = rand(0, 5);
  const fatalCrashes = rand(0, Math.min(1, totalCrashes));
  const injuryCrashes = rand(0, Math.min(2, totalCrashes - fatalCrashes));
  const towCrashes = totalCrashes - fatalCrashes - injuryCrashes;
  const inspections = rand(5, 50);
  const violations = rand(0, Math.floor(inspections * 0.3));
  const vehicleInspections = rand(3, 30);
  const driverInspections = rand(2, 25);
  const driverOOSRate = rand(0, 15);
  const vehicleOOSRate = rand(0, 20);
  const powerUnits = rand(1, 100);
  const drivers = rand(1, 80);

  let riskScore = 85;
  if (safetyRating === 'Satisfactory') riskScore += 10;
  else if (safetyRating === 'Conditional') riskScore -= 15;
  else if (safetyRating === 'Unsatisfactory') riskScore -= 30;
  if (authorityStatus !== 'ACTIVE') riskScore -= 20;
  riskScore -= Math.min(totalCrashes * 3, 15);
  riskScore -= Math.min(driverOOSRate > 10 ? 10 : 0, 10);
  riskScore -= Math.min(vehicleOOSRate > 15 ? 8 : 0, 10);
  if (powerUnits > 20) riskScore += 5;
  riskScore = Math.max(10, Math.min(99, riskScore));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const ratingMonth = months[rand(0, 11)];
  const ratingYear = 2023 + rand(0, 1);
  const reviewMonth = months[rand(0, 11)];
  const reviewYear = 2024 + rand(0, 1);

  const insuranceTypes = ['Auto Liability', 'Cargo Insurance', 'General Liability'];
  const insuranceCarriers = ['Progressive Commercial', 'Great American Ins.', 'Travelers Property', 'Liberty Mutual', 'Chubb'];
  const insuranceLimits = ['$1,000,000', '$250,000', '$2,000,000', '$5,000,000', '$500,000'];
  const insurance = insuranceTypes.map((type) => ({
    policyType: type,
    carrier: insuranceCarriers[rand(0, 4)],
    limit: type === 'Cargo Insurance' ? '$250,000' : insuranceLimits[rand(0, 4)],
    expiration: `${months[rand(0, 11)]} ${rand(1, 28)}, ${2024 + rand(0, 1)}`,
    status: 'VALID',
  }));

  return {
    dotNumber: dotNumber || `${rand(100000, 9999999)}`,
    mcNumber: mcNumber || `MC-${rand(100000, 9999999)}`,
    legalName: carrierName,
    dbaName: carrierName,
    address: `${rand(100, 9999)} ${['Main St', 'Oak Ave', 'Industrial Blvd', 'Commerce Dr', 'Route'][rand(0, 4)]}`,
    city: cities[idx],
    state: states[idx],
    zip: `${rand(10000, 99999)}`,
    phone: `${rand(200, 999)}-${rand(100, 999)}-${rand(1000, 9999)}`,
    safetyRating,
    safetyRatingDate: `${ratingMonth} ${rand(1, 28)}, ${ratingYear}`,
    reviewDate: `${reviewMonth} ${rand(1, 28)}, ${reviewYear}`,
    authorityStatus,
    outOfServiceRate: `${vehicleOOSRate}.${rand(0, 9)}%`,
    outOfServiceNationalAvg: '21.4%',
    driverOOSRate: `${driverOOSRate}.${rand(0, 9)}%`,
    vehicleOOSRate: `${vehicleOOSRate}.${rand(0, 9)}%`,
    crashTotal: totalCrashes,
    fatalCrashes,
    injuryCrashes,
    towCrashes,
    inspections,
    violations,
    vehicleInspections,
    driverInspections,
    hazmatStatus: rand(0, 1) === 1,
    insurance,
    fleetSize: powerUnits,
    powerUnits,
    drivers,
    operationType: 'Interstate',
    cargoTypes: [cargoTypes[rand(0, 7)], cargoTypes[rand(0, 7)]].filter((v, i, a) => a.indexOf(v) === i),
    riskScore,
  };
}

async function searchCarrier({ mcNumber, dotNumber }) {
  let carrier;
  try {
    carrier = await searchViaDotLookup({ dotNumber, mcNumber });
  } catch (err) {
    console.warn('DotLookup lookup failed, using mock data:', err.message);
    carrier = generateMockCarrierData({ mcNumber, dotNumber });
  }
  if (!carrier.aiSummary) {
    carrier.aiSummary = await geminiService.generateSummary(carrier);
  }
  return carrier;
}

module.exports = { searchCarrier, generateMockCarrierData };
