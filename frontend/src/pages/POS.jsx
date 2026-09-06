import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProductGrid from '../components/ProductGrid';
import Cart from '../components/Cart';
import Receipt from '../components/Receipt';

const PAYMENT_METHODS = ['Cash', 'Mobile Money'];

export default function POS() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashGiven, setCashGiven] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getCategories(token).then(setCategories).catch(() => {});
  }, [token]);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (activeCategory) params.category_id = activeCategory;
    api.getProducts(token, params).then(setProducts).catch(() => {});
  }, [token, search, activeCategory]);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev;
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        selling_price: Number(product.selling_price),
        quantity: 1,
        stock_quantity: product.stock_quantity,
      }];
    });
  }

  function changeQuantity(id, quantity) {
    setCart((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, quantity: Math.min(quantity, i.stock_quantity) } : i));
    });
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  const total = useMemo(() => {
    const subtotal = cart.reduce((sum, i) => sum + i.selling_price * i.quantity, 0);
    return Math.max(subtotal - Number(discount || 0), 0);
  }, [cart, discount]);

  const change = paymentMethod === 'Cash' && cashGiven
    ? Math.max(Number(cashGiven) - total, 0)
    : null;

  async function handleCheckout() {
    setError(null);
    setCheckingOut(true);
    try {
      const result = await api.checkout(token, {
        payment_method: paymentMethod,
        items: cart.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      });
      const itemsWithNames = result.items.map((line) => {
        const cartItem = cart.find((c) => c.id === line.product_id);
        return { ...line, name: cartItem?.name, selling_price: line.unit_price };
      });
      setReceipt({ ...result, items: itemsWithNames, change });
      setCart([]);
      setDiscount('0');
      setCashGiven('');
      // refresh stock counts shown on the grid
      api.getProducts(token, activeCategory ? { category_id: activeCategory } : {}).then(setProducts);
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="flex flex-col p-4 sm:p-6 pb-24 md:pb-6 md:h-screen page-enter">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Point of sale</p>
          <p className="font-display text-xl font-semibold">Make today’s sale count.</p>
        </div>
        <input
          type="text"
          placeholder="Search by name, SKU, or barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border border-ink/20 bg-white/50 px-3 py-2 text-sm focus:border-herb-500"
        />
      </div>

      {error && <p className="text-sm text-brick mb-3">{error}</p>}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 md:min-h-0">
        <ProductGrid
          products={products}
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          onAddToCart={addToCart}
        />

        <div className="flex flex-col min-h-0">
          <Cart
            items={cart}
            onChangeQuantity={changeQuantity}
            onRemove={removeItem}
            discount={discount}
            onDiscountChange={setDiscount}
          />

          <div className="border-l-0 md:border-l border-ink/10 pl-0 md:pl-4 pt-4 space-y-3">
            <div className="flex gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`flex-1 px-2 py-1.5 text-xs border ${
                    paymentMethod === method
                      ? 'border-herb-600 text-herb-700 font-medium'
                      : 'border-ink/15 text-ink/60'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {paymentMethod === 'Cash' && (
              <div className="flex justify-between items-center text-sm">
                <label htmlFor="cashGiven" className="text-ink/60">Cash given</label>
                <input
                  id="cashGiven"
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  className="w-24 border border-ink/20 bg-transparent px-2 py-1 text-right text-sm"
                />
              </div>
            )}
            {change !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-ink/60">Change due</span>
                <span className="font-medium">GHS {change.toFixed(2)}</span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkingOut}
              className="w-full bg-herb-600 text-paper py-2.5 text-sm font-medium hover:bg-herb-700 disabled:opacity-50"
            >
              {checkingOut ? 'Processing…' : 'Charge customer'}
            </button>
          </div>
        </div>
      </div>

      <Receipt transaction={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
