# Fundsroom Infotech — Mini ERP + CRM Operations Portal

A small internal ERP/CRM for a wholesale/distribution business: customers, product inventory,
stock movements, and sales challans, gated behind role-based JWT auth (Admin, Sales, Warehouse,
Accounts).

## Architecture

- **Backend**: Node.js + TypeScript + Express + PostgreSQL (`pg`). Stateless REST API, JWT auth
  via `Authorization: Bearer <token>`, role middleware on every route group.
- **Frontend**: React + TypeScript + Vite, single-page app, no router — tabs are controlled by
  component state and filtered per the logged-in user's role.
- **Database**: PostgreSQL (`schema.sql`), 6 tables — `users`, `customers`, `products`,
  `stock_movements`, `challans`, `challan_items`.

Two design decisions worth calling out:

1. **Challan confirmation is transactional and row-locked.** `POST /challans` (when submitted as
   `confirmed`) and `POST /challans/:id/confirm` both open a DB transaction, lock the relevant
   product rows with `SELECT ... FOR UPDATE`, check `current_stock` before decrementing, and roll
   back the whole operation if any line item has insufficient stock. This is what prevents two
   concurrent confirmations from double-spending the same stock.
2. **Challan items store a product snapshot (`product_snapshot jsonb`), not just a `product_id`
   foreign key.** If a product's price or name changes later, historical challans still show what
   was actually sold at the time — the snapshot is captured once, at creation time, and never
   re-read from the live `products` row.

## Local setup

### 1. Database

Run `schema.sql` against your PostgreSQL instance (Supabase SQL editor, or `psql`) before
starting the backend. It's idempotent (`create table if not exists`), safe to re-run.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in the values, see "Environment variables" below
npm run dev
```

Runs on `http://localhost:4000` by default. On first boot, if the `users` table is empty, it
seeds four demo accounts (see "Test users" below).

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL to your backend URL
npm run dev
```

Runs on `http://localhost:5173` by default.

## Environment variables

**Never commit a real `.env` file** — only `.env.example` files belong in git. This repo's
`.gitignore` already excludes `.env`.

**Backend** (`backend/.env`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase/Neon/Render Postgres/local) |
| `JWT_SECRET` | Signing secret for JWTs — must be a long random string in any real deployment, not the demo value in `.env.example` |
| `PORT` | Port the API listens on (default `4000`) |
| `FRONTEND_URL` | Exact origin of the deployed frontend — used to scope CORS so the API only accepts requests from your frontend, not from any origin |

**Frontend** (`frontend/.env`):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the deployed backend API |

If you're picking this repo up after a prior handoff: **rotate any database password and JWT
secret that may have been shared outside this `.env`** (e.g. in a zip, a chat, or a prior commit)
before deploying — treat previously-shared credentials as compromised, don't reuse them.

## Test users

Seeded automatically on first backend boot if the `users` table is empty:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@fundsroom.com` | `Admin@123` |
| Sales | `sales@fundsroom.com` | `Sales@123` |
| Warehouse | `warehouse@fundsroom.com` | `Warehouse@123` |
| Accounts | `accounts@fundsroom.com` | `Accounts@123` |

These are also shown with a one-click copy button on the login screen for grading convenience.
**Change or remove them before any non-demo deployment.**

## API documentation

A Postman collection covering every route — including a couple of intentional negative-path
requests (a 403 from the wrong role, a 400 from a validation failure, a 400 from an
insufficient-stock confirm) — is included at [`postman_collection.json`](./postman_collection.json).
Import it, set `baseUrl` and log in via the four "Login" requests to populate the role tokens,
then run any request in the collection.

## Deployment

**Database**: Supabase (or Neon / Render Postgres). Create a project, run `schema.sql` in its SQL
editor, copy the connection string into `DATABASE_URL`.

**Backend**: Render (or Railway / Fly.io).
1. New Web Service → point at this repo, root directory `backend`.
2. Build command: `npm install && npm run build`. Start command: `npm start`.
3. Set `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` as environment variables in the Render
   dashboard (not in a committed file).
4. Note the deployed URL — you'll need it for the frontend's `VITE_API_BASE_URL`.

**Frontend**: Vercel (or Netlify / Render Static Site).
1. New Project → point at this repo, root directory `frontend`.
2. Build command: `npm run build`. Output directory: `dist`.
3. Set `VITE_API_BASE_URL` to the deployed backend URL from the step above.
4. Once deployed, go back to the backend's `FRONTEND_URL` env var and set it to this exact
   deployed frontend URL, then redeploy the backend (CORS is scoped to this value).

## Known limitations

- **Confirmed challans cannot be cancelled.** Only `draft` challans can be cancelled
  (`POST /challans/:id/cancel`). Cancelling a confirmed challan would need a compensating
  stock-reversal transaction (re-incrementing stock and writing a reversing `stock_movements`
  row); that's not implemented in this pass.
- **Challan numbers are timestamp-based** (`CH-<epoch-ms>`), not a human-friendly sequential
  series like `CH-2026-00001`. Uniqueness is still guaranteed by a DB constraint, but two
  challans created in the exact same millisecond would be rejected and need a retry — extremely
  unlikely in practice for a single-warehouse operation, but worth knowing.
- **Customer deletion is a hard delete**; product deletion is a soft delete (`active = false`).
  This is intentional — products are referenced by historical challan items and shouldn't
  disappear from past records, but customers currently have no such dependency to protect. If
  customer-challan history needs to survive a delete in the future, this should also move to a
  soft delete.
- **No automated tests.** All flows above (auth, roles, CRUD, stock math, negative-stock
  prevention) were verified manually; there's no test suite yet.
- **No purchase-order module.** The business context mentions purchase orders, but they aren't in
  the required core modules, so they weren't built. Stock is currently only increased via the
  manual "Add stock" action (`POST /stock/movements/in`) on the Products tab.

## Assumptions

- A customer's follow-up history is a single append-only text log (each note prefixed with a
  timestamp) rather than a separate notes table — sufficient for the "add follow-up notes"
  requirement without adding another table.
- "Search customer" covers name, business name, and mobile number; "search product" covers name,
  SKU, and category — these felt like the fields a sales/warehouse user would actually search by.
- Low-stock alerting is surfaced as a visual highlight in the Products table (row styled when
  `current_stock <= min_stock_alert_quantity`) rather than a separate notification system, since
  no notification channel (email/SMS) was specified.
