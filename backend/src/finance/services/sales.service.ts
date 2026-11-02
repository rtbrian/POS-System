import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { AppError } from '../../errors/app-error';
import { pool, query } from '../../postgres.client';
import type { CreateSaleInput } from '../validators/finance.validator';

const toCents = (amount: number | string): number => Math.round(Number(amount) * 100);
const fromCents = (amount: number): string => (amount / 100).toFixed(2);

interface ProductRow {
  id: number;
  name: string;
  price: string;
  stock_quantity: number;
}

interface SaleSummary {
  id: string;
  customerName: string | null;
  subtotal: string;
  tax: string;
  total: string;
  paymentStatus: 'paid' | 'credit';
  createdAt: Date;
}

const completeSale = async (
  client: PoolClient,
  businessId: number,
  sale: CreateSaleInput,
  idempotencyKey: string,
): Promise<SaleSummary> => {
  const requestHash = createHash('sha256')
    .update(JSON.stringify({
      customerName: sale.customerName ?? null,
      paymentType: sale.paymentType,
      paymentMethod: sale.paymentMethod ?? null,
      items: [...sale.items].sort((a, b) => a.productId - b.productId),
    }))
    .digest('hex');

  await client.query(
    'SELECT pg_advisory_xact_lock($1::int, hashtext($2::text))',
    [businessId, idempotencyKey],
  );
  const existingResult = await client.query<SaleSummary & { requestHash: string; paid: boolean }>(
    `SELECT s.id, s.customer_name AS "customerName", s.subtotal, s.tax, s.total,
            s.created_at AS "createdAt", s.request_hash AS "requestHash",
            EXISTS (SELECT 1 FROM sale_payments sp WHERE sp.sale_id = s.id) AS paid
     FROM sales s
     WHERE s.business_id = $1 AND s.idempotency_key = $2`,
    [businessId, idempotencyKey],
  );
  const existingSale = existingResult.rows[0];
  if (existingSale) {
    if (existingSale.requestHash !== requestHash) {
      throw new AppError(409, 'IDEMPOTENCY_KEY_REUSED', 'This checkout key was already used for a different sale');
    }
    return {
      id: existingSale.id,
      customerName: existingSale.customerName,
      subtotal: existingSale.subtotal,
      tax: existingSale.tax,
      total: existingSale.total,
      paymentStatus: existingSale.paid ? 'paid' : 'credit',
      createdAt: existingSale.createdAt,
    };
  }

  const orderedItems = [...sale.items].sort((a, b) => a.productId - b.productId);
  const productResult = await client.query<ProductRow>(
    `SELECT id, name, price, stock_quantity
     FROM products
     WHERE id = ANY($1) AND business_id = $2
     ORDER BY id
     FOR UPDATE`,
    [orderedItems.map(({ productId }) => productId), businessId],
  );
  const products = new Map(productResult.rows.map((product) => [product.id, product]));
  for (const item of orderedItems) {
    const product = products.get(item.productId);
    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product ${item.productId} was not found`);
    }
    if (product.stock_quantity < item.quantity) {
      throw new AppError(409, 'INSUFFICIENT_STOCK', `Not enough stock for ${product.name}`);
    }
    products.set(item.productId, product);
  }

  const pricedItems = sale.items.map((item) => {
    const product = products.get(item.productId);
    if (!product) {
      throw new AppError(500, 'SALE_PRODUCT_LOOKUP_FAILED', 'Could not load a sale product');
    }
    if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0) {
      throw new AppError(409, 'INVALID_PRODUCT_PRICE', `Product ${product.name} has an invalid price`);
    }
    const unitPriceCents = toCents(product.price);
    return {
      ...item,
      product,
      unitPriceCents,
      lineTotalCents: unitPriceCents * item.quantity,
    };
  });
  const subtotalCents = pricedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const taxCents = 0;
  const totalCents = subtotalCents;
  if (!Number.isSafeInteger(totalCents) || totalCents > 999_999_999_999) {
    throw new AppError(400, 'SALE_TOTAL_TOO_LARGE', 'Sale total exceeds the supported amount');
  }

  const saleResult = await client.query<SaleSummary>(
    `INSERT INTO sales (business_id, idempotency_key, request_hash, customer_name, subtotal, tax, total)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, customer_name AS "customerName", subtotal, tax, total, created_at AS "createdAt"`,
    [
      businessId,
      idempotencyKey,
      requestHash,
      sale.customerName ?? null,
      fromCents(subtotalCents),
      fromCents(taxCents),
      fromCents(totalCents),
    ],
  );
  const createdSale = saleResult.rows[0];

  await client.query(
    `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, line_total)
     SELECT $1, item.product_id, item.product_name, item.quantity, item.unit_price, item.line_total
     FROM UNNEST(
       $2::bigint[], $3::text[], $4::integer[], $5::numeric[], $6::numeric[]
     ) AS item(product_id, product_name, quantity, unit_price, line_total)`,
    [
      createdSale.id,
      pricedItems.map(({ product }) => product.id),
      pricedItems.map(({ product }) => product.name),
      pricedItems.map(({ quantity }) => quantity),
      pricedItems.map(({ unitPriceCents }) => fromCents(unitPriceCents)),
      pricedItems.map(({ lineTotalCents }) => fromCents(lineTotalCents)),
    ],
  );
  await client.query(
    `UPDATE products AS p
     SET stock_quantity = p.stock_quantity - item.quantity
     FROM UNNEST($1::bigint[], $2::integer[]) AS item(product_id, quantity)
     WHERE p.id = item.product_id AND p.business_id = $3`,
    [
      pricedItems.map(({ product }) => product.id),
      pricedItems.map(({ quantity }) => quantity),
      businessId,
    ],
  );

  if (sale.paymentType === 'paid' && sale.paymentMethod) {
    await client.query(
      `INSERT INTO sale_payments
       (sale_id, idempotency_key, request_hash, amount, payment_method)
       VALUES ($1, $2, $3, $4, $5)`,
      [createdSale.id, idempotencyKey, requestHash, createdSale.total, sale.paymentMethod],
    );
  }

  return {
    ...createdSale,
    paymentStatus: sale.paymentType,
  };
};

export class SalesService {
  static async createSale(
    businessId: number,
    sale: CreateSaleInput,
    idempotencyKey: string,
  ): Promise<SaleSummary> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const createdSale = await completeSale(client, businessId, sale, idempotencyKey);
      await client.query('COMMIT');
      return createdSale;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getAnalytics(
    businessId: number,
    period: 'today' | '7days' | '30days' | '90days',
  ) {
    const daysByPeriod = { today: 0, '7days': 7, '30days': 30, '90days': 90 };
    const days = daysByPeriod[period];
    const [summary, sales] = await Promise.all([
      query(
        `SELECT
           COUNT(*)::int AS "transactionCount",
           COALESCE(SUM(total), 0)::text AS "grossSales",
           COALESCE(AVG(total), 0)::text AS "averageOrder"
         FROM sales
         WHERE business_id = $1
           AND created_at >= CASE
             WHEN $2 = 0 THEN date_trunc('day', now())
             ELSE now() - ($2 * interval '1 day')
           END`,
        [businessId, days],
      ),
      query(
        `SELECT
           s.id,
           s.customer_name AS "customerName",
           s.created_at AS "createdAt",
           s.total::text AS total,
           COALESCE(SUM(si.quantity), 0)::int AS "itemCount"
         FROM sales s
         LEFT JOIN sale_items si ON si.sale_id = s.id
         WHERE s.business_id = $1
           AND s.created_at >= CASE
             WHEN $2 = 0 THEN date_trunc('day', now())
             ELSE now() - ($2 * interval '1 day')
           END
         GROUP BY s.id
         ORDER BY s.created_at DESC
         LIMIT 100`,
        [businessId, days],
      ),
    ]);

    return {
      period,
      transactionCount: summary.rows[0].transactionCount as number,
      grossSales: summary.rows[0].grossSales as string,
      averageOrder: summary.rows[0].averageOrder as string,
      sales: sales.rows,
    };
  }
}
