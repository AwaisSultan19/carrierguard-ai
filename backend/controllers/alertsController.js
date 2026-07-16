const supabaseService = require('../services/supabaseService');

async function getAlerts(req, res, next) {
  try {
    const alerts = await supabaseService.getAlerts(req.userId);
    res.json({ success: true, data: alerts });
  } catch (err) { next(err); }
}

async function dismissAlert(req, res, next) {
  try {
    await supabaseService.dismissAlert(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { getAlerts, dismissAlert };
