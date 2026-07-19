const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { requireAuth } = require('../middleware/auth');

router.get('/generate', requireAuth, reportsController.generateReport);
router.get('/pdf', requireAuth, reportsController.downloadPdf);

module.exports = router;
