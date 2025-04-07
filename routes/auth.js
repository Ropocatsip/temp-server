const express = require('express');
const { register, login, getMe, logout, verifyOTP, resendOTPCode } = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);
router.post('/verifyOTP', verifyOTP);
router.post('/resendOTPCode', resendOTPCode);

module.exports = router;