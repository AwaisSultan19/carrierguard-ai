const express = require('express');
const router = express.Router();
const orgController = require('../controllers/organizationController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, orgController.getOrganization);
router.get('/members', requireAuth, orgController.getMembers);

module.exports = router;
