import { Router } from 'express';
import { verifyToken } from '../../auth_services/middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import {
  createSale,
  getSalesAnalytics,
  recordSalePayment,
} from '../controllers/sales.controller';

const router = Router();

router.use(verifyToken);
router.get('/analytics', asyncHandler(getSalesAnalytics));
router.post('/', asyncHandler(createSale));
router.post('/:id/payments', asyncHandler(recordSalePayment));

export default router;
