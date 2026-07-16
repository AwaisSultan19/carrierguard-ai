const supabaseService = require('../services/supabaseService');

async function getOrganization(req, res, next) {
  try {
    const org = await supabaseService.getOrganization(req.userId);
    res.json({ success: true, data: org });
  } catch (err) { next(err); }
}

async function getMembers(req, res, next) {
  try {
    const members = await supabaseService.getOrgMembers(req.userId);
    res.json({ success: true, data: members });
  } catch (err) { next(err); }
}

module.exports = { getOrganization, getMembers };
