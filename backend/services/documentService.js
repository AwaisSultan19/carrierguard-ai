const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

const KNOWN_INSURERS = [
  'Progressive Commercial', 'Great American Ins.', 'Travelers Property',
  'Liberty Mutual', 'Chubb', 'AIG', 'Zurich', 'Berkshire Hathaway',
  'Nationwide', 'State Farm', 'Allstate', 'Farmers', 'GEICO',
  'CNA Financial', 'Hartford', 'ACE Insurance', 'AXA XL',
  'Markel', 'Old Republic', 'W. R. Berkley', 'Crum & Forster',
  'Erie Insurance', 'Auto-Owners Insurance', 'Amerisure',
  'Selective Insurance', 'Baldwin & Lyons', 'Great West Casualty',
  'National Interstate', 'Oxford Insurance', 'Sentry Insurance',
  'Utica National', 'Westfield Insurance', 'Continental Divide',
  'Northland Insurance', 'Scottsdale Insurance', 'StarStone',
];

function normalizeName(name) {
  return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function insurerExists(name) {
  if (!name) return false;
  const normalized = normalizeName(name);
  return KNOWN_INSURERS.some(known => normalizeName(known).includes(normalized) || normalized.includes(normalizeName(known)));
}

function validatePolicyFormat(policyNumber, policyType) {
  if (!policyNumber) return { valid: false, reason: 'No policy number provided' };
  const cleaned = policyNumber.replace(/[-\s]/g, '');
  if (cleaned.length < 4) return { valid: false, reason: 'Policy number too short' };
  if (cleaned.length > 30) return { valid: false, reason: 'Policy number too long' };
  return { valid: true };
}

function validateDates(effectiveDate, expirationDate) {
  const issues = [];
  if (!expirationDate) {
    issues.push('Missing expiration date');
    return { valid: false, issues };
  }
  const exp = new Date(expirationDate);
  if (isNaN(exp.getTime())) {
    issues.push('Invalid expiration date format');
    return { valid: false, issues };
  }
  const now = new Date();
  if (exp < now) issues.push('Policy is expired');
  if (effectiveDate) {
    const eff = new Date(effectiveDate);
    if (!isNaN(eff.getTime()) && eff > exp) issues.push('Effective date is after expiration date');
  }
  return { valid: issues.length === 0, issues };
}

function crossReferenceWithFMCSA(coiData, fmcsaInsurance) {
  const flags = [];
  if (!fmcsaInsurance || fmcsaInsurance.length === 0) return flags;
  const matched = fmcsaInsurance.some(f => {
    const typeMatch = f.policyType && coiData.policyType &&
      normalizeName(f.policyType).includes(normalizeName(coiData.policyType));
    const carrierMatch = f.carrier && coiData.insurerName &&
      normalizeName(f.carrier).includes(normalizeName(coiData.insurerName));
    return typeMatch || carrierMatch;
  });
  if (!matched) {
    flags.push({
      type: 'fmcsa_mismatch',
      severity: 'high',
      message: 'Insurance policy does not match FMCSA records for this carrier',
    });
  }
  return flags;
}

async function analyzeWithAI(coiData, carrierData) {
  if (!genAI) {
    return fallbackAnalysis(coiData);
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are an insurance fraud detection analyst. Analyze this Certificate of Insurance (COI) for potential fraud or forgery indicators.

COI Details:
- Insurer: ${coiData.insurerName || 'Not specified'}
- Policy Number: ${coiData.policyNumber || 'Not specified'}
- Policy Type: ${coiData.policyType || 'Not specified'}
- Coverage Amount: ${coiData.coverageAmount || 'Not specified'}
- Effective Date: ${coiData.effectiveDate || 'Not specified'}
- Expiration Date: ${coiData.expirationDate || 'Not specified'}

Carrier (from FMCSA):
- Legal Name: ${carrierData?.legalName || 'Unknown'}
- DOT Number: ${carrierData?.dotNumber || 'Unknown'}
- Safety Rating: ${carrierData?.safetyRating || 'Unknown'}

Respond in this exact JSON format (no markdown):
{
  "riskScore": <number 0-100>,
  "verdict": "<VERIFIED|SUSPICIOUS|FAKE>",
  "analysis": "<2-3 sentence explanation>",
  "redFlags": ["<flag1>", "<flag2>"],
  "recommendation": "<actionable recommendation>"
}

- VERIFIED (riskScore 0-30): Everything looks legitimate
- SUSPICIOUS (riskScore 31-69): Some inconsistencies found
- FAKE (riskScore 70-100): Clear indicators of fraud or forgery

Red flags to consider: expired policy, mismatched insurer name, impossible policy number format, coverage too low/high for the policy type, suspicious effective date, inconsistent with FMCSA data, known fraudulent patterns.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```(?:json)?\s*/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Gemini COI analysis failed:', err.message);
    return fallbackAnalysis(coiData);
  }
}

function fallbackAnalysis(coiData) {
  const flags = [];
  let riskScore = 0;

  if (!insurerExists(coiData.insurerName)) {
    riskScore += 30;
    flags.push('Unknown or unrecognized insurance carrier');
  }

  const policyCheck = validatePolicyFormat(coiData.policyNumber, coiData.policyType);
  if (!policyCheck.valid) {
    riskScore += 20;
    flags.push(policyCheck.reason);
  }

  const dateCheck = validateDates(coiData.effectiveDate, coiData.expirationDate);
  if (!dateCheck.valid) {
    riskScore += dateCheck.issues.some(i => i.includes('expired')) ? 35 : 15;
    flags.push(...dateCheck.issues);
  }

  if (!coiData.coverageAmount) {
    riskScore += 5;
    flags.push('No coverage amount specified');
  }

  riskScore = Math.max(0, Math.min(100, riskScore));

  let verdict;
  if (riskScore >= 70) verdict = 'FAKE';
  else if (riskScore >= 31) verdict = 'SUSPICIOUS';
  else verdict = 'VERIFIED';

  const analysis = verdict === 'VERIFIED'
    ? 'Document appears legitimate based on initial validation checks.'
    : verdict === 'SUSPICIOUS'
    ? `Found ${flags.length} potential issue(s) that require manual review.`
    : 'Multiple red flags detected indicating this document may be fraudulent.';

  return {
    riskScore,
    verdict,
    analysis,
    redFlags: flags,
    recommendation: verdict === 'VERIFIED'
      ? 'Document can be accepted.'
      : verdict === 'SUSPICIOUS'
      ? 'Manual verification recommended before accepting this document.'
      : 'Do not accept. Request a new COI directly from the insurance carrier.',
  };
}

async function verifyCOI(coiData, carrierData) {
  const fmcsaFlags = crossReferenceWithFMCSA(coiData, carrierData?.insurance || []);

  let aiResult;
  try {
    aiResult = await analyzeWithAI(coiData, carrierData);
  } catch {
    aiResult = fallbackAnalysis(coiData);
  }

  const combinedRiskScore = Math.max(
    aiResult.riskScore || 0,
    fmcsaFlags.length > 0 ? Math.min(aiResult.riskScore + fmcsaFlags.length * 10, 100) : aiResult.riskScore || 0
  );

  const allFlags = [
    ...(aiResult.redFlags || []).map(f => ({ type: 'ai_detected', severity: aiResult.riskScore >= 70 ? 'critical' : 'warning', message: f })),
    ...fmcsaFlags,
  ];

  let finalVerdict = aiResult.verdict || 'UNVERIFIED';
  if (fmcsaFlags.some(f => f.severity === 'high')) {
    if (finalVerdict === 'VERIFIED') finalVerdict = 'SUSPICIOUS';
  }

  return {
    riskScore: combinedRiskScore,
    verdict: finalVerdict,
    analysis: aiResult.analysis || 'Analysis complete.',
    redFlags: aiResult.redFlags || [],
    flags: allFlags,
    recommendation: aiResult.recommendation || 'Review manually.',
    fmcsaMatch: fmcsaFlags.length === 0,
  };
}

module.exports = { verifyCOI, KNOWN_INSURERS };