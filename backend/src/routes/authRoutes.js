const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { register, login, changePassword, deleteAccount } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/password', requireAuth, changePassword);
router.delete('/account', requireAuth, deleteAccount);

module.exports = router;
