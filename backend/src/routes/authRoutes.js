const express = require('express');
const { register, verify, resendCode, login } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/verify', verify);
router.post('/resend-code', resendCode);
router.post('/login', login);

module.exports = router;
