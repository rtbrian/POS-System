# Frima Auto POS

Frima Auto is a point-of-sale and inventory app for a motorcycle spare-parts
shop. Staff can look up products, complete sales, track customer credit and
record payments to suppliers or other payees.

The app has a React and TypeScript frontend, an Express API, PostgreSQL for
products and financial records, and Supabase Auth for sign-in.

## What it does

- Search and filter products, check stock, and manage the catalog.
- Record paid sales or sales on credit. A completed sale updates stock in the
  same database transaction.
- Review sales totals and recent transactions on the dashboard.
- Track outstanding customer balances and supplier or other payables.
- Export account balances as CSV.

The payment method selected at checkout is recorded for bookkeeping; the app
does not initiate mobile-money, card, or bank payments. Sale totals are the
sum of item prices and quantities. The app does not add VAT.

## Run locally

You need Node.js, npm, and PostgreSQL. Docker Compose is also available for
local PostgreSQL.

1. Copy `frontend/.env.example` to `frontend/.env.local`.
2. Copy `backend/.env.example` to `backend/.env`.
3. Fill in the Supabase and database settings in those files. Use the Supabase
   publishable/anon key; never put a `service_role` key in the frontend or
   backend environment.
4. Start a local database with `docker compose up -d`, or use your own
   PostgreSQL instance.
5. In `backend`, install dependencies and prepare the database:

   ```sh
   npm install
   npm run db:migrate
   npm run build
   npm start
   ```

   For development, run `npm run dev` instead of `npm start`.

6. In another terminal, install frontend dependencies and start Vite:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

The frontend runs at `http://localhost:5173` and uses
`http://localhost:10000/api` by default. Set `VITE_BACKEND_URL` if the API is
running at a different address.

## Supabase user access

Supabase handles sign-in. The API checks the user's access token and reads their
business assignment from Supabase `app_metadata`. A new account needs an
administrator to assign a positive integer `business_id` before it can access
the business's products or sales. The API does not accept a business ID from
the browser.

Add the local login URL, `http://localhost:5173/login`, to the Supabase
Authentication redirect allow list. Add the deployed login URL there as well.
The backend's `CORS_ORIGINS` setting must contain the exact frontend origin;
preview domains are not allowed automatically.

## Deployments

The frontend is a Vite app and can be deployed to Vercel. Configure its
`VITE_BACKEND_URL` to point to the deployed API.

The Express API can be deployed to Render. Set its environment variables from
`backend/.env.example` in the Render dashboard, including PostgreSQL
credentials, Supabase settings, and the allowed frontend origins. Keep
credentials in the hosting provider's environment settings, not in Git.

After changing the database schema, run `npm run db:migrate` from `backend`
against the intended database. Check the migration and database target before
running it in production.

## Checks

Run the backend build and request-validation tests from `backend`:

```sh
npm run build
npm test
```

Run the frontend build and lint checks from `frontend`:

```sh
npm run build
npm run lint
```
