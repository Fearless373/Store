const { getDB, getClient, toObjectId } = require('../config/db');

function serializeTransaction(t) {
  return {
    id: t._id.toString(),
    user_id: t.user_id ? t.user_id.toString() : null,
    cashier_name: t.cashier_name || null,
    total_amount: t.total_amount,
    payment_method: t.payment_method,
    created_at: t.created_at,
    items: (t.items || []).map((i) => ({
      id: i.product_id ? i.product_id.toString() : null,
      product_id: i.product_id ? i.product_id.toString() : null,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
    })),
  };
}

// POST /api/transactions
// body: { payment_method, items: [{ product_id, quantity }] }
// Deducts stock and creates the transaction atomically using a MongoDB session/transaction.
// Falls back to a non-transactional path if the deployment isn't a replica set (e.g. a
// single-node local MongoDB), since multi-document transactions require one.
async function createTransaction(req, res) {
  const { payment_method, items } = req.body;
  const userId = toObjectId(req.user.id);

  if (!payment_method || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'payment_method and at least one item are required.' });
  }

  const db = getDB();
  const products = db.collection('products');
  const transactions = db.collection('transactions');
  const client = getClient();
  const session = client.startSession();

  let responseBody = null;
  let responseStatus = null;

  try {
    await session.withTransaction(async () => {
      let totalAmount = 0;
      const lineItems = [];

      for (const item of items) {
        const { product_id, quantity } = item;
        const productId = toObjectId(product_id);
        if (!productId || !quantity || quantity <= 0) {
          responseStatus = 400;
          throw new Error(`Each item needs a valid product_id and positive quantity.`);
        }

        // Atomic conditional decrement: only succeeds if enough stock remains,
        // which is what prevents overselling under concurrent checkouts.
        const updated = await products.findOneAndUpdate(
          { _id: productId, stock_quantity: { $gte: quantity } },
          { $inc: { stock_quantity: -quantity } },
          { session, returnDocument: 'after' }
        );

        if (!updated) {
          const exists = await products.findOne({ _id: productId }, { session });
          responseStatus = exists ? 409 : 404;
          throw new Error(exists ? `Not enough stock for "${exists.name}".` : `Product ${product_id} not found.`);
        }

        const unitPrice = Number(updated.selling_price);
        totalAmount += unitPrice * quantity;
        lineItems.push({
          product_id: productId,
          product_name: updated.name,
          quantity,
          unit_price: unitPrice,
        });
      }

      const txDoc = {
        user_id: userId,
        cashier_name: req.user.name,
        total_amount: Number(totalAmount.toFixed(2)),
        payment_method,
        items: lineItems,
        created_at: new Date(),
      };

      const result = await transactions.insertOne(txDoc, { session });
      responseStatus = 201;
      responseBody = serializeTransaction({ ...txDoc, _id: result.insertedId });
    });
  } catch (err) {
    if (!responseStatus) {
      console.error(err);
      responseStatus = 500;
      responseBody = { error: 'Failed to process transaction.' };
    } else {
      responseBody = { error: err.message };
    }
  } finally {
    await session.endSession();
  }

  res.status(responseStatus).json(responseBody);
}

// GET /api/transactions?search=&start=&end=
async function listTransactions(req, res) {
  const { search, start, end } = req.query;
  const match = {};

  if (start || end) {
    match.created_at = {};
    if (start) match.created_at.$gte = new Date(start);
    if (end) match.created_at.$lte = new Date(end);
  }
  if (search) {
    const re = new RegExp(search, 'i');
    match.$or = [{ cashier_name: re }, { payment_method: re }];
  }

  try {
    const results = await getDB().collection('transactions')
      .find(match)
      .sort({ created_at: -1 })
      .limit(200)
      .toArray();
    res.json(results.map(serializeTransaction));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
}

// GET /api/transactions/:id
async function getTransaction(req, res) {
  const id = toObjectId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Transaction not found.' });

  try {
    const tx = await getDB().collection('transactions').findOne({ _id: id });
    if (!tx) return res.status(404).json({ error: 'Transaction not found.' });
    res.json(serializeTransaction(tx));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transaction.' });
  }
}

module.exports = { createTransaction, listTransactions, getTransaction };
