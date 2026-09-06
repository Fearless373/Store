import React, { useState } from 'react';

const MANAGER_PASSCODE = import.meta.env.VITE_MANAGER_PASSCODE || 'Yaya1234';
const SESSION_KEY = 'ps_manager_unlocked';

// Wraps manager-only pages (Inventory, Categories, Dashboard, Transactions).
// This is a lightweight client-side gate, not real authorization — the API
// routes behind it only require a normal login. See backend/README.md.
export default function PasscodeGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (code === MANAGER_PASSCODE) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setUnlocked(true);
      setError(null);
    } else {
      setError('Incorrect passcode.');
    }
  }

  if (unlocked) return children;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <p className="font-display text-xl font-semibold text-herb-700 mb-1">Manager access</p>
        <p className="text-sm text-ink/60 mb-6">Enter the passcode to continue.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm text-center tracking-widest focus:border-herb-500"
            placeholder="Passcode"
          />
          {error && <p className="text-sm text-brick text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-herb-600 text-paper py-2 text-sm font-medium hover:bg-herb-700"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
