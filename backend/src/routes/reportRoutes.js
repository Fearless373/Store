const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { dailyReport } = require('../controllers/reportController');

const router = express.Router();

router.get('/daily', requireAuth, requireRole('manager'), dailyReport);

module.exports = router;
