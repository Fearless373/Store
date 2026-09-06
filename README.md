# Provision Store Management System

React + Tailwind frontend, Node/Express + PostgreSQL backend.

## What changed in this version

- **No email verification.** Signing up creates the account and logs you in immediately.
- **No manager/cashier account distinction.** Every account can use Checkout. Inventory, Categories, Dashboard, and Transactions are behind a shared passcode (default `Yaya1234`, changeable via `VITE_MANAGER_PASSCODE`) instead of a role — see the caveat in `frontend/README.md`.
- **Account menu** (icon in the sidebar/top bar): change password, sign out, delete account (re-enter your password to confirm).
- **Responsive layout**: sidebar + split-pane checkout on desktop; hamburger menu + fixed bottom tab bar + naturally-scrolling pages on mobile.

## Structure

```
Store-main/
├── backend/   Express API + PostgreSQL (see backend/README.md)
└── frontend/  React + Vite + Tailwind UI (see frontend/README.md)
```

## Deployment

This project is already live:
- Backend: Render (`provision-store-backend`), connected to a Render Postgres database.
- Frontend: Vercel (`provision-store-frontend`), auto-deploys on push to `main`.

To push this update: replace both `backend/` and `frontend/` folders in the
GitHub repo with the contents of this package, commit, and push. Render and
Vercel will redeploy automatically. Render's start command
(`node src/db/migrate.js && node src/db/seed.js && node src/server.js`) will
apply the schema and clean up the old manager/cashier seed accounts
automatically on that redeploy.
