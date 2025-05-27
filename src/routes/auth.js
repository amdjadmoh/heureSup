const express = require('express');
const router = express.Router();
const authController = require('../controller/auth');

// Authentication routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);
router.put('/update-profile', authController.updateProfile); // New route

module.exports = router;