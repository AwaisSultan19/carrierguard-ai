const supabaseService = require('../services/supabaseService');

async function getSubscription(req, res, next) {
  try {
    const sub = await supabaseService.getSubscription(req.userId);
    res.json({ success: true, data: sub });
  } catch (err) { next(err); }
}

module.exports = { getSubscription };
