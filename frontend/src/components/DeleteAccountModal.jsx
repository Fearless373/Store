import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DeleteAccountModal({ onClose }) {
  const { deleteAccount, logout, error, setError } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const ok = await deleteAccount(password);
    setSubmitting(false);
    if (ok) {
      logout();
      navigate('/signup');
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4">
      <div className="bg-paper w-full max-w-sm p-6 border border-ink/10">
        <p className="font-display font-semibold mb-2 text-brick">Delete account</p>
        <p className="text-sm text-ink/60 mb-4">
          This can't be undone. Re-enter your password to confirm.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label htmlFor="delete_password" className="block mb-1 text-ink/70">Password</label>
            <input
              id="delete_password" type="password" required autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              className="flex-1 bg-brick text-paper py-2 font-medium hover:bg-brick/90 disabled:opacity-60"
            >
              {submitting ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
