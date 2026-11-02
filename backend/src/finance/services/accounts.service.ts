import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { AppError } from '../../errors/app-error';
import { pool, query } from '../../postgres.client';
import type {
  CreatePayableInput,
  RecordPaymentInput,
} from '../validators/finance.validator';

const toCents = (amount: number | string): number => Math.round(Number(amount) * 100);
const fromCents = (amount: number): string => (amount / 100).toFixed(2);
const hashRequest = (value: object): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

export type AccountType = 'receivables' | 'payables';

const lockIdempotencyKey = async (
  client: PoolClient,
  businessId: number,
  idempotencyKey: string,
): Promise<void> => {
  await client.query(
    'SELECT pg_advisory_xact_lock($1::int, hashtext($2::text))',
    [businessId, idempotencyKey],
  );
};

const paymentRequestHash = (amount: number, paymentMethod: string): string =>
  hashRequest({ amount: toCents(amount), paymentMethod });

export class AccountsService {
  static async getAccounts(businessId: number, type: AccountType) {
    if (type === 'receivables') {
      const result = await query(
        `SELECT
           s.id,
           s.customer_name AS "counterpartyName",
           'customer'::text AS "counterpartyType",
           ('Sale #' || s.id::text) AS description,
           s.created_at AS "createdAt",
           s.total::text AS amount,
           COALESCE(SUM(sp.amount), 0)::text AS paid,
           (s.total - COALESCE(SUM(sp.amount), 0))::text AS balance
         FROM sales s
         LEFT JOIN sale_payments sp ON sp.sale_id = s.id
         WHERE s.business_id = $1 AND s.customer_name IS NOT NULL
         GROUP BY s.id
         HAVING s.total - COALESCE(SUM(sp.amount), 0) > 0
         ORDER BY s.created_at ASC`,
        [businessId],
      );
      return result.rows;
    }

    const result = await query(
      `SELECT
         p.id,
         p.payee_name AS "counterpartyName",
         p.payee_type AS "counterpartyType",
         p.description,
         p.created_at AS "createdAt",
         p.amount::text AS amount,
         COALESCE(SUM(pp.amount), 0)::text AS paid,
         (p.amount - COALESCE(SUM(pp.amount), 0))::text AS balance
       FROM payables p
       LEFT JOIN payable_payments pp ON pp.payable_id = p.id
       WHERE p.business_id = $1
       GROUP BY p.id
       HAVING p.amount - COALESCE(SUM(pp.amount), 0) > 0
       ORDER BY p.created_at ASC`,
      [businessId],
    );
    return result.rows;
  }

