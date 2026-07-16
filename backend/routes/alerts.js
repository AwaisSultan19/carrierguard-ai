const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, alertsController.getAlerts);
router.patch('/:id/dismiss', requireAuth, alertsController.dismissAlert);

module.exports = router;
