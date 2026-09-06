import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { token } = useAuth();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    api.getDailyReport(token, date).then(setReport).catch(() => setReport(null));
  }, [token, date]);

  useEffect(() => {
    api.getProducts(token, { low_stock: 'true' }).then(setLowStock).catch(() => {});
  }, [token]);

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <p className="font-display text-xl font-semibold">Daily summary</p>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-ink/20 bg-transparent px-3 py-1.5 text-sm"
        />
      </div>

      {report && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 divider pb-6 mb-6">
            <Stat label="Revenue" value={`GHS ${Number(report.total_revenue).toFixed(2)}`} />
            <Stat label="Transactions" value={report.transaction_count} />
            <Stat
              label="Avg. sale"
              value={`GHS ${report.transaction_count ? (report.total_revenue / report.transaction_count).toFixed(2) : '0.00'}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="font-display font-semibold mb-3">Payment reconciliation</p>
              {report.payment_breakdown.length === 0 && <p className="text-sm text-ink/50">No sales yet.</p>}
              <ul className="space-y-2 text-sm">
                {report.payment_breakdown.map((row) => (
                  <li key={row.payment_method} className="flex justify-between">
                    <span className="text-ink/70">{row.payment_method} ({row.count})</span>
                    <span>GHS {Number(row.total).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-display font-semibold mb-3">Top-selling items</p>
              {report.top_items.length === 0 && <p className="text-sm text-ink/50">No sales yet.</p>}
              <ul className="space-y-2 text-sm">
                {report.top_items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span className="text-ink/70">{item.name}</span>
                    <span>{item.units_sold} sold</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      <div className="mt-10">
        <p className="font-display font-semibold mb-3 text-brick">Low stock alerts</p>
        {lowStock.length === 0 ? (
          <p className="text-sm text-ink/50">Everything is well stocked.</p>
        ) : (
          <ul className="divide-y divide-ink/5 text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="py-2 flex justify-between">
                <span>{p.name}</span>
                <span className="text-brick">{p.stock_quantity} left (reorder at {p.low_stock_threshold})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-ink/50 mt-0.5">{label}</p>
    </div>
  );
}
