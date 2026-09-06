import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import DeleteAccountModal from './DeleteAccountModal';

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function UserMenu({ dropDown = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(null); // null | 'password' | 'delete'
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSignOut() {
    setOpen(false);
    logout();
    navigate('/signup');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-herb-600 text-paper font-display font-semibold text-sm grid place-items-center hover:bg-herb-700"
        aria-label="Account menu"
      >
        {initials(user?.name)}
      </button>

      {open && (
        <div className={`absolute right-0 ${dropDown ? 'top-full mt-2' : 'bottom-full mb-2'} w-48 bg-paper border border-ink/10 shadow-lg text-sm z-40`}>
          <div className="px-3 py-2 border-b border-ink/10">
            <p className="font-medium truncate">{user?.name}</p>
            <p className="text-xs text-ink/50 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => { setModal('password'); setOpen(false); }}
            className="w-full text-left px-3 py-2 hover:bg-ink/[0.04]"
          >
            Change password
          </button>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 hover:bg-ink/[0.04]"
          >
            Sign out
          </button>
          <button
            onClick={() => { setModal('delete'); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-brick hover:bg-brick/5"
          >
            Delete account
          </button>
        </div>
      )}

      {modal === 'password' && <ChangePasswordModal onClose={() => setModal(null)} />}
      {modal === 'delete' && <DeleteAccountModal onClose={() => setModal(null)} />}
    </div>
  );
}