  static async createPayable(
    businessId: number,
    payable: CreatePayableInput,
    idempotencyKey: string,
  ) {
    const requestHash = hashRequest({
      payeeName: payable.payeeName,
      payeeType: payable.payeeType,
      description: payable.description,
      amount: toCents(payable.amount),
      amountPaid: toCents(payable.amountPaid),
      paymentMethod: payable.paymentMethod ?? null,
    });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await lockIdempotencyKey(client, businessId, idempotencyKey);
      const existingResult = await client.query<{
        id: string;
        counterpartyName: string;
        counterpartyType: string;
        description: string;
        amount: string;
        createdAt: Date;
        requestHash: string;
      }>(
        `SELECT id, payee_name AS "counterpartyName", payee_type AS "counterpartyType",
                description, amount::text AS amount, created_at AS "createdAt",
                request_hash AS "requestHash"
         FROM payables
         WHERE business_id = $1 AND idempotency_key = $2`,
        [businessId, idempotencyKey],
      );
      const existing = existingResult.rows[0];
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new AppError(409, 'IDEMPOTENCY_KEY_REUSED', 'This request key was already used for a different payable');
        }
        const paymentsResult = await client.query<{ paid: string }>(
          'SELECT COALESCE(SUM(amount), 0)::text AS paid FROM payable_payments WHERE payable_id = $1',
          [existing.id],
        );
        const paid = paymentsResult.rows[0].paid;
        await client.query('COMMIT');
        return {
          ...existing,
          paid,
          balance: fromCents(toCents(existing.amount) - toCents(paid)),
        };
      }

      const result = await client.query(
        `INSERT INTO payables
         (business_id, idempotency_key, request_hash, payee_name, payee_type, description, amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, payee_name AS "counterpartyName", payee_type AS "counterpartyType",
                   description, amount::text AS amount, created_at AS "createdAt"`,
        [
          businessId,
          idempotencyKey,
          requestHash,
          payable.payeeName,
          payable.payeeType,
          payable.description,
          payable.amount.toFixed(2),
        ],
      );
      const created = result.rows[0];
      if (payable.amountPaid > 0 && payable.paymentMethod) {
        const initialPaymentHash = paymentRequestHash(payable.amountPaid, payable.paymentMethod);
        await client.query(
          `INSERT INTO payable_payments
           (payable_id, idempotency_key, request_hash, amount, payment_method)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            created.id,
            `${idempotencyKey}:initial`,
            initialPaymentHash,
            payable.amountPaid.toFixed(2),
            payable.paymentMethod,
          ],
        );
      }
      await client.query('COMMIT');
      return {
        ...created,
        paid: payable.amountPaid.toFixed(2),
        balance: fromCents(toCents(payable.amount) - toCents(payable.amountPaid)),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async recordPayment(
    businessId: number,
    payableId: number,
    payment: RecordPaymentInput,
    idempotencyKey: string,
  ): Promise<void> {
    await this.addPayment(businessId, payableId, payment, idempotencyKey);
  }

  static async recordSalePayment(
    businessId: number,
    saleId: number,
    payment: RecordPaymentInput,
    idempotencyKey: string,
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await lockIdempotencyKey(client, businessId, idempotencyKey);
      const saleResult = await client.query<{ total: string }>(
        'SELECT total FROM sales WHERE id = $1 AND business_id = $2 FOR UPDATE',
        [saleId, businessId],
      );
      const sale = saleResult.rows[0];
      if (!sale) {
        throw new AppError(404, 'SALE_NOT_FOUND', 'Sale was not found');
      }

      const requestHash = paymentRequestHash(payment.amount, payment.paymentMethod);
      const existingResult = await client.query<{ requestHash: string }>(
        `SELECT request_hash AS "requestHash"
         FROM sale_payments
         WHERE sale_id = $1 AND idempotency_key = $2`,
        [saleId, idempotencyKey],
      );
      const existing = existingResult.rows[0];
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new AppError(409, 'IDEMPOTENCY_KEY_REUSED', 'This payment key was already used for a different payment');
        }
        await client.query('COMMIT');
        return;
      }

      const paymentsResult = await client.query<{ paid: string }>(
        'SELECT COALESCE(SUM(amount), 0)::text AS paid FROM sale_payments WHERE sale_id = $1',
        [saleId],
      );
      const balanceCents = toCents(sale.total) - toCents(paymentsResult.rows[0].paid);
      const amountCents = toCents(payment.amount);
      if (amountCents > balanceCents) {
        throw new AppError(409, 'PAYMENT_EXCEEDS_BALANCE', 'Payment exceeds the outstanding balance');
      }
      await client.query(
        `INSERT INTO sale_payments
         (sale_id, idempotency_key, request_hash, amount, payment_method)
         VALUES ($1, $2, $3, $4, $5)`,
        [saleId, idempotencyKey, requestHash, fromCents(amountCents), payment.paymentMethod],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private static async addPayment(
    businessId: number,
    payableId: number,
    payment: RecordPaymentInput,
    idempotencyKey: string,
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await lockIdempotencyKey(client, businessId, idempotencyKey);
      const payableResult = await client.query<{ amount: string }>(
        'SELECT amount FROM payables WHERE id = $1 AND business_id = $2 FOR UPDATE',
        [payableId, businessId],
      );
      const payable = payableResult.rows[0];
      if (!payable) {
        throw new AppError(404, 'PAYABLE_NOT_FOUND', 'Payable was not found');
      }

      const requestHash = paymentRequestHash(payment.amount, payment.paymentMethod);
      const existingResult = await client.query<{ requestHash: string }>(
        `SELECT request_hash AS "requestHash"
         FROM payable_payments
         WHERE payable_id = $1 AND idempotency_key = $2`,
        [payableId, idempotencyKey],
      );
      const existing = existingResult.rows[0];
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new AppError(409, 'IDEMPOTENCY_KEY_REUSED', 'This payment key was already used for a different payment');
        }
        await client.query('COMMIT');
        return;
      }

      const paymentsResult = await client.query<{ paid: string }>(
        'SELECT COALESCE(SUM(amount), 0)::text AS paid FROM payable_payments WHERE payable_id = $1',
        [payableId],
      );
      const balanceCents = toCents(payable.amount) - toCents(paymentsResult.rows[0].paid);
      const amountCents = toCents(payment.amount);
      if (amountCents > balanceCents) {
        throw new AppError(409, 'PAYMENT_EXCEEDS_BALANCE', 'Payment exceeds the outstanding balance');
      }
      await client.query(
        `INSERT INTO payable_payments
         (payable_id, idempotency_key, request_hash, amount, payment_method)
         VALUES ($1, $2, $3, $4, $5)`,
        [payableId, idempotencyKey, requestHash, fromCents(amountCents), payment.paymentMethod],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
