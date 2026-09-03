const pool = require('../config/db');

// POST /api/transactions
// body: { payment_method, items: [{ product_id, quantity }] }
// Creates the transaction, logs line items, and deducts stock atomically.
async function createTransaction(req, res) {
  const { payment_method, items } = req.body;
  const userId = req.user.id;

  if (!payment_method || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'payment_method and at least one item are required.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let totalAmount = 0;
    const lineItems = [];

    for (const item of items) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity || quantity <= 0) {
        throw Object.assign(new Error('Each item needs a valid product_id and positive quantity.'), { status: 400 });
      }

      // Lock the product row so concurrent checkouts can't oversell stock.
      const productResult = await client.query(
        'SELECT id, selling_price, stock_quantity FROM products WHERE id = $1 FOR UPDATE',
        [product_id]
      );
      const product = productResult.rows[0];

      if (!product) {
        throw Object.assign(new Error(`Product ${product_id} not found.`), { status: 404 });
      }
      if (product.stock_quantity < quantity) {
        throw Object.assign(new Error(`Not enough stock for product ${product_id}.`), { status: 409 });
      }

      const unitPrice = Number(product.selling_price);
      totalAmount += unitPrice * quantity;
      lineItems.push({ product_id, quantity, unit_price: unitPrice });

      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [quantity, product_id]
      );
    }

    const txResult = await client.query(
      `INSERT INTO transactions (user_id, total_amount, payment_method)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, totalAmount.toFixed(2), payment_method]
    );
    const transaction = txResult.rows[0];

    for (const line of lineItems) {
      await client.query(
        `INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [transaction.id, line.product_id, line.quantity, line.unit_price]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({ ...transaction, items: lineItems });
  } catch (err) {
    await client.query('ROLLBACK');
    const status = err.status || 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: err.message || 'Failed to process transaction.' });
  } finally {
    client.release();
  }
}

// GET /api/transactions?search=&start=&end=
async function listTransactions(req, res) {
  const { search, start, end } = req.query;
  const conditions = [];
  const params = [];

  if (start) {
    params.push(start);
    conditions.push(`t.created_at >= $${params.length}`);
  }
  if (end) {
    params.push(end);
    conditions.push(`t.created_at <= $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(u.name ILIKE $${params.length} OR t.payment_method ILIKE $${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT t.*, u.name AS cashier_name
       FROM transactions t
       LEFT JOIN users u ON u.id = t.user_id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT 200`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
}

// GET /api/transactions/:id  -> transaction + line items (for receipt / ledger detail view)
async function getTransaction(req, res) {
  const { id } = req.params;
  try {
    const txResult = await pool.query(
      `SELECT t.*, u.name AS cashier_name FROM transactions t
       LEFT JOIN users u ON u.id = t.user_id WHERE t.id = $1`,
      [id]
    );
    if (txResult.rows.length === 0) return res.status(404).json({ error: 'Transaction not found.' });

    const itemsResult = await pool.query(
      `SELECT ti.*, p.name AS product_name FROM transaction_items ti
       JOIN products p ON p.id = ti.product_id WHERE ti.transaction_id = $1`,
      [id]
    );

    res.json({ ...txResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transaction.' });
  }
}

module.exports = { createTransaction, listTransactions, getTransaction };
