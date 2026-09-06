import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import UserMenu from './UserMenu';

const navItems = [
  { to: '/pos', label: 'Checkout' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/dashboard', label: 'Dashboard' },
];

const navItemClass = ({ isActive }) =>
  `nav-item block px-4 py-2.5 text-sm transition-colors ${
    isActive ? 'text-herb-700 font-medium bg-herb-50' : 'text-ink/60 hover:text-ink hover:bg-ink/[0.03]'
  }`;

const mobileNavItemClass = ({ isActive }) =>
  `flex-1 text-center py-2.5 text-xs ${isActive ? 'text-herb-700 font-medium' : 'text-ink/60'}`;

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row page-enter">
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-ink/10 bg-[#fffdf8]/90 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="brand-mark" aria-hidden="true">P</span>
          <p className="font-display font-semibold text-herb-700">Provision Store</p>
        </div>
        <div className="flex items-center gap-3">
          <UserMenu />
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            className="w-9 h-9 grid place-items-center border border-ink/15"
          >
            <span aria-hidden="true">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </header>

      {/* Mobile dropdown nav */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-b border-ink/10 bg-[#fffdf8] px-3 py-2 space-y-1 sticky top-[57px] z-20">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={navItemClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-ink/10 bg-[#fffdf8]/70 flex-col">
        <div className="px-5 py-6 flex items-center gap-3">
          <span className="brand-mark" aria-hidden="true">P</span>
          <div>
            <p className="font-display text-lg font-semibold text-herb-700 leading-tight">Provision</p>
            <p className="font-display text-lg font-semibold text-ink leading-tight">Store</p>
          </div>
        </div>
        <nav className="flex-1 mt-2 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navItemClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 divider bg-[#f7f3eb]/60 flex items-center justify-between">
          <span className="text-sm text-ink/60">Account</span>
          <UserMenu />
        </div>
      </aside>

      <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>

      {/* Mobile bottom tab bar — quick access without opening the menu */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-ink/10 bg-[#fffdf8]/95 backdrop-blur flex z-30">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={mobileNavItemClass}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
