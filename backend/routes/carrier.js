const express = require('express');
const router = express.Router();
const carrierController = require('../controllers/carrierController');
const { requireAuth } = require('../middleware/auth');

router.post('/search', requireAuth, carrierController.searchCarrier);
router.get('/history', requireAuth, carrierController.getSearchHistory);
router.get('/:id', requireAuth, carrierController.getCarrierById);

module.exports = router;
