import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const emptyForm = { first_name: '', last_name: '', email: '', password: '', confirm_password: '' };

export default function SignUp() {
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirm_password) {
      setError('Password and confirmation do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    const ok = await register(form);
    setSubmitting(false);
    if (ok) navigate('/pos');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="font-display text-2xl font-semibold text-herb-700 mb-1">Provision Store</p>
        <p className="text-sm text-ink/60 mb-8">Create an account to open the counter.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="w-1/2">
              <label htmlFor="first_name" className="block text-sm mb-1 text-ink/70">First name</label>
              <input
                id="first_name" required value={form.first_name}
                onChange={(e) => update('first_name', e.target.value)}
                className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm focus:border-herb-500"
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="last_name" className="block text-sm mb-1 text-ink/70">Last name</label>
              <input
                id="last_name" required value={form.last_name}
                onChange={(e) => update('last_name', e.target.value)}
                className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm focus:border-herb-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm mb-1 text-ink/70">Email</label>
            <input
              id="email" type="email" required value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm focus:border-herb-500"
              placeholder="you@store.local"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-1 text-ink/70">Password</label>
            <input
              id="password" type="password" required value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm focus:border-herb-500"
            />
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-sm mb-1 text-ink/70">Confirm password</label>
            <input
              id="confirm_password" type="password" required value={form.confirm_password}
              onChange={(e) => update('confirm_password', e.target.value)}
              className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm focus:border-herb-500"
            />
          </div>

          {error && <p className="text-sm text-brick">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-herb-600 text-paper py-2 text-sm font-medium hover:bg-herb-700 disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-ink/60 mt-6 text-center">
          Already have an account? <Link to="/login" className="text-herb-700 hover:text-herb-800">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
