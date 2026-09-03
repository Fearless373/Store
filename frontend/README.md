# Provision Store — Frontend

React + Vite + Tailwind counter UI for the Provision Store Management System.

## Setup

1. `npm install`
2. Make sure the backend is running on `http://localhost:4000` (see `../backend/README.md`).
3. `npm run dev` — opens on `http://localhost:5173`. API calls to `/api/*` are proxied to the backend.

## Structure

- `src/pages/SignUp.jsx` — account creation: first/last name, email, password + confirmation, then a 6-digit email code step. Verifying logs the user straight in.
- `src/pages/POS.jsx` — checkout screen: category grid + search on the left, cart + payment on the right.
- `src/pages/Inventory.jsx`, `Categories.jsx` — manager-only CRUD.
- `src/pages/Dashboard.jsx` — daily revenue, payment reconciliation, top items, low-stock alerts.
- `src/pages/Transactions.jsx` — searchable transaction ledger with line-item detail.
- `src/context/AuthContext.jsx` — stores the JWT + user in `localStorage`, exposes `register`/`verify`/`resendCode`/`logout`.
- `src/api/client.js` — thin fetch wrapper for every backend endpoint.

## Design tokens

- Colors: `paper` (#FBFAF7) background, `ink` (#1F2A24) text, `herb` (#2F6B4F) primary, `ochre` (#E0A458) accent, `brick` (#C1462F) for low-stock/errors.
- Type: Space Grotesk for headings (`font-display`), Inter for body/UI.
- Structural style: borders and dividers rather than card shadows, since this is a fast-scanning counter tool, not a marketing page.
