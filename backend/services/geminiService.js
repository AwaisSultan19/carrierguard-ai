const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

async function generateSummary(carrierData) {
  if (!genAI) {
    return fallbackSummary(carrierData);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a carrier compliance analyst. Write a concise 2-3 sentence compliance summary for a freight carrier based on this data:

- Legal Name: ${carrierData.legalName}
- Safety Rating: ${carrierData.safetyRating}
- Authority Status: ${carrierData.authorityStatus}
- Risk Score: ${carrierData.riskScore}/100
- Total Crashes (24mo): ${carrierData.crashTotal} (Fatal: ${carrierData.fatalCrashes}, Injury: ${carrierData.injuryCrashes})
- Inspections: ${carrierData.inspections}, Violations: ${carrierData.violations}
- Driver OOS Rate: ${carrierData.driverOOSRate}
- Vehicle OOS Rate: ${carrierData.vehicleOOSRate}
- Fleet: ${carrierData.powerUnits} power units, ${carrierData.drivers} drivers
- Insurance Policies: ${(carrierData.insurance || []).map(i => `${i.policyType} (${i.status})`).join(', ') || 'None on file'}
- Hazmat: ${carrierData.hazmatStatus ? 'Yes' : 'No'}

Highlight key risks or strengths. Keep it factual and actionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.warn('Gemini summary failed:', err.message);
    return fallbackSummary(carrierData);
  }
}

function fallbackSummary(carrierData) {
  const { safetyRating, riskScore, crashTotal, violations, authStatus } = carrierData;
  if (riskScore >= 70) {
    return `This carrier demonstrates strong compliance with a "${safetyRating}" safety rating and ${violations} violations. Insurance coverage is on file and authority is ${authStatus || carrierData.authorityStatus}. Recommended for standard brokerage.`;
  }
  if (riskScore >= 40) {
    return `This carrier has a "${safetyRating}" safety rating with ${violations} violations and ${crashTotal} reported crash(es). Additional due diligence recommended.`;
  }
  return `Warning: This carrier has a "${safetyRating}" safety rating with ${violations} violations and ${crashTotal} reported crash(es). Thorough due diligence and alternative carrier evaluation strongly advised.`;
}

module.exports = { generateSummary };
