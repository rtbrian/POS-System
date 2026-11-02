import { z } from 'zod';

export const paymentMethodSchema = z.enum([
  'cash',
  'mobile_money',
  'card',
  'bank_transfer',
  'other',
]);

const currencyAmountSchema = z.number().finite().max(100_000_000)
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7, {
    message: 'Amount must have no more than two decimal places',
  });

export const createSaleSchema = z.object({
  customerName: z.string().trim().min(1).max(200).optional(),
  paymentType: z.enum(['paid', 'credit']),
  paymentMethod: paymentMethodSchema.optional(),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive().max(100_000),
  }).strict()).min(1).max(100),
}).strict().superRefine((sale, context) => {
  if (sale.paymentType === 'paid' && !sale.paymentMethod) {
    context.addIssue({
      code: 'custom',
      path: ['paymentMethod'],
      message: 'A payment method is required for a paid sale',
    });
  }
  if (sale.paymentType === 'credit' && !sale.customerName) {
    context.addIssue({
      code: 'custom',
      path: ['customerName'],
      message: 'A customer name is required for a sale on credit',
    });
  }
  if (sale.paymentType === 'credit' && sale.paymentMethod) {
    context.addIssue({
      code: 'custom',
      path: ['paymentMethod'],
      message: 'Credit sales cannot record an immediate payment method',
    });
  }
  const productIds = sale.items.map(({ productId }) => productId);
  if (new Set(productIds).size !== productIds.length) {
    context.addIssue({
      code: 'custom',
      path: ['items'],
      message: 'Each product may only appear once',
    });
  }
});

export const createPayableSchema = z.object({
  payeeName: z.string().trim().min(1).max(200),
  payeeType: z.enum(['supplier', 'other']),
  description: z.string().trim().min(1).max(500),
  amount: currencyAmountSchema.min(0.01),
  amountPaid: currencyAmountSchema.min(0).default(0),
  paymentMethod: paymentMethodSchema.optional(),
}).strict().superRefine((payable, context) => {
  if (payable.amountPaid > payable.amount) {
    context.addIssue({
      code: 'custom',
      path: ['amountPaid'],
      message: 'Amount paid cannot exceed the payable amount',
    });
  }
  if (payable.amountPaid > 0 && !payable.paymentMethod) {
    context.addIssue({
      code: 'custom',
      path: ['paymentMethod'],
      message: 'A payment method is required when recording an initial payment',
    });
  }
});

export const recordPaymentSchema = z.object({
  amount: currencyAmountSchema.min(0.01),
  paymentMethod: paymentMethodSchema,
}).strict();

export const recordIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const idempotencyKeySchema = z.string().uuid();

export const analyticsQuerySchema = z.object({
  period: z.enum(['today', '7days', '30days', '90days']).default('30days'),
}).strict();

export const accountQuerySchema = z.object({
  type: z.enum(['receivables', 'payables']),
}).strict();

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type CreatePayableInput = z.infer<typeof createPayableSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
