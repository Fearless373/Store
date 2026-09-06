// One-time cleanup script — no longer seeds sample data. New accounts start
// with a genuinely empty catalog; add products/categories through the app.
// Run with: node src/db/seed.js  (after `node src/db/migrate.js`)
require('dotenv').config();
const pool = require('../config/db');

const LEGACY_SKUS = ['BEV-001', 'BEV-002', 'CAN-001', 'CAN-002', 'TOI-001', 'TOI-002', 'SNK-001', 'GRN-001'];
const LEGACY_CATEGORY_NAMES = ['Beverages', 'Canned Goods', 'Toiletries', 'Snacks', 'Grains & Staples'];

async function cleanup() {
  // This app used to ship two seeded test accounts. No longer part of the
  // account model — remove them if they still exist. Safe to run repeatedly.
  try {
    await pool.query(
      `DELETE FROM users WHERE email IN ('manager@store.local', 'cashier@store.local')`
    );
  } catch (err) {
    console.warn('Could not remove legacy seed accounts (non-fatal):', err.message);
  }

  // This app also used to seed 8 sample products across 5 categories on
  // every deploy, which made every fresh signup look like an already-used
  // store. Remove them once. If any of these products were used in a real
  // transaction, deletion is skipped for that one (FK constraint) rather
  // than breaking the deploy.
  try {
    await pool.query(`DELETE FROM products WHERE sku = ANY($1::text[])`, [LEGACY_SKUS]);
  } catch (err) {
    console.warn('Could not remove legacy seed products (non-fatal, likely referenced by a real sale):', err.message);
  }
  try {
    await pool.query(`DELETE FROM categories WHERE name = ANY($1::text[])`, [LEGACY_CATEGORY_NAMES]);
  } catch (err) {
    console.warn('Could not remove legacy seed categories (non-fatal):', err.message);
  }

  console.log('Cleanup complete: no sample data remains; legacy test accounts removed.');
  await pool.end();
}

cleanup().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
