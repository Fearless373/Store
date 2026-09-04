const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  createTransaction, listTransactions, getTransaction,
} = require('../controllers/transactionController');

const router = express.Router();

router.post('/', requireAuth, createTransaction);
router.get('/', requireAuth, listTransactions);
router.get('/:id', requireAuth, getTransaction);

module.exports = router;
