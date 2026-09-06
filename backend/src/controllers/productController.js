const pool = require('../config/db');

// Looks up a category by name (case-insensitive), creating it if it doesn't
// exist yet. Lets the product form accept free-typed category names instead
// of requiring the category to already exist.
async function findOrCreateCategoryId(name) {
  if (!name || !name.trim()) return null;
  const trimmed = name.trim();

  const existing = await pool.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [trimmed]);
  if (existing.rows.length > 0) return existing.rows[0].id;

  const inserted = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [trimmed]);
  return inserted.rows[0].id;
}

async function listProducts(req, res) {
  const { search, category_id, low_stock } = req.query;

  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR p.barcode ILIKE $${params.length})`);
  }

  if (category_id) {
    params.push(category_id);
    conditions.push(`p.category_id = $${params.length}`);
  }

  if (low_stock === 'true') {
    conditions.push('p.stock_quantity <= p.low_stock_threshold');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereClause}
       ORDER BY p.name ASC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
}

async function getProduct(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
}

async function createProduct(req, res) {
  const {
    name, category_name, sku, barcode,
    cost_price, selling_price, stock_quantity, low_stock_threshold,
  } = req.body;

  if (!name || cost_price == null || selling_price == null) {
    return res.status(400).json({ error: 'name, cost_price and selling_price are required.' });
  }

  try {
    const categoryId = await findOrCreateCategoryId(category_name);

    const result = await pool.query(
      `INSERT INTO products
        (name, category_id, sku, barcode, cost_price, selling_price, stock_quantity, low_stock_threshold)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        name, categoryId, sku || null, barcode || null,
        cost_price, selling_price, stock_quantity || 0, low_stock_threshold ?? 5,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A product with that SKU already exists.' });
    }
    res.status(500).json({ error: 'Failed to create product.' });
  }
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const fields = [
    'name', 'sku', 'barcode',
    'cost_price', 'selling_price', 'stock_quantity', 'low_stock_threshold',
  ];

  const updates = [];
  const params = [];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      params.push(req.body[field]);
      updates.push(`${field} = $${params.length}`);
    }
  });

  try {
    if (req.body.category_name !== undefined) {
      const categoryId = await findOrCreateCategoryId(req.body.category_name);
      params.push(categoryId);
      updates.push(`category_id = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update.' });
    }

    params.push(id);

    const result = await pool.query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
}

async function deleteProduct(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
