const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

router.get('/', requireAuth, listProducts);
router.get('/:id', requireAuth, getProduct);
router.post('/', requireAuth, requireRole('manager'), createProduct);
router.put('/:id', requireAuth, requireRole('manager'), updateProduct);
router.delete('/:id', requireAuth, requireRole('manager'), deleteProduct);

module.exports = router;
