import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ChangePasswordModal({ onClose }) {
  const { changePassword, error, setError } = useAuth();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_new_password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (form.new_password !== form.confirm_new_password) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    const ok = await changePassword(form);
    setSubmitting(false);
    if (ok) setDone(true);
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4">
      <div className="bg-paper w-full max-w-sm p-6 border border-ink/10">
        <p className="font-display font-semibold mb-4">Change password</p>

        {done ? (
          <>
            <p className="text-sm text-herb-700 mb-6">Your password has been updated.</p>
            <button
              onClick={onClose}
              className="w-full bg-herb-600 text-paper py-2 text-sm font-medium hover:bg-herb-700"
            >
              Done
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div>
              <label htmlFor="current_password" className="block mb-1 text-ink/70">Current password</label>
              <input
                id="current_password" type="password" required
                value={form.current_password}
                onChange={(e) => update('current_password', e.target.value)}
                className="w-full border border-ink/20 bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="new_password" className="block mb-1 text-ink/70">New password</label>
              <input
                id="new_password" type="password" required
                value={form.new_password}
                onChange={(e) => update('new_password', e.target.value)}
                className="w-full border border-ink/20 bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="confirm_new_password" className="block mb-1 text-ink/70">Confirm new password</label>
              <input
                id="confirm_new_password" type="password" required
                value={form.confirm_new_password}
                onChange={(e) => update('confirm_new_password', e.target.value)}
                className="w-full border border-ink/20 bg-transparent px-3 py-2"
              />
            </div>

            {error && <p className="text-brick">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-ink/20 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-herb-600 text-paper py-2 font-medium hover:bg-herb-700 disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
