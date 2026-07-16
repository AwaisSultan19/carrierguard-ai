const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { requireAuth } = require('../middleware/auth');

router.get('/me', requireAuth, usersController.getProfile);
router.patch('/me', requireAuth, usersController.updateProfile);

module.exports = router;
