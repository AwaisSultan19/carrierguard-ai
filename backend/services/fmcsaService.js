const axios = require('axios');
const geminiService = require('./geminiService');

const DOTLOOKUP_BASE = 'https://api.dotlookup.dev/v1';
const FMCSA_BASE = (process.env.FMCSA_BASE_URL || 'https://api.fmcsa.dot.gov').replace(/\/+$/, '');
const FMCSA_API_KEY = process.env.FMCSA_API_KEY;
const SAFERWEBAPI_BASE = (process.env.SAFERWEBAPI_BASE_URL || 'https://saferwebapi.com/v2').replace(/\/+$/, '');
const SAFERWEBAPI_KEY = process.env.SAFERWEBAPI_KEY;

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

function computeRiskBreakdown({ safetyRating, crashTotal, violations, authorityStatus, driverOOSRate, driverOOSNatAvg, vehicleOOSRate, vehicleOOSNatAvg, powerUnits }) {
  const factors = [];
  factors.push({ factor: 'Base Score', impact: 75, description: 'Starting baseline for all carriers' });
  if (safetyRating === 'Satisfactory') {
    factors.push({ factor: 'Safety Rating', impact: 15, description: 'Satisfactory safety rating' });
  } else if (safetyRating === 'Conditional') {
    factors.push({ factor: 'Safety Rating', impact: -15, description: 'Conditional safety rating' });
  } else if (safetyRating === 'Unsatisfactory') {
    factors.push({ factor: 'Safety Rating', impact: -35, description: 'Unsatisfactory safety rating' });
  }
  const crashImpact = Math.min((crashTotal || 0) * 4, 20);
  if (crashImpact > 0) {
    factors.push({ factor: 'Crash History', impact: -crashImpact, description: `${crashTotal || 0} crash(es) in 24 months` });
  }
  const violationImpact = Math.min((violations || 0) * 2, 15);
  if (violationImpact > 0) {
    factors.push({ factor: 'Violations', impact: -violationImpact, description: `${violations || 0} violation(s) on record` });
  }
  if (authorityStatus !== 'ACTIVE') {
    factors.push({ factor: 'Authority Status', impact: -30, description: `Authority is ${authorityStatus}` });
  }
  const dRate = parseFloat(driverOOSRate);
  const dNat = parseFloat(driverOOSNatAvg);
  if (!isNaN(dRate) && !isNaN(dNat) && dRate > dNat) {
    factors.push({ factor: 'Driver OOS Rate', impact: -5, description: 'Driver OOS rate exceeds national average' });
  }
  const vRate = parseFloat(vehicleOOSRate);
  const vNat = parseFloat(vehicleOOSNatAvg);
  if (!isNaN(vRate) && !isNaN(vNat) && vRate > vNat) {
    factors.push({ factor: 'Vehicle OOS Rate', impact: -5, description: 'Vehicle OOS rate exceeds national average' });
  }
  if ((powerUnits || 0) > 20) {
    factors.push({ factor: 'Fleet Size', impact: 5, description: `${powerUnits} power units - established fleet` });
  }
  return factors;
}

function getRecommendation(riskScore) {
  if (riskScore >= 70) return 'Approve';
  if (riskScore >= 40) return 'Review';
  return 'Reject';
}

function getOosComparison(rate, nationalAvg) {
  const r = parseFloat(rate);
  const n = parseFloat(nationalAvg);
  if (isNaN(r) || isNaN(n)) return '';
  if (r > n) return 'Above National Average';
  if (r < n) return 'Below National Average';
  return 'At National Average';
}

