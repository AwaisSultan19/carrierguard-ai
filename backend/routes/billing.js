const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { requireAuth } = require('../middleware/auth');

router.get('/subscription', requireAuth, billingController.getSubscription);

module.exports = router;
