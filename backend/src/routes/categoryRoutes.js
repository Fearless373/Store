const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  listCategories, createCategory, updateCategory, deleteCategory,
} = require('../controllers/categoryController');

const router = express.Router();

router.get('/', requireAuth, listCategories);
router.post('/', requireAuth, requireRole('manager'), createCategory);
router.put('/:id', requireAuth, requireRole('manager'), updateCategory);
router.delete('/:id', requireAuth, requireRole('manager'), deleteCategory);

module.exports = router;
