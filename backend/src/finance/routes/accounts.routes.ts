import { Router } from 'express';
import { verifyToken } from '../../auth_services/middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import {
  createPayable,
  exportAccounts,
  getAccounts,
  recordPayablePayment,
} from '../controllers/accounts.controller';

const router = Router();

router.use(verifyToken);
router.get('/export.csv', asyncHandler(exportAccounts));
router.get('/', asyncHandler(getAccounts));
router.post('/payables', asyncHandler(createPayable));
router.post('/payables/:id/payments', asyncHandler(recordPayablePayment));

export default router;
