import { Router } from 'express';
import { verifyToken } from '../../auth_services/middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '../controllers/products.controller';

const router = Router();

router.use(verifyToken);
router.get('/', asyncHandler(getProducts));
router.post('/', asyncHandler(createProduct));
router.delete('/:id', asyncHandler(deleteProduct));
router.put('/:id', asyncHandler(updateProduct));

export default router;
