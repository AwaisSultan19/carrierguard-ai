const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

async function saveCarrierCheck(userId, carrierData) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('carrier_checks')
      .insert({
        user_id: userId || 'anonymous',
        mc_number: carrierData.mcNumber,
        dot_number: carrierData.dotNumber,
        carrier_name: carrierData.legalName,
        risk_score: carrierData.riskScore,
        status: 'completed',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase insert failed:', err.message);
    return null;
  }
}

async function getSearchHistory(userId, limit = 10) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('carrier_checks')
      .select('*')
      .eq('user_id', userId || 'anonymous')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase query failed:', err.message);
    return [];
  }
}

async function getDashboardStats(userId) {
  if (!supabase) {
    return {
      totalCarriersVetted: 0,
      highRiskAlerts: 0,
      complianceRate: 0,
      pendingAudits: 0,
      recentChecks: [],
      riskDistribution: { low: 0, moderate: 0, high: 0 },
    };
  }

  try {
    const { data: allChecks, error } = await supabase
      .from('carrier_checks')
      .select('id, risk_score, carrier_name, mc_number, dot_number, created_at')
      .eq('user_id', userId || 'anonymous')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const checks = allChecks || [];
    const total = checks.length;
    const highRisk = checks.filter(c => c.risk_score < 40).length;
    const lowRisk = checks.filter(c => c.risk_score >= 70).length;
    const moderateRisk = checks.filter(c => c.risk_score >= 40 && c.risk_score < 70).length;
    const avgScore = total > 0 ? Math.round(checks.reduce((sum, c) => sum + (c.risk_score || 0), 0) / total) : 0;

    return {
      totalCarriersVetted: total,
      highRiskAlerts: highRisk,
      complianceRate: total > 0 ? Math.round((lowRisk / total) * 1000) / 10 : 0,
      pendingAudits: 0,
      averageRiskScore: avgScore,
      recentChecks: checks.slice(0, 5).map(c => ({
        id: c.id,
        carrier_name: c.carrier_name,
        mc_number: c.mc_number,
        dot_number: c.dot_number,
        risk_score: c.risk_score,
        created_at: c.created_at,
      })),
      riskDistribution: {
        low: lowRisk,
        moderate: moderateRisk,
        high: highRisk,
      },
    };
  } catch (err) {
    console.warn('Dashboard stats failed:', err.message);
    return {
      totalCarriersVetted: 0,
      highRiskAlerts: 0,
      complianceRate: 0,
      pendingAudits: 0,
      averageRiskScore: 0,
      recentChecks: [],
      riskDistribution: { low: 0, moderate: 0, high: 0 },
    };
  }
}

async function getUserProfile(userId) {
  if (!supabase) return { name: 'User', email: '', preferences: {}, avatar_url: '' };
  try {
    const { data, error } = await supabase.from('users').select('*').eq('clerk_id', userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || { name: 'User', email: '', preferences: {}, language: 'en-US', timezone: 'America/New_York', theme: 'light' };
  } catch (err) {
    console.warn('getUserProfile failed:', err.message);
    return { name: 'User', email: '' };
  }
}

async function upsertUserProfile(userId, body) {
  if (!supabase) return null;
  const payload = { clerk_id: userId, name: body.name, email: body.email, preferences: body.preferences, language: body.language, timezone: body.timezone, theme: body.theme };
  try {
    const { data, error } = await supabase.from('users').upsert(payload, { onConflict: 'clerk_id' }).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('upsertUserProfile failed:', err.message);
    return null;
  }
}

async function clearSearchHistory(userId) {
  if (!supabase) return;
  try {
    await supabase.from('carrier_checks').delete().eq('user_id', userId || 'anonymous');
  } catch (err) {
    console.warn('clearSearchHistory failed:', err.message);
  }
}

module.exports = { saveCarrierCheck, getSearchHistory, getDashboardStats, getUserProfile, upsertUserProfile, clearSearchHistory };
