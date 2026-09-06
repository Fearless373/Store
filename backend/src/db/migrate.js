require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Schema applied.');

  // Let deleting your own account (or a future admin action) succeed even if
  // you have past transactions — keep the sale record, just drop the link.
  try {
    await pool.query(`
      ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
      ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    `);
    console.log('Transactions FK updated to ON DELETE SET NULL.');
  } catch (err) {
    console.warn('Could not update transactions FK (non-fatal):', err.message);
  }

  await pool.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
