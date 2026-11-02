import type { Request, Response } from 'express';
import { AppError } from '../../errors/app-error';
import { AccountsService } from '../services/accounts.service';
import { SalesService } from '../services/sales.service';
import {
  analyticsQuerySchema,
  createSaleSchema,
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

export const createSale = async (req: Request, res: Response): Promise<void> => {
  const sale = createSaleSchema.parse(req.body);
  const idempotencyKey = idempotencyKeySchema.parse(req.header('Idempotency-Key'));
  const created = await SalesService.createSale(requireBusiness(req), sale, idempotencyKey);
  res.status(201).json(created);
};

export const getSalesAnalytics = async (req: Request, res: Response): Promise<void> => {
  const { period } = analyticsQuerySchema.parse(req.query);
  const analytics = await SalesService.getAnalytics(requireBusiness(req), period);
  res.json(analytics);
};

export const recordSalePayment = async (req: Request, res: Response): Promise<void> => {
  const saleId = recordIdSchema.parse(req.params.id);
  const idempotencyKey = idempotencyKeySchema.parse(req.header('Idempotency-Key'));
  const payment = recordPaymentSchema.parse(req.body);
  await AccountsService.recordSalePayment(
    requireBusiness(req),
    saleId,
    payment,
    idempotencyKey,
  );
  res.status(204).end();
};
