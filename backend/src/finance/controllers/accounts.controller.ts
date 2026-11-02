import type { Request, Response } from 'express';
import { AppError } from '../../errors/app-error';
import { AccountsService } from '../services/accounts.service';
import {
  accountQuerySchema,
  createPayableSchema,
  idempotencyKeySchema,
  recordIdSchema,
  recordPaymentSchema,
} from '../validators/finance.validator';

const requireBusiness = (req: Request): number => {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required');
  }
  return req.user.businessId;
};

const csvCell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  const safeText = /^\s*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
};

export const getAccounts = async (req: Request, res: Response): Promise<void> => {
  const { type } = accountQuerySchema.parse(req.query);
  const accounts = await AccountsService.getAccounts(requireBusiness(req), type);
  res.json({ data: accounts });
};

export const exportAccounts = async (req: Request, res: Response): Promise<void> => {
  const { type } = accountQuerySchema.parse(req.query);
  const accounts = await AccountsService.getAccounts(requireBusiness(req), type);
  const headers = type === 'receivables'
    ? ['Sale ID', 'Customer', 'Description', 'Date', 'Total KES', 'Paid KES', 'Balance KES']
    : ['Payable ID', 'Payee', 'Payee type', 'Description', 'Date', 'Total KES', 'Paid KES', 'Balance KES'];
  const rows = accounts.map((account) => type === 'receivables'
    ? [
      account.id,
      account.counterpartyName,
      account.description,
      account.createdAt,
      account.amount,
      account.paid,
      account.balance,
    ]
    : [
      account.id,
      account.counterpartyName,
      account.counterpartyType,
      account.description,
      account.createdAt,
      account.amount,
      account.paid,
      account.balance,
    ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const date = new Date().toISOString().slice(0, 10);
  res
    .type('text/csv')
    .attachment(`frima-auto-${type}-${date}.csv`)
    .send(`\uFEFF${csv}`);
};

export const createPayable = async (req: Request, res: Response): Promise<void> => {
  const payable = createPayableSchema.parse(req.body);
  const idempotencyKey = idempotencyKeySchema.parse(req.header('Idempotency-Key'));
  const created = await AccountsService.createPayable(
    requireBusiness(req),
    payable,
    idempotencyKey,
  );
  res.status(201).json(created);
};

export const recordPayablePayment = async (req: Request, res: Response): Promise<void> => {
  const payableId = recordIdSchema.parse(req.params.id);
  const idempotencyKey = idempotencyKeySchema.parse(req.header('Idempotency-Key'));
  const payment = recordPaymentSchema.parse(req.body);
  await AccountsService.recordPayment(
    requireBusiness(req),
    payableId,
    payment,
    idempotencyKey,
  );
  res.status(204).end();
};
