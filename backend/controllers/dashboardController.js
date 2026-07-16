const supabaseService = require('../services/supabaseService');

async function getStats(req, res, next) {
  try {
    const userId = req.userId;
    const stats = await supabaseService.getDashboardStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };
