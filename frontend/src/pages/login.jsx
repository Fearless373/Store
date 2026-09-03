import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const ok = await login(form.email, form.password);
    setSubmitting(false);
    if (ok) navigate('/pos');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 page-enter">
      <div className="w-full max-w-sm auth-panel">
        <p className="font-display text-2xl font-semibold text-herb-700 mb-1">Provision Store</p>
        <p className="text-sm text-ink/60 mb-8">Sign in to open the counter.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1 text-ink/70">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm focus:border-herb-500"
              placeholder="you@store.local"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-1 text-ink/70">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => update('password', event.target.value)}
              className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm focus:border-herb-500"
            />
          </div>

          {error && <p className="text-sm text-brick">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-herb-600 text-paper py-2 text-sm font-medium hover:bg-herb-700 disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-ink/60 mt-6 text-center">
          Need an account? <Link to="/signup" className="text-herb-700 hover:text-herb-800">Create one</Link>
        </p>
      </div>
    </div>
  );
}