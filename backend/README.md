# Provision Store — Backend

Node.js + Express + PostgreSQL API for the Provision Store Management System.
Verification emails are sent through the Resend API.

## Setup

1. `cp .env.example .env` and fill in `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`.
2. `npm install`
3. Create the database (e.g. `createdb provision_store`), then:
   ```bash
   npm run migrate   # applies src/db/schema.sql
   npm run seed       # optional: sample categories/products + a manager/cashier login
   ```
4. `npm run dev` (or `npm start`) — API runs on `http://localhost:4000`.

## Auth

Self-service signup, in two steps:

1. `POST /api/auth/register` — `{ first_name, last_name, email, password, confirm_password }`. Creates an unverified account (`cashier` role by default) and emails a 6-digit code via Resend.
2. `POST /api/auth/verify` — `{ email, code }`. Marks the account verified and returns a JWT (auto-login).

Also available: `POST /api/auth/resend-code` (`{ email }`) and `POST /api/auth/login` (`{ email, password }`, for already-verified accounts).

Roles: `cashier` and `manager`. New signups always get `cashier` — promote someone with:
```sql
UPDATE users SET role = 'manager' WHERE email = '...';
```

## Notes on the checkout flow

`POST /api/transactions` wraps stock deduction, the transaction row, and its
line items in a single database transaction with row-level locking
(`SELECT ... FOR UPDATE`) on each product, so concurrent checkouts at
different counters can't oversell the same item.
