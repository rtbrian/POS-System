CREATE TABLE IF NOT EXISTS sales (
  id BIGSERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  customer_name TEXT,
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  tax NUMERIC(12, 2) NOT NULL CHECK (tax >= 0),
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_business_idempotency
  ON sales (business_id, idempotency_key);
CREATE TABLE IF NOT EXISTS sale_items (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE TABLE IF NOT EXISTS sale_payments (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mobile_money', 'card', 'bank_transfer', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payables (
  id BIGSERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  payee_name TEXT NOT NULL,
  payee_type TEXT NOT NULL CHECK (payee_type IN ('supplier', 'other')),
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payable_payments (
  id BIGSERIAL PRIMARY KEY,
  payable_id BIGINT NOT NULL REFERENCES payables(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mobile_money', 'card', 'bank_transfer', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_business_created
  ON sales (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_business_customer
  ON sales (business_id, customer_name);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id
  ON sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_payments_sale_id
  ON sale_payments (sale_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sale_payments_idempotency
  ON sale_payments (sale_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payables_business_created
  ON payables (business_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payables_business_idempotency
  ON payables (business_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payable_payments_payable_id
  ON payable_payments (payable_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payable_payments_idempotency
  ON payable_payments (payable_id, idempotency_key);
