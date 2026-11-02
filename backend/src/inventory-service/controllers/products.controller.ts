import { Request, Response } from 'express';
import { AppError } from '../../errors/app-error';
import { ProductService } from '../services/product.services';
import {
  createProductSchema,
  productFiltersSchema,
  productIdSchema,
  updateProductSchema,
} from '../validators/product.validator';

const requireBusiness = (req: Request): number => {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required');
  }
  return req.user.businessId;
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  const filters = productFiltersSchema.parse(req.query);
  const products = await ProductService.getAllProducts(requireBusiness(req), filters);
  res.json(products);
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const product = createProductSchema.parse(req.body);
  const created = await ProductService.createProduct(requireBusiness(req), product);
  res.status(201).json(created);
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  const id = productIdSchema.parse(req.params.id);
  const deleted = await ProductService.deleteProduct(id, requireBusiness(req));
  if (!deleted) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  }
  res.status(204).end();
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const id = productIdSchema.parse(req.params.id);
  const updates = updateProductSchema.parse(req.body);
  const updated = await ProductService.updateProduct(id, requireBusiness(req), updates);
  if (!updated) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  }
  res.json(updated);
};
