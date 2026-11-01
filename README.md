# POS System

React/Vite frontend with an Express API, PostgreSQL product storage, and Supabase
Auth for identity.

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
- Errors use `{ error: { code, message, details? } }`.

## Known next steps

- Confirm the deployed PostgreSQL schema and add versioned migrations before
  changing columns. The included migration only adds indexes when the expected
  existing products columns are present; review it before applying to production.
- Implement server-side sale creation with transactional stock deduction and
  idempotency before enabling the POS payment button.
- Add integration tests for Supabase token validation, business isolation, and
  product CRUD against a disposable PostgreSQL database.
- Review `npm audit` findings and upgrade dependencies with focused compatibility
  checks; do not apply force upgrades blindly.
