import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  name: '', category_name: '', sku: '', barcode: '',
  cost_price: '', selling_price: '', stock_quantity: '', low_stock_threshold: '5',
};

export default function Inventory() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);

  function loadProducts() {
    api.getProducts(token, showLowStockOnly ? { low_stock: 'true' } : {}).then(setProducts).catch(() => {});
  }

  useEffect(() => { loadProducts(); }, [token, showLowStockOnly]);
  useEffect(() => { api.getCategories(token).then(setCategories).catch(() => {}); }, [token]);

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category_name: product.category_name || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const payload = {
      ...form,
      category_name: form.category_name.trim() || null,
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      stock_quantity: Number(form.stock_quantity),
      low_stock_threshold: Number(form.low_stock_threshold),
    };
    try {
      if (editingId) {
        await api.updateProduct(token, editingId, payload);
      } else {
        await api.createProduct(token, payload);
      }
      resetForm();
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this product?')) return;
    await api.deleteProduct(token, id);
    loadProducts();
  }

  return (
    <div className="p-6 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="font-display text-xl font-semibold">Inventory</p>
          <div className="flex items-center gap-4">
            <Link to="/categories" className="text-sm text-herb-700 hover:underline">
              Manage categories
            </Link>
            <label className="flex items-center gap-2 text-sm text-ink/60">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
              />
              Low stock only
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-ink/50 divider">
              <th className="py-2 font-normal">Product</th>
              <th className="py-2 font-normal">Category</th>
              <th className="py-2 font-normal">Stock</th>
              <th className="py-2 font-normal">Price</th>
              <th className="py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const low = p.stock_quantity <= p.low_stock_threshold;
              return (
                <tr key={p.id} className="border-b border-ink/5">
                  <td className="py-2.5">{p.name}</td>
                  <td className="py-2.5 text-ink/60">{p.category_name || '—'}</td>
                  <td className={`py-2.5 ${low ? 'text-brick font-medium' : ''}`}>
                    {p.stock_quantity} {low && '· low'}
                  </td>
                  <td className="py-2.5">GHS {Number(p.selling_price).toFixed(2)}</td>
                  <td className="py-2.5 text-right space-x-3">
                    <button onClick={() => startEdit(p)} className="text-herb-700 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-brick hover:underline">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <div>
        <p className="font-display font-semibold mb-3">{editingId ? 'Edit product' : 'Add product'}</p>
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <input required placeholder="Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-ink/20 bg-transparent px-3 py-2" />

          <input
            list="category-suggestions"
            placeholder="Category (type to create a new one)"
            value={form.category_name}
            onChange={(e) => setForm({ ...form, category_name: e.target.value })}
            className="w-full border border-ink/20 bg-transparent px-3 py-2" />
          <datalist id="category-suggestions">
            {categories.map((c) => <option key={c.id} value={c.name} />)}
          </datalist>

          <div className="flex gap-2">
            <input placeholder="SKU" value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="w-1/2 border border-ink/20 bg-transparent px-3 py-2" />
            <input placeholder="Barcode" value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              className="w-1/2 border border-ink/20 bg-transparent px-3 py-2" />
          </div>

          <div className="flex gap-2">
            <input required type="number" step="0.01" placeholder="Cost price" value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
              className="w-1/2 border border-ink/20 bg-transparent px-3 py-2" />
            <input required type="number" step="0.01" placeholder="Selling price" value={form.selling_price}
              onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
              className="w-1/2 border border-ink/20 bg-transparent px-3 py-2" />
          </div>

          <div className="flex gap-2">
            <input required type="number" placeholder="Stock qty" value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
              className="w-1/2 border border-ink/20 bg-transparent px-3 py-2" />
            <input type="number" placeholder="Low stock at" value={form.low_stock_threshold}
              onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
              className="w-1/2 border border-ink/20 bg-transparent px-3 py-2" />
          </div>

          {error && <p className="text-brick">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-herb-600 text-paper py-2 font-medium hover:bg-herb-700">
              {editingId ? 'Save changes' : 'Add product'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="px-3 border border-ink/20">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
