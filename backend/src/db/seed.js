// Optional sample data for local development/testing.
// Run with: node src/db/seed.js  (after `node src/db/migrate.js`)
// Real bcrypt hashes are generated here at runtime, so there's no manual
// hash-swap step — unlike an earlier version of this file that shipped
// placeholder hash strings in a .sql file.
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function seed() {
  const managerHash = await bcrypt.hash('manager123', 10);
  const cashierHash = await bcrypt.hash('cashier123', 10);

  await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, role, email_verified)
     VALUES ($1,$2,$3,$4,$5,TRUE)
     ON CONFLICT (email) DO NOTHING`,
    ['Ama', 'Owusu', 'manager@store.local', managerHash, 'manager']
  );
  await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, role, email_verified)
     VALUES ($1,$2,$3,$4,$5,TRUE)
     ON CONFLICT (email) DO NOTHING`,
    ['Kojo', 'Mensah', 'cashier@store.local', cashierHash, 'cashier']
  );

  const categoryNames = ['Beverages', 'Canned Goods', 'Toiletries', 'Snacks', 'Grains & Staples'];
  const categoryIds = {};
  for (const name of categoryNames) {
    const result = await pool.query(
      `INSERT INTO categories (name) VALUES ($1) RETURNING id`,
      [name]
    );
    categoryIds[name] = result.rows[0]?.id
      ?? (await pool.query('SELECT id FROM categories WHERE name = $1', [name])).rows[0].id;
  }

  const products = [
    ['Malta Guinness 33cl', 'Beverages', 'BEV-001', '6001234567890', 3.50, 5.00, 48, 12],
    ['Milo 400g', 'Beverages', 'BEV-002', '6001234567891', 8.00, 11.50, 20, 6],
    ['Tin Tomatoes 400g', 'Canned Goods', 'CAN-001', '6001234567892', 2.20, 3.50, 4, 10],
    ['Sardines in Oil 125g', 'Canned Goods', 'CAN-002', '6001234567893', 3.00, 4.75, 30, 8],
    ['Bar Soap 200g', 'Toiletries', 'TOI-001', '6001234567894', 1.20, 2.00, 60, 15],
    ['Toothpaste 100ml', 'Toiletries', 'TOI-002', '6001234567895', 2.50, 4.00, 25, 8],
    ['Digestive Biscuits', 'Snacks', 'SNK-001', '6001234567896', 1.80, 3.00, 3, 10],
    ['Rice 5kg', 'Grains & Staples', 'GRN-001', '6001234567897', 12.00, 16.50, 15, 5],
  ];

  for (const [name, category, sku, barcode, cost, selling, stock, threshold] of products) {
    await pool.query(
      `INSERT INTO products (name, category_id, sku, barcode, cost_price, selling_price, stock_quantity, low_stock_threshold)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (sku) DO NOTHING`,
      [name, categoryIds[category], sku, barcode, cost, selling, stock, threshold]
    );
  }

  console.log('Seed complete: 2 users, 5 categories, 8 products.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
