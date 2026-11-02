# POS System

Frima Auto is a motorcycle spare-parts POS with a React/Vite frontend, Express
API, PostgreSQL product and sales storage, and Supabase Auth for identity.

## Local setup

1. Copy `frontend/.env.example` to `frontend/.env.local` and add the Supabase
   publishable (or legacy anon) key from **Supabase Project Settings → API Keys**.
   The Supabase project URL is already configured in the example.
2. Copy `backend/.env.example` to `backend/.env` and set the same Supabase URL/key
   plus the PostgreSQL connection values. Do not use a Supabase `service_role`
   key in either application.
3. Start PostgreSQL using the project's compose file or your configured database.
   The local compose password is for development only.
4. In `backend`, run `npm install`, `npm run db:migrate`, `npm run build`, and
   `npm start` (or `npm run dev`).
5. In `frontend`, run `npm install` and `npm run dev`.

The frontend defaults to `http://localhost:10000/api`; set `VITE_BACKEND_URL` for
another API host. Configure `CORS_ORIGINS` with exact frontend origins for
deployment. Vercel preview domains must be explicitly listed; wildcard Vercel
origins are intentionally not allowed.

## Authentication and business access

Supabase Auth issues the browser session. The frontend sends its access token to
Express as a bearer token. Express validates it with Supabase Auth and reads the
business assignment only from the user's trusted `app_metadata`; it never trusts
client-supplied business IDs or editable `user_metadata`.

The signup flow requests a confirmation redirect to the current app origin at
`/login`. In Supabase **Authentication → URL Configuration**, add
`http://localhost:5173/login` to the redirect URL allow list for local development.
Add the deployed frontend's login URL there as well for production. Confirmation
emails can only redirect to URLs allowed by the Supabase project.

Before a Supabase Auth user can use product endpoints, an administrator must
assign a positive integer `business_id` in that user's `app_metadata`. An optional
`role` string can also be set there. Newly self-registered accounts do not receive
business access automatically. This avoids assigning users to a hard-coded
business. Existing passwords in the legacy PostgreSQL `users` table are not
automatically migrated; users need Supabase Auth accounts and password setup/reset.

## API behavior

- `GET /health` checks PostgreSQL connectivity.
- `/api/products` requires a valid Supabase access token and a trusted business
  assignment.
- `GET /api/products` supports `page`, `limit` (maximum 100), `search`, `category`,
  and `stockStatus=low|out`; it returns `{ data, page, limit, total, totalPages }`.
- Product create/update input is validated; product reads, updates, and deletes
  are scoped to the authenticated business.
- `POST /api/sales` records paid or credit sales, stores item/price snapshots,
  and deducts stock in one database transaction. Checkout requires an
  `Idempotency-Key` UUID so retrying the same request cannot charge stock twice.
  Payable creation and account payments also use idempotency keys to prevent
  duplicate records when a request is retried.
- `GET /api/sales/analytics?period=today|7days|30days|90days` returns sales
  totals and the latest transactions for the dashboard.
- `/api/accounts` lists open customer receivables and supplier/other payables.
  Payments are recorded separately and cannot exceed the remaining balance.
- `GET /api/accounts/export.csv?type=receivables|payables` downloads open
  account balances as a UTF-8 CSV that can be opened in Excel or imported into
  Google Sheets. PostgreSQL remains the source of truth; Google OAuth is not
  required for the CSV export.
- Errors use `{ error: { code, message, details? } }`.

## Sales and account records

- Run `npm run db:migrate` from `backend` before using sales or accounts. This
  applies the versioned sales/account tables and indexes.
- In the POS, selecting **Paid** records the cashier-confirmed payment method;
  it does not contact a payment provider. Selecting **On credit** requires a
  customer name and adds the sale to open receivables. Customer payments and
  supplier/other-payee payments can be recorded from **Customers & Accounts**.
- POS totals equal the sum of item prices and quantities; the app does not add
  VAT or another tax. The current payment-method selection records how a sale
  was paid but does not integrate with a mobile-money provider or calculate
  provider fees/taxes.
- Supplier payables are entered manually and do not yet create a stock receipt.
- Full Google Sheets synchronization is not configured. CSV export can be
  opened in spreadsheet software; direct Google sync would require Google
  Cloud OAuth credentials and setup.
- Confirm the deployed PostgreSQL schema and review migrations before applying
  them to production. The finance migration creates new tables; it does not
  modify the existing products table.
- Add integration tests for Supabase token validation, business isolation,
  concurrent stock changes, and checkout/payment transactions against a
  disposable PostgreSQL database.
- Review `npm audit` findings and upgrade dependencies with focused compatibility
  checks; do not apply force upgrades blindly.
