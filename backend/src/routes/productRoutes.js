const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

router.get('/', requireAuth, listProducts);
router.get('/:id', requireAuth, getProduct);
router.post('/', requireAuth, createProduct);
router.put('/:id', requireAuth, updateProduct);
router.delete('/:id', requireAuth, deleteProduct);

module.exports = router;
