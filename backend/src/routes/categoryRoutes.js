const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  listCategories, createCategory, updateCategory, deleteCategory,
} = require('../controllers/categoryController');

const router = express.Router();

router.get('/', requireAuth, listCategories);
router.post('/', requireAuth, createCategory);
router.put('/:id', requireAuth, updateCategory);
router.delete('/:id', requireAuth, deleteCategory);

module.exports = router;
