import React, { useMemo } from 'react';

export default function Cart({ items, onChangeQuantity, onRemove, discount, onDiscountChange }) {
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.selling_price * i.quantity, 0),
    [items]
  );
  const total = Math.max(subtotal - Number(discount || 0), 0);

  return (
    <div className="flex flex-col h-full border-l border-ink/10 pl-4">
      <p className="font-display font-semibold mb-3">Current sale</p>

      <div className="flex-1 overflow-y-auto space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-ink/50">Cart is empty. Tap a product to add it.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
            <div className="min-w-0">
              <p className="truncate">{item.name}</p>
              <p className="text-xs text-ink/50">GHS {item.selling_price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onChangeQuantity(item.id, item.quantity - 1)}
                className="w-6 h-6 border border-ink/20 text-xs hover:border-herb-500"
                aria-label={`Decrease ${item.name} quantity`}
              >
                −
              </button>
              <span className="w-5 text-center">{item.quantity}</span>
              <button
                onClick={() => onChangeQuantity(item.id, item.quantity + 1)}
                className="w-6 h-6 border border-ink/20 text-xs hover:border-herb-500"
                aria-label={`Increase ${item.name} quantity`}
              >
                +
              </button>
              <button
                onClick={() => onRemove(item.id)}
                className="text-xs text-brick ml-1"
                aria-label={`Remove ${item.name}`}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="divider pt-3 mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-ink/60">Subtotal</span>
          <span>GHS {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <label htmlFor="discount" className="text-ink/60">Discount</label>
          <input
            id="discount"
            type="number"
            min="0"
            step="0.01"
            value={discount}
            onChange={(e) => onDiscountChange(e.target.value)}
            className="w-24 border border-ink/20 bg-transparent px-2 py-1 text-right text-sm"
          />
        </div>
        <div className="flex justify-between font-display font-semibold text-base pt-1">
          <span>Total</span>
          <span>GHS {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
