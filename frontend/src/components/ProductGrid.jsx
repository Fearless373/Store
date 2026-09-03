import React from 'react';

export default function ProductGrid({ products, categories, activeCategory, onSelectCategory, onAddToCart }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 divider">
        <button
          onClick={() => onSelectCategory(null)}
          className={`shrink-0 px-3 py-1.5 text-sm border ${
            activeCategory === null
              ? 'border-herb-600 text-herb-700 font-medium'
              : 'border-ink/15 text-ink/60 hover:border-ink/30'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectCategory(c.id)}
            className={`shrink-0 px-3 py-1.5 text-sm border ${
              activeCategory === c.id
                ? 'border-herb-600 text-herb-700 font-medium'
                : 'border-ink/15 text-ink/60 hover:border-ink/30'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-1">
        {products.length === 0 && (
          <p className="col-span-full text-sm text-ink/50 py-8 text-center">
            No products match. Try a different search or category.
          </p>
        )}
        {products.map((p) => {
          const outOfStock = p.stock_quantity <= 0;
          return (
            <button
              key={p.id}
              disabled={outOfStock}
              onClick={() => onAddToCart(p)}
              className={`product-tile text-left border border-ink/10 p-3 hover:border-herb-500 transition-colors ${
                outOfStock ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <p className="text-sm font-medium leading-snug">{p.name}</p>
              <p className="text-xs text-ink/50 mt-1">{p.category_name || 'Uncategorized'}</p>
              <div className="flex items-baseline justify-between mt-3">
                <span className="font-display font-semibold">GHS {Number(p.selling_price).toFixed(2)}</span>
                <span className={`text-xs ${p.stock_quantity <= p.low_stock_threshold ? 'text-brick' : 'text-ink/40'}`}>
                  {outOfStock ? 'Out of stock' : `${p.stock_quantity} left`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
