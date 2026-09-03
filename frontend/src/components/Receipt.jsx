import React from 'react';

export default function Receipt({ transaction, onClose }) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4">
      <div className="bg-paper w-full max-w-xs p-6 border border-ink/10">
        <p className="font-display font-semibold text-center mb-1">Receipt</p>
        <p className="text-xs text-ink/50 text-center mb-4">
          {new Date(transaction.created_at || Date.now()).toLocaleString()}
        </p>

        <div className="divider" />

        <div className="py-3 space-y-1.5 text-sm">
          {transaction.items.map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <span className="truncate pr-2">{item.quantity}× {item.name}</span>
              <span className="shrink-0">GHS {(item.quantity * item.selling_price).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="divider pt-3 space-y-1 text-sm">
          <div className="flex justify-between font-display font-semibold text-base">
            <span>Total</span>
            <span>GHS {Number(transaction.total_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-ink/60">
            <span>Payment</span>
            <span>{transaction.payment_method}</span>
          </div>
          {transaction.payment_method === 'Cash' && transaction.change != null && (
            <div className="flex justify-between text-ink/60">
              <span>Change due</span>
              <span>GHS {transaction.change.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => window.print()}
            className="flex-1 border border-ink/20 py-2 text-sm hover:border-herb-500"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-herb-600 text-paper py-2 text-sm font-medium hover:bg-herb-700"
          >
            New sale
          </button>
        </div>
      </div>
    </div>
  );
}
