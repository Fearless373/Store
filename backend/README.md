# Provision Store — Backend

Node.js + Express + MongoDB API for the Provision Store Management System.
Verification emails are sent through Resend.

## Setup

1. `cp .env.example .env` and fill in `MONGODB_URI`, `JWT_SECRET`, and the `RESEND_*` values.
2. `npm install`
3. `npm run seed` — creates indexes and loads sample categories/products/users (a manager and a cashier, both pre-verified, with real bcrypt-hashed passwords — no manual hash-generation step needed this time).
4. `npm run dev` (or `npm start`) — API runs on `http://localhost:4000`.

### MongoDB requirement

Checkout uses a multi-document transaction to deduct stock and record the
sale atomically, which requires MongoDB to be running as a **replica set**.
MongoDB Atlas's free (M0) tier already runs as a replica set, so this works
out of the box there. A local single-node `mongod` does not support
transactions unless you initialize it as a one-node replica set.

## Auth

Self-service signup, in two steps:

1. `POST /api/auth/register` with `{ first_name, last_name, email, password, confirm_password }`.
   Creates an unverified account (role defaults to `cashier`) and emails a 6-digit code via the Resend API.
2. `POST /api/auth/verify` with `{ email, code }`. On success, marks the account verified and returns a JWT — the user is now logged in.

Other auth endpoints:

- `POST /api/auth/resend-code` with `{ email }` — issues a fresh code if the first one expired (10 min TTL).
- `POST /api/auth/login` with `{ email, password }` — still available for already-verified accounts (e.g. the seeded manager), though the frontend's UI no longer has a login form.

Send the JWT as `Authorization: Bearer <token>` on subsequent requests.
Roles: `cashier` (POS + read-only inventory) and `manager` (full access).
There's no self-service way to become a manager — promote an account directly in MongoDB:
```js
db.users.updateOne({ email: "you@yourstore.com" }, { $set: { role: "manager" } })
```

## Notes on the checkout flow

`POST /api/transactions` runs inside a MongoDB session/transaction. Each
line item is deducted with an atomic conditional update
(`findOneAndUpdate` with a `stock_quantity: { $gte: quantity }` filter), so
concurrent checkouts at different counters can't oversell the same item. If
any item fails (not enough stock, invalid product), the whole transaction
rolls back — no partial sales.

## Data model

MongoDB is schemaless, but the app expects these collections/shapes:

- `users` — `first_name, last_name, email (unique), password_hash, role, email_verified, verification_code, verification_code_expires_at, created_at`
- `categories` — `name`
- `products` — `name, category_id (ObjectId ref, nullable), sku (unique, sparse), barcode, cost_price, selling_price, stock_quantity, low_stock_threshold, created_at`
- `transactions` — `user_id, cashier_name, total_amount, payment_method, items: [{ product_id, product_name, quantity, unit_price }], created_at`

Line items are embedded directly in each transaction document rather than
kept in a separate collection, since Mongo has no joins and the report/ledger
queries always need them together.

## Endpoints

See the project spec for the full list; all product/category writes and the
daily report are manager-only, everything else just requires a valid login.
