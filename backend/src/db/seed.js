// Optional sample data for local development/testing.
// Run with: node src/db/seed.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const { connectDB } = require('../config/db');

async function seed() {
  const db = await connectDB();

  // Indexes (idempotent — safe to run every time).
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('products').createIndex({ sku: 1 }, { unique: true, sparse: true });
  await db.collection('products').createIndex({ name: 1 });
  await db.collection('products').createIndex({ category_id: 1 });
  await db.collection('transactions').createIndex({ created_at: -1 });

  const managerHash = await bcrypt.hash('manager123', 10);
  const cashierHash = await bcrypt.hash('cashier123', 10);

  await db.collection('users').updateOne(
    { email: 'manager@store.local' },
    {
      $set: {
        first_name: 'Ama', last_name: 'Owusu', email: 'manager@store.local',
        password_hash: managerHash, role: 'manager', email_verified: true,
      },
    },
    { upsert: true }
  );
  await db.collection('users').updateOne(
    { email: 'cashier@store.local' },
    {
      $set: {
        first_name: 'Kojo', last_name: 'Mensah', email: 'cashier@store.local',
        password_hash: cashierHash, role: 'cashier', email_verified: true,
      },
    },
    { upsert: true }
  );

  const categoryNames = ['Beverages', 'Canned Goods', 'Toiletries', 'Snacks', 'Grains & Staples'];
  const categoryIds = {};
  for (const name of categoryNames) {
    const result = await db.collection('categories').findOneAndUpdate(
      { name },
      { $set: { name } },
      { upsert: true, returnDocument: 'after' }
    );
    categoryIds[name] = result._id;
  }

  const products = [
    { name: 'Malta Guinness 33cl', category: 'Beverages', sku: 'BEV-001', barcode: '6001234567890', cost_price: 3.50, selling_price: 5.00, stock_quantity: 48, low_stock_threshold: 12 },
    { name: 'Milo 400g', category: 'Beverages', sku: 'BEV-002', barcode: '6001234567891', cost_price: 8.00, selling_price: 11.50, stock_quantity: 20, low_stock_threshold: 6 },
    { name: 'Tin Tomatoes 400g', category: 'Canned Goods', sku: 'CAN-001', barcode: '6001234567892', cost_price: 2.20, selling_price: 3.50, stock_quantity: 4, low_stock_threshold: 10 },
    { name: 'Sardines in Oil 125g', category: 'Canned Goods', sku: 'CAN-002', barcode: '6001234567893', cost_price: 3.00, selling_price: 4.75, stock_quantity: 30, low_stock_threshold: 8 },
    { name: 'Bar Soap 200g', category: 'Toiletries', sku: 'TOI-001', barcode: '6001234567894', cost_price: 1.20, selling_price: 2.00, stock_quantity: 60, low_stock_threshold: 15 },
    { name: 'Toothpaste 100ml', category: 'Toiletries', sku: 'TOI-002', barcode: '6001234567895', cost_price: 2.50, selling_price: 4.00, stock_quantity: 25, low_stock_threshold: 8 },
    { name: 'Digestive Biscuits', category: 'Snacks', sku: 'SNK-001', barcode: '6001234567896', cost_price: 1.80, selling_price: 3.00, stock_quantity: 3, low_stock_threshold: 10 },
    { name: 'Rice 5kg', category: 'Grains & Staples', sku: 'GRN-001', barcode: '6001234567897', cost_price: 12.00, selling_price: 16.50, stock_quantity: 15, low_stock_threshold: 5 },
  ];

  for (const p of products) {
    const { category, ...rest } = p;
    await db.collection('products').updateOne(
      { sku: rest.sku },
      { $set: { ...rest, category_id: categoryIds[category], created_at: new Date() } },
      { upsert: true }
    );
  }

  console.log('Seed complete: 2 users, 5 categories, 8 products.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
