import { z } from 'zod';

const productFields = {
  name: z.string().trim().min(1).max(200),
  price: z.number().finite().min(0),
  stock: z.number().int().min(0),
  category: z.string().trim().max(80).nullable(),
  description: z.string().trim().max(2000).nullable(),
};

export const createProductSchema = z.object({
  name: productFields.name,
  price: productFields.price,
  stock: productFields.stock,
  category: productFields.category.optional(),
  description: productFields.description.optional(),
}).strict();

export const updateProductSchema = z.object({
  name: productFields.name.optional(),
  price: productFields.price.optional(),
  stock: productFields.stock.optional(),
  category: productFields.category.optional(),
  description: productFields.description.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one product field must be provided',
});

export const productIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

export const productFiltersSchema = z.object({
  page: z.coerce.number().int().positive().max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(80).optional(),
  stockStatus: z.enum(['low', 'out']).optional(),
}).strict();
