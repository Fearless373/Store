import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Transactions() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.getTransactions(token, search ? { search } : {}).then(setTransactions).catch(() => {});
  }, [token, search]);

  async function viewDetail(id) {
    const detail = await api.getTransaction(token, id);
    setSelected(detail);
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="font-display text-xl font-semibold">Transaction history</p>
          <input
            placeholder="Search by cashier or payment method…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-ink/20 bg-transparent px-3 py-1.5 text-sm w-64"
          />
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink/50 divider">
              <th className="py-2 font-normal">#</th>
              <th className="py-2 font-normal">Date</th>
              <th className="py-2 font-normal">Cashier</th>
              <th className="py-2 font-normal">Payment</th>
              <th className="py-2 font-normal text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr
                key={t.id}
                onClick={() => viewDetail(t.id)}
                className="border-b border-ink/5 cursor-pointer hover:bg-herb-50"
              >
                <td className="py-2.5">{t.id}</td>
                <td className="py-2.5">{new Date(t.created_at).toLocaleString()}</td>
                <td className="py-2.5">{t.cashier_name}</td>
                <td className="py-2.5">{t.payment_method}</td>
                <td className="py-2.5 text-right">GHS {Number(t.total_amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p className="font-display font-semibold mb-3">Line items</p>
        {!selected ? (
          <p className="text-sm text-ink/50">Select a transaction to see its items.</p>
        ) : (
          <div className="text-sm space-y-2">
            {selected.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.quantity}× {item.product_name}</span>
                <span>GHS {(item.quantity * item.unit_price).toFixed(2)}</span>
              </div>
            ))}
            <div className="divider pt-2 flex justify-between font-medium">
              <span>Total</span>
              <span>GHS {Number(selected.total_amount).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
