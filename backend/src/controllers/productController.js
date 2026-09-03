const { getDB, toObjectId } = require('../config/db');

function serialize(p) {
  return {
    id: p._id.toString(),
    name: p.name,
    category_id: p.category_id ? p.category_id.toString() : null,
    category_name: p.category_name || null,
    sku: p.sku || null,
    barcode: p.barcode || null,
    cost_price: p.cost_price,
    selling_price: p.selling_price,
    stock_quantity: p.stock_quantity,
    low_stock_threshold: p.low_stock_threshold,
  };
}

// Shared aggregation pipeline stage that joins in the category name.
const categoryLookup = [
  {
    $lookup: {
      from: 'categories',
      localField: 'category_id',
      foreignField: '_id',
      as: 'category',
    },
  },
  { $addFields: { category_name: { $arrayElemAt: ['$category.name', 0] } } },
  { $project: { category: 0 } },
];

// GET /api/products?search=&category_id=&low_stock=true
async function listProducts(req, res) {
  const { search, category_id, low_stock } = req.query;
  const match = {};

  if (search) {
    const re = new RegExp(search, 'i');
    match.$or = [{ name: re }, { sku: re }, { barcode: re }];
  }
  if (category_id) {
    const catId = toObjectId(category_id);
    if (catId) match.category_id = catId;
  }
  if (low_stock === 'true') {
    match.$expr = { $lte: ['$stock_quantity', '$low_stock_threshold'] };
  }

  try {
    const products = await getDB().collection('products')
      .aggregate([{ $match: match }, ...categoryLookup, { $sort: { name: 1 } }])
      .toArray();
    res.json(products.map(serialize));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
}

async function getProduct(req, res) {
  const id = toObjectId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Product not found.' });

  try {
    const [product] = await getDB().collection('products')
      .aggregate([{ $match: { _id: id } }, ...categoryLookup])
      .toArray();
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(serialize(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
}

async function createProduct(req, res) {
  const {
    name, category_id, sku, barcode,
    cost_price, selling_price, stock_quantity, low_stock_threshold,
  } = req.body;

  if (!name || cost_price == null || selling_price == null) {
    return res.status(400).json({ error: 'name, cost_price and selling_price are required.' });
  }

  try {
    const doc = {
      name,
      category_id: category_id ? toObjectId(category_id) : null,
      sku: sku || null,
      barcode: barcode || null,
      cost_price: Number(cost_price),
      selling_price: Number(selling_price),
      stock_quantity: Number(stock_quantity) || 0,
      low_stock_threshold: low_stock_threshold != null ? Number(low_stock_threshold) : 5,
      created_at: new Date(),
    };
    const result = await getDB().collection('products').insertOne(doc);
    res.status(201).json(serialize({ ...doc, _id: result.insertedId }));
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A product with that SKU already exists.' });
    }
    res.status(500).json({ error: 'Failed to create product.' });
  }
}

async function updateProduct(req, res) {
  const id = toObjectId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Product not found.' });

  const fields = [
    'name', 'sku', 'barcode', 'cost_price', 'selling_price',
    'stock_quantity', 'low_stock_threshold',
  ];
  const updates = {};

  fields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  if (req.body.category_id !== undefined) {
    updates.category_id = req.body.category_id ? toObjectId(req.body.category_id) : null;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields provided to update.' });
  }

  try {
    const result = await getDB().collection('products').findOneAndUpdate(
      { _id: id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: 'Product not found.' });
    res.json(serialize(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
}

async function deleteProduct(req, res) {
  const id = toObjectId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Product not found.' });

  try {
    const result = await getDB().collection('products').deleteOne({ _id: id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Product not found.' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
