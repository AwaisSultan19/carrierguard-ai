const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseKey = supabaseServiceKey || supabaseAnonKey;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  if (supabaseServiceKey) {
    console.log('Supabase: using service_role key (RLS bypassed)');
  } else {
    console.warn('Supabase: using anon key (subject to RLS) - set SUPABASE_SERVICE_ROLE_KEY in .env for server-side operations');
  }
}

async function saveCarrierCheck(userId, carrierData) {
  if (!supabase) {
    console.warn('Supabase not initialized, cannot save carrier check');
    return null;
  }

  // Strip "MC-" prefix if present so the DB stores the raw number
  const rawMc = (carrierData.mcNumber || '').replace(/^MC-?/i, '');

  try {
    const { data, error } = await supabase
      .from('carrier_checks')
      .insert({
        user_id: userId || 'anonymous',
        mc_number: rawMc || null,
        dot_number: carrierData.dotNumber || null,
        carrier_name: carrierData.legalName,
        risk_score: carrierData.riskScore,
        status: 'completed',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase saveCarrierCheck error:', error.message, error.details, error.hint);
      throw error;
    }
    console.log(`[DB] Saved carrier check for user=${userId}, carrier=${carrierData.legalName}, dot=${carrierData.dotNumber}`);
    return data;
  } catch (err) {
    console.error('Supabase insert failed for user', userId, ':', err.message);
    return null;
  }
}

async function getSearchHistory(userId, limit = 10) {
  if (!supabase) {
    console.warn('Supabase not initialized, cannot get search history');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('carrier_checks')
      .select('*')
      .eq('user_id', userId || 'anonymous')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase getSearchHistory error:', error.message);
      throw error;
    }
    return data || [];
  } catch (err) {
    console.error('Supabase query failed for user', userId, ':', err.message);
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

    if (error) {
      console.error('Supabase getDashboardStats error:', error.message);
      throw error;
    }

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
  const payload = { clerk_id: userId, name: body.name, email: body.email, preferences: body.preferences, language: body.language, timezone: body.timezone, theme: body.theme, company_name: body.company_name, role: body.role, onboarding_completed: body.onboarding_completed };
  try {
    const { data, error } = await supabase.from('users').upsert(payload, { onConflict: 'clerk_id' }).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('upsertUserProfile failed:', err.message);
    return null;
  }
}

async function completeOnboarding(userId, body) {
  if (!supabase) return null;
  const payload = { clerk_id: userId, company_name: body.company_name, role: body.role, onboarding_completed: true };
  try {
    const { data, error } = await supabase.from('users').upsert(payload, { onConflict: 'clerk_id' }).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('completeOnboarding failed:', err.message);
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

module.exports = { saveCarrierCheck, getSearchHistory, getDashboardStats, getUserProfile, upsertUserProfile, clearSearchHistory, completeOnboarding };
