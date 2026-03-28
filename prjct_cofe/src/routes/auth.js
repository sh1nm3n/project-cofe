const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validateInput, handleValidation } = require('../middleware/validation');

// Публичные маршруты
router.post('/register', validateInput, handleValidation, authController.register);
router.post('/login', authController.login);

// Защищённые маршруты
router.get('/me', auth.authenticateToken, authController.getMe);
router.post('/logout', auth.authenticateToken, authController.logout);

module.exports = router;