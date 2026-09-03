const { getDB } = require('../config/db');

function dayRange(dateStr) {
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);
  return { start, end };
}

// GET /api/reports/daily?date=YYYY-MM-DD  (defaults to today, UTC)
async function dailyReport(req, res) {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const { start, end } = dayRange(date);
  const transactions = getDB().collection('transactions');

  try {
    const match = { created_at: { $gte: start, $lte: end } };

    const [summary] = await transactions.aggregate([
      { $match: match },
      { $group: { _id: null, transaction_count: { $sum: 1 }, total_revenue: { $sum: '$total_amount' } } },
    ]).toArray();

    const byPaymentMethod = await transactions.aggregate([
      { $match: match },
      { $group: { _id: '$payment_method', count: { $sum: 1 }, total: { $sum: '$total_amount' } } },
      { $sort: { total: -1 } },
    ]).toArray();

    const topItems = await transactions.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product_id',
          name: { $first: '$items.product_name' },
          units_sold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.unit_price'] } },
        },
      },
      { $sort: { units_sold: -1 } },
      { $limit: 10 },
    ]).toArray();

    res.json({
      date,
      transaction_count: summary?.transaction_count || 0,
      total_revenue: summary?.total_revenue || 0,
      payment_breakdown: byPaymentMethod.map((row) => ({
        payment_method: row._id,
        count: row.count,
        total: row.total,
      })),
      top_items: topItems.map((row) => ({
        id: row._id ? row._id.toString() : null,
        name: row.name,
        units_sold: row.units_sold,
        revenue: row.revenue,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate daily report.' });
  }
}

module.exports = { dailyReport };