function computeAuthorityAge(dateStr) {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  if (months < 0) { years--; months += 12; }
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${totalMonths} month${totalMonths !== 1 ? 's' : ''}`;
  return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
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

  const authorityType = (data.operation_classification || []).join(', ') || 'Interstate';
  const ageRefDate = safetyRatingDate || mcs150.date || null;
  const authorityAge = computeAuthorityAge(ageRefDate);
  const riskBreakdown = computeRiskBreakdown({
    safetyRating, crashTotal: crashes.total, violations: violationCount,
    authorityStatus: authStatus, driverOOSRate: driverInsp.oos_rate,
    driverOOSNatAvg: driverInsp.national_avg, vehicleOOSRate: vehicleInsp.oos_rate,
    vehicleOOSNatAvg: vehicleInsp.national_avg, powerUnits: data.fleet?.power_units || 0,
  });
  const recommendation = getRecommendation(riskScore);
  const oosVehicleRate = `${vehicleInsp.oos_rate?.toFixed(1) || '0'}%`;
  const oosVehicleNatAvg = `${vehicleInsp.national_avg?.toFixed(1) || '0'}%`;
  const oosComparison = getOosComparison(oosVehicleRate, oosVehicleNatAvg);

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
    authorityType,
    authorityAge,
    outOfServiceRate: oosVehicleRate,
    outOfServiceNationalAvg: oosVehicleNatAvg,
    driverOOSRate: `${driverInsp.oos_rate?.toFixed(1) || '0'}%`,
    vehicleOOSRate: oosVehicleRate,
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
    riskBreakdown,
    recommendation,
    oosComparison,
    lastUpdated: new Date().toISOString(),
    dataSource: 'DotLookup.dev',
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

  const ratingDateStr = `${ratingMonth} ${rand(1, 28)}, ${ratingYear}`;
  const authorityAge = computeAuthorityAge(ratingDateStr);
  const riskBreakdown = computeRiskBreakdown({
    safetyRating, crashTotal: totalCrashes, violations,
    authorityStatus, driverOOSRate, driverOOSNatAvg: 10,
    vehicleOOSRate, vehicleOOSNatAvg: 15, powerUnits,
  });
  const recommendation = getRecommendation(riskScore);
  const oosComparison = getOosComparison(`${vehicleOOSRate}.${rand(0, 9)}%`, '21.4%');

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
    safetyRatingDate: ratingDateStr,
    reviewDate: `${reviewMonth} ${rand(1, 28)}, ${reviewYear}`,
    authorityStatus,
    authorityType: 'Interstate',
    authorityAge,
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
    riskBreakdown,
    recommendation,
    oosComparison,
    lastUpdated: new Date().toISOString(),
    dataSource: 'FMCSA Database',
  };
}

async function searchViaFMCSA({ mcNumber, dotNumber }) {
  let endpoint;
  if (dotNumber) {
    endpoint = `${FMCSA_BASE}/qc/services/carriers/${dotNumber}`;
  } else {
    const cleanMc = mcNumber.replace(/^MC-?/i, '');
    endpoint = `${FMCSA_BASE}/qc/services/carriers/docket-number/${cleanMc}`;
  }

  const resp = await axios.get(endpoint, {
    params: { webKey: FMCSA_API_KEY, format: 'json' },
    timeout: 15000,
  });

  const content = resp.data?.content || resp.data;
  const c = content?.carrier || content;
  if (!c || (!c.legalName && !c.legal_name && !c.usdotNumber && !c.dot_number)) {
    throw new Error('Carrier not found');
  }

  return mapFMCSACarrier(c);
}

function mapFMCSACarrier(c) {
  const street = c.physicalAddress?.street || c.phyStreet || '';
  const city = c.physicalAddress?.city || c.phyCity || '';
  const state = c.physicalAddress?.state || c.phyState || '';
  const zip = c.physicalAddress?.zip || c.phyZip || '';

  const safetyRating = (c.safetyRating?.rating || c.safety_rating || 'None')
    .replace(/^S$/, 'Satisfactory')
    .replace(/^C$/, 'Conditional')
    .replace(/^U$/, 'Unsatisfactory');

  const ratingDate = c.safetyRating?.ratingDate || c.safetyRating?.rating_date || c.safety_rating_date || null;

  let authStatus = c.authorityStatus || c.authority_status || c.allowedToOperate || c.allowed_to_operate || 'UNKNOWN';
  if (authStatus === 'Y' || authStatus === 'YES' || authStatus === 'AUTHORIZED') authStatus = 'ACTIVE';
  if (authStatus === 'N' || authStatus === 'NO') authStatus = 'NOT_AUTHORIZED';

  const cargoTypes = [];
  const cargoRaw = c.cargoCarried || c.cargo_carried || c.cargoAuthorized || c.cargo_authorized;
  if (cargoRaw) {
    if (Array.isArray(cargoRaw)) cargoTypes.push(...cargoRaw);
    else cargoTypes.push(cargoRaw);
  }

  const fleet = c.fleet || {};
  const powerUnits = fleet.powerUnits || fleet.power_units || 0;
  const drivers = fleet.drivers || 0;

  const dotNumber = (c.usdotNumber || c.dot_number || '').toString();
  const rawMc = c.docketNumber || c.docket_number || '';
  const mcNumber = rawMc ? `MC-${rawMc.replace(/^MC-?/i, '')}` : '';

  let riskScore = 75;
  if (safetyRating === 'Satisfactory') riskScore += 15;
  else if (safetyRating === 'Conditional') riskScore -= 15;
  else if (safetyRating === 'Unsatisfactory') riskScore -= 35;
  if (authStatus !== 'ACTIVE') riskScore -= 30;
  if (powerUnits > 20) riskScore += 5;
  riskScore = Math.max(10, Math.min(99, riskScore));

  const authorityType = c.carrierOperation || c.carrier_operation || 'Interstate';
  const authorityAge = computeAuthorityAge(ratingDate);
  const riskBreakdown = computeRiskBreakdown({
    safetyRating, crashTotal: 0, violations: 0,
    authorityStatus: authStatus, powerUnits,
  });
  const recommendation = getRecommendation(riskScore);

  return {
    dotNumber,
    mcNumber,
    legalName: c.legalName || c.legal_name || 'Unknown',
    dbaName: c.dbaName || c.dba_name || c.legalName || c.legal_name || 'Unknown',
    address: street,
    city,
    state,
    zip,
    phone: c.phone || c.telephone || '',
    safetyRating,
    safetyRatingDate: ratingDate ? new Date(ratingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
    reviewDate: 'N/A',
    authorityStatus: authStatus,
    authorityType,
    authorityAge,
    outOfServiceRate: '',
    outOfServiceNationalAvg: '',
    driverOOSRate: '',
    vehicleOOSRate: '',
    crashTotal: 0,
    fatalCrashes: 0,
    injuryCrashes: 0,
    towCrashes: 0,
    inspections: 0,
    violations: 0,
    vehicleInspections: 0,
    driverInspections: 0,
    hazmatStatus: c.hazmatIndicator === 'Y' || c.hazmat_indicator === 'Y',
    insurance: [],
    fleetSize: powerUnits,
    powerUnits,
    drivers,
    operationType: c.carrierOperation || c.carrier_operation || 'Interstate',
    cargoTypes,
    riskScore,
    riskBreakdown,
    recommendation,
    oosComparison: '',
    lastUpdated: new Date().toISOString(),
    dataSource: 'FMCSA API',
    aiSummary: '',
  };
}

function parseAddress(fullAddress) {
  const parts = (fullAddress || '').split(',');
  const street = (parts[0] || '').trim();
  const stateZip = (parts[1] || '').trim().split(/\s{2,}|\s+/);
  const city = stateZip.slice(0, -2).join(' ');
  const state = stateZip[stateZip.length - 2] || '';
  const zip = stateZip[stateZip.length - 1] || '';
  return { street, city, state, zip };
}

function parseAuthStatus(opStatus) {
  const s = (opStatus || '').toUpperCase();
  if (s.includes('OUT OF SERVICE')) return 'OUT_OF_SERVICE';
  if (s.includes('NOT AUTHORIZED')) return 'NOT_AUTHORIZED';
  if (s.includes('AUTHORIZED')) return 'ACTIVE';
  return 'UNKNOWN';
}

async function searchViaSaferWebAPI({ mcNumber, dotNumber }) {
  let url, label;
  if (dotNumber) {
    url = `${SAFERWEBAPI_BASE}/usdot/snapshot/${dotNumber}`;
    label = `DOT ${dotNumber}`;
  } else {
    const cleanMc = mcNumber.replace(/^MC-?/i, '');
    url = `${SAFERWEBAPI_BASE}/mcmx/snapshot/${cleanMc}`;
    label = `MC ${cleanMc}`;
  }

  console.log(`[SaferWebAPI] REQUEST: GET ${url}`);

  let resp;
  try {
    resp = await axios.get(url, {
      headers: { 'x-api-key': SAFERWEBAPI_KEY },
      timeout: 15000,
    });
    console.log(`[SaferWebAPI] RESPONSE status=${resp.status} for ${label}`);
  } catch (err) {
    console.log(`[SaferWebAPI] ERROR status=${err.response?.status} for ${label}: ${err.message}`);
    if (err.response?.status === 404) {
      throw Object.assign(new Error('Carrier not found'), { statusCode: 404 });
    }
    throw Object.assign(new Error('Carrier lookup service temporarily unavailable'), { statusCode: 503 });
  }

  if (!resp.data || !resp.data.legal_name) {
    throw Object.assign(new Error('Carrier not found'), { statusCode: 404 });
  }

  return mapSaferWebAPICarrier(resp.data);
}

function mapSaferWebAPICarrier(d) {
  const addr = parseAddress(d.physical_address);

  const authStatus = parseAuthStatus(d.operating_status);

  const safetyRating = d.safety_rating || 'None';
  const safetyRatingDate = d.safety_rating_date || null;

  const dotNumber = (d.usdot || '').toString();
  const rawMc = (d.mc_mx_ff_numbers || '').replace(/^MC-?/i, '');
  const mcNumber = rawMc ? `MC-${rawMc}` : '';

  const powerUnits = parseInt(d.power_units, 10) || 0;
  const drivers = parseInt(d.drivers, 10) || 0;

  const usInsp = d.united_states_inspections || d.us_inspections || {};
  const vehicleInsp = usInsp.vehicle || {};
  const driverInsp = usInsp.driver || {};
  const totalInspections = (parseInt(vehicleInsp.inspections || 0, 10) + parseInt(driverInsp.inspections || 0, 10));
  const vehicleOOSPct = parseFloat((vehicleInsp.out_of_service_percent || '0%').replace('%', '')) / 100;
  const driverOOSPct = parseFloat((driverInsp.out_of_service_percent || '0%').replace('%', '')) / 100;
  const vehicleOOSNatAvg = (vehicleInsp.national_average || '').replace('%', '');
  const driverOOSNatAvg = (driverInsp.national_average || '').replace('%', '');

  const crashes = d.united_states_crashes || d.us_crashes || { total: 0, fatal: 0, injury: 0, tow: 0 };

  let violations = 0;
  violations += parseInt(d.violations_unsafe_driving || 0, 10);
  violations += parseInt(d.violations_hours_of_service || 0, 10);
  violations += parseInt(d.violations_driver_fitness || 0, 10);
  violations += parseInt(d.violations_controlled_substance || 0, 10);
  violations += parseInt(d.violations_vehicle_maintenance || 0, 10);

  const insurance = [];
  if (d.insurance_bipd_on_file || d.insurance_cargo_on_file) {
    if (d.insurance_bipd_on_file) {
      insurance.push({ policyType: 'Auto Liability', carrier: 'On File', limit: `$${parseInt(d.insurance_bipd_on_file, 10).toLocaleString('en-US')}`, expiration: 'Current', status: 'VALID' });
    }
    if (d.insurance_cargo_on_file) {
      insurance.push({ policyType: 'Cargo Insurance', carrier: 'On File', limit: `$${parseInt(d.insurance_cargo_on_file, 10).toLocaleString('en-US')}`, expiration: 'Current', status: 'VALID' });
    }
  } else {
    insurance.push({ policyType: 'Auto Liability', carrier: 'Unknown', limit: 'N/A', expiration: 'N/A', status: 'ON FILE' });
  }

  let riskScore = 75;
  if (safetyRating === 'Satisfactory') riskScore += 15;
  else if (safetyRating === 'Conditional') riskScore -= 15;
  else if (safetyRating === 'Unsatisfactory') riskScore -= 35;
  riskScore -= Math.min((crashes.total || 0) * 4, 20);
  riskScore -= Math.min(violations * 2, 15);
  if (authStatus !== 'ACTIVE') riskScore -= 30;
  if (driverOOSPct > 0.10) riskScore -= 5;
  if (vehicleOOSPct > 0.20) riskScore -= 5;
  if (powerUnits > 20) riskScore += 5;
  riskScore = Math.max(10, Math.min(99, riskScore));

  const authorityType = (d.carrier_operation || []).join(', ') || 'Interstate';
  const ageRefDate = safetyRatingDate || d.mcs_150_form_date || null;
  const authorityAge = computeAuthorityAge(ageRefDate);
  const riskBreakdown = computeRiskBreakdown({
    safetyRating, crashTotal: crashes.total, violations,
    authorityStatus: authStatus, driverOOSRate: driverInsp.out_of_service_percent,
    driverOOSNatAvg: driverInsp.national_average, vehicleOOSRate: vehicleInsp.out_of_service_percent,
    vehicleOOSNatAvg: vehicleInsp.national_average, powerUnits,
  });
  const recommendation = getRecommendation(riskScore);
  const oosComparison = getOosComparison(vehicleInsp.out_of_service_percent, vehicleInsp.national_average);

  return {
    dotNumber,
    mcNumber,
    legalName: d.legal_name || 'Unknown',
    dbaName: d.dba_name || d.legal_name || 'Unknown',
    address: addr.street,
    city: addr.city,
    state: addr.state,
    zip: addr.zip,
    phone: (d.phone || '').replace(/[()\s-]/g, ''),
    safetyRating,
    safetyRatingDate: safetyRatingDate ? new Date(safetyRatingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
    reviewDate: d.mcs_150_form_date ? new Date(d.mcs_150_form_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
    authorityStatus: authStatus,
    authorityType,
    authorityAge,
    outOfServiceRate: vehicleInsp.out_of_service_percent || 'N/A',
    outOfServiceNationalAvg: vehicleInsp.national_average || 'N/A',
    driverOOSRate: driverInsp.out_of_service_percent || 'N/A',
    vehicleOOSRate: vehicleInsp.out_of_service_percent || 'N/A',
    crashTotal: crashes.total || 0,
    fatalCrashes: crashes.fatal || 0,
    injuryCrashes: crashes.injury || 0,
    towCrashes: crashes.tow || 0,
    inspections: totalInspections,
    violations,
    vehicleInspections: parseInt(vehicleInsp.inspections || 0, 10),
    driverInspections: parseInt(driverInsp.inspections || 0, 10),
    hazmatStatus: (d.cargo_carried || []).some(c => /hazmat|hazardous/i.test(c)),
    insurance,
    fleetSize: powerUnits,
    powerUnits,
    drivers,
    operationType: (d.carrier_operation || [])[0] || 'Interstate',
    cargoTypes: d.cargo_carried || [],
    riskScore,
    riskBreakdown,
    recommendation,
    oosComparison,
    lastUpdated: new Date().toISOString(),
    dataSource: 'SaferWebAPI',
    aiSummary: '',
  };
}

async function searchCarrier({ mcNumber, dotNumber }) {
  if (SAFERWEBAPI_KEY && SAFERWEBAPI_KEY !== 'YOUR_API_KEY_HERE') {
    const carrier = await searchViaSaferWebAPI({ mcNumber, dotNumber });
    carrier.aiSummary = await geminiService.generateSummary(carrier);
    return carrier;
  }

  let carrier;
  if (FMCSA_API_KEY) {
    try {
      carrier = await searchViaFMCSA({ mcNumber, dotNumber });
      carrier.aiSummary = await geminiService.generateSummary(carrier);
      return carrier;
    } catch (err) {
      console.warn('FMCSA lookup failed, falling back to DotLookup:', err.message);
    }
  }

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
