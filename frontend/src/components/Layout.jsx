import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItemClass = ({ isActive }) =>
  `nav-item block px-4 py-2.5 text-sm transition-colors ${
    isActive ? 'text-herb-700 font-medium bg-herb-50' : 'text-ink/60 hover:text-ink hover:bg-ink/[0.03]'
  }`;

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/signup');
  }

  return (
    <div className="min-h-screen flex page-enter">
      <aside className="w-56 shrink-0 border-r border-ink/10 bg-[#fffdf8]/70 flex flex-col">
        <div className="px-5 py-6 flex items-center gap-3">
          <span className="brand-mark" aria-hidden="true">P</span>
          <div>
            <p className="font-display text-lg font-semibold text-herb-700 leading-tight">Provision</p>
            <p className="font-display text-lg font-semibold text-ink leading-tight">Store</p>
          </div>
        </div>
        <nav className="flex-1 mt-2 px-3 space-y-1">
          <NavLink to="/pos" className={navItemClass}>Checkout</NavLink>
          {user?.role === 'manager' && (
            <>
              <NavLink to="/inventory" className={navItemClass}>Inventory</NavLink>
              <NavLink to="/categories" className={navItemClass}>Categories</NavLink>
              <NavLink to="/dashboard" className={navItemClass}>Dashboard</NavLink>
              <NavLink to="/transactions" className={navItemClass}>Transactions</NavLink>
            </>
          )}
        </nav>
        <div className="px-5 py-4 divider bg-[#f7f3eb]/60">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-ink/50 capitalize mb-3">{user?.role}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-brick hover:underline"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
