const supabaseService = require('../services/supabaseService');

async function getProfile(req, res, next) {
  try {
    const profile = await supabaseService.getUserProfile(req.userId);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const profile = await supabaseService.upsertUserProfile(req.userId, req.body);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

async function completeOnboarding(req, res, next) {
  try {
    const profile = await supabaseService.completeOnboarding(req.userId, req.body);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

module.exports = { getProfile, updateProfile, completeOnboarding };
