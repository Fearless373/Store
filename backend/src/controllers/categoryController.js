const { getDB, toObjectId } = require('../config/db');

function serialize(cat) {
  return { id: cat._id.toString(), name: cat.name };
}

async function listCategories(req, res) {
  try {
    const categories = await getDB().collection('categories').find().sort({ name: 1 }).toArray();
    res.json(categories.map(serialize));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
}

async function createCategory(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required.' });

  try {
    const result = await getDB().collection('categories').insertOne({ name });
    res.status(201).json({ id: result.insertedId.toString(), name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create category.' });
  }
}

async function updateCategory(req, res) {
  const id = toObjectId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid category id.' });
  const { name } = req.body;

  try {
    const result = await getDB().collection('categories').findOneAndUpdate(
      { _id: id },
      { $set: { name } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: 'Category not found.' });
    res.json(serialize(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update category.' });
  }
}

async function deleteCategory(req, res) {
  const id = toObjectId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid category id.' });

  try {
    const result = await getDB().collection('categories').deleteOne({ _id: id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Category not found.' });

    // Uncategorize any products that referenced this category (mirrors ON DELETE SET NULL).
    await getDB().collection('products').updateMany(
      { category_id: id },
      { $set: { category_id: null } }
    );

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
