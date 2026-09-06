# Provision Store — Backend

Node.js + Express + PostgreSQL API for the Provision Store Management System.

## Setup

1. `cp .env.example .env` and fill in `DATABASE_URL` and `JWT_SECRET`.
2. `npm install`
3. Create the database (e.g. `createdb provision_store`), then:
   ```bash
   npm run migrate   # applies src/db/schema.sql
   npm run seed       # sample categories/products (no user accounts anymore)
   ```
4. `npm run dev` (or `npm start`) — API runs on `http://localhost:4000`.

## Auth

Plain email/password accounts, no email verification step:

- `POST /api/auth/register` — `{ first_name, last_name, email, password, confirm_password }`. Creates the account and returns a JWT immediately (auto-login).
- `POST /api/auth/login` — `{ email, password }`.
- `PUT /api/auth/password` (requires auth) — `{ current_password, new_password, confirm_new_password }`.
- `DELETE /api/auth/account` (requires auth) — `{ password }`. Must match the account's current password. Deletes the account; past transactions are kept but unlinked (`user_id` set to null).

There's no manager/cashier account distinction anymore. Every logged-in user
can use the checkout screen. Inventory, Categories, Dashboard, and
Transactions are gated **on the frontend only** by a shared passcode
(`Yaya1234` by default — see `frontend/README.md` to change it). This is a
lightweight UI gate, not a real authorization boundary: the backend API
endpoints for those features only require a valid login, not the passcode.
If you need real access control later, reintroduce a role check in the
route middleware.

## Notes on the checkout flow

`POST /api/transactions` wraps stock deduction, the transaction row, and its
line items in a single database transaction with row-level locking
(`SELECT ... FOR UPDATE`) on each product, so concurrent checkouts at
different counters can't oversell the same item.
