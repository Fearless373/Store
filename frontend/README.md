# Provision Store — Frontend

React + Vite + Tailwind counter UI for the Provision Store Management System.
Responsive: a fixed sidebar + full split-pane checkout on desktop, and a
hamburger/bottom-tab layout with a naturally-scrolling page on mobile.

## Setup

1. `npm install`
2. `cp .env.example .env` — for local dev you can leave `VITE_API_URL` unset (Vite proxies `/api` to `http://localhost:4000`). Set `VITE_MANAGER_PASSCODE` to change the manager passcode from the default `Yaya1234`.
3. `npm run dev` — opens on `http://localhost:5173`.

## Structure

- `src/pages/login.jsx`, `SignUp.jsx` — plain email/password auth, no email verification step. Registering logs you straight in.
- `src/pages/POS.jsx` — checkout screen, open to any logged-in account.
- `src/pages/Inventory.jsx`, `Categories.jsx`, `Dashboard.jsx`, `Transactions.jsx` — gated behind `PasscodeGate` (see below). Any logged-in user who knows the passcode can reach these; there's no separate manager account anymore.
- `src/components/PasscodeGate.jsx` — client-side passcode prompt (`VITE_MANAGER_PASSCODE`, default `Yaya1234`). Unlocking is remembered for the browser session (`sessionStorage`).
- `src/components/UserMenu.jsx` — the account icon in the sidebar (desktop) / top bar (mobile): change password, sign out, delete account.
- `src/components/Layout.jsx` — responsive shell: sidebar + nav on desktop (`md:` and up), hamburger dropdown + fixed bottom tab bar on mobile.
- `src/context/AuthContext.jsx` — stores the JWT + user in `localStorage`, exposes `login`/`register`/`changePassword`/`deleteAccount`/`logout`.
- `src/api/client.js` — thin fetch wrapper for every backend endpoint.

## Manager passcode caveat

`PasscodeGate` is a UI convenience, not real security — it only hides the
nav links and page content in the browser. The underlying API endpoints
(`/api/products`, `/api/categories`, `/api/reports/*`, `/api/transactions`)
only require a normal login, not the passcode. Anyone with valid account
credentials and a REST client could call them directly. If you need real
access control, add a role or permission check back into the backend
middleware (`backend/src/middleware/auth.js` and the route files).
