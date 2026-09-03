const pool = require('../config/db');

// GET /api/reports/daily?date=YYYY-MM-DD  (defaults to today, server timezone)
async function dailyReport(req, res) {
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  try {
    const summary = await pool.query(
      `SELECT
         COUNT(*)::int AS transaction_count,
         COALESCE(SUM(total_amount), 0) AS total_revenue
       FROM transactions
       WHERE created_at::date = $1`,
      [date]
    );

    const byPaymentMethod = await pool.query(
      `SELECT payment_method, COUNT(*)::int AS count, COALESCE(SUM(total_amount), 0) AS total
       FROM transactions
       WHERE created_at::date = $1
       GROUP BY payment_method
       ORDER BY total DESC`,
      [date]
    );

    const topItems = await pool.query(
      `SELECT p.id, p.name, SUM(ti.quantity)::int AS units_sold,
              SUM(ti.quantity * ti.unit_price) AS revenue
       FROM transaction_items ti
       JOIN transactions t ON t.id = ti.transaction_id
       JOIN products p ON p.id = ti.product_id
       WHERE t.created_at::date = $1
       GROUP BY p.id, p.name
       ORDER BY units_sold DESC
       LIMIT 10`,
      [date]
    );

    res.json({
      date,
      transaction_count: summary.rows[0].transaction_count,
      total_revenue: summary.rows[0].total_revenue,
      payment_breakdown: byPaymentMethod.rows,
      top_items: topItems.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate daily report.' });
  }
}

module.exports = { dailyReport };
