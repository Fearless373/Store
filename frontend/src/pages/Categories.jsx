import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Categories() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  function load() {
    api.getCategories(token).then(setCategories).catch(() => {});
  }
  useEffect(load, [token]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    await api.createCategory(token, newName.trim());
    setNewName('');
    load();
  }

  async function handleSave(id) {
    await api.updateCategory(token, id, editingName.trim());
    setEditingId(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this category? Products in it will become uncategorized.')) return;
    await api.deleteCategory(token, id);
    load();
  }

  return (
    <div className="p-6 max-w-md">
      <p className="font-display text-xl font-semibold mb-4">Categories</p>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="flex-1 border border-ink/20 bg-transparent px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-herb-600 text-paper px-4 text-sm font-medium hover:bg-herb-700">
          Add
        </button>
      </form>

      <ul className="divide-y divide-ink/5">
        {categories.map((c) => (
          <li key={c.id} className="py-2.5 flex items-center justify-between text-sm">
            {editingId === c.id ? (
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave(c.id)}
                className="flex-1 border border-ink/20 bg-transparent px-2 py-1 mr-2"
              />
            ) : (
              <span>{c.name}</span>
            )}
            <div className="space-x-3 shrink-0">
              {editingId === c.id ? (
                <button onClick={() => handleSave(c.id)} className="text-herb-700 hover:underline">Save</button>
              ) : (
                <button
                  onClick={() => { setEditingId(c.id); setEditingName(c.name); }}
                  className="text-herb-700 hover:underline"
                >
                  Rename
                </button>
              )}
              <button onClick={() => handleDelete(c.id)} className="text-brick hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
