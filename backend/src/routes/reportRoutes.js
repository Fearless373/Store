const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { dailyReport } = require('../controllers/reportController');

const router = express.Router();

router.get('/daily', requireAuth, dailyReport);

module.exports = router;
