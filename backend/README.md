# Provision Store — Backend

Node.js + Express + PostgreSQL API for the Provision Store Management System.

## Setup

1. `cp .env.example .env` and fill in `DATABASE_URL` and `JWT_SECRET`.
2. `npm install`
3. Create the database (e.g. `createdb provision_store`).
4. `npm run migrate` — applies `src/db/schema.sql`.
   Add `-- --seed` (i.e. `node src/db/migrate.js --seed`) to also load sample data from `src/db/seed.sql`.
5. `npm run dev` (or `npm start`) — API runs on `http://localhost:4000`.

## Auth

Self-service signup, in two steps:

1. `POST /api/auth/register` with `{ first_name, last_name, email, password, confirm_password }`.
   Creates an unverified account (role defaults to `cashier`) and emails a 6-digit code via SMTP (`.env` `SMTP_*` vars — required for this to work).
2. `POST /api/auth/verify` with `{ email, code }`. On success, marks the account verified and returns a JWT — the user is now logged in.

Other auth endpoints:

- `POST /api/auth/resend-code` with `{ email }` — issues a fresh code if the first one expired (10 min TTL).
- `POST /api/auth/login` with `{ email, password }` — still available for already-verified accounts (e.g. the seeded manager), though the frontend's UI no longer has a login form.

Send the JWT as `Authorization: Bearer <token>` on subsequent requests.
Roles: `cashier` (POS + read-only inventory) and `manager` (full access).
There's no self-service way to become a manager — promote an account with:
`UPDATE users SET role = 'manager' WHERE email = '...';`

## Notes on the checkout flow

`POST /api/transactions` wraps stock deduction, the transaction row, and its
line items in a single database transaction with row-level locking
(`SELECT ... FOR UPDATE`) on each product, so concurrent checkouts at
different counters can't oversell the same item.

## Endpoints

See the project spec for the full list; all product/category writes and the
daily report are manager-only, everything else just requires a valid login.
