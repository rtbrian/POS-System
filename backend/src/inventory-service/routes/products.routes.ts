import { Router } from 'express';
import { 
  getProducts, 
  createProduct, 
  deleteProduct, // 👈 Import this
  updateProduct  // 👈 Import this
} from '../controllers/products.controller';

const router = Router();

router.get('/', getProducts);
router.post('/', createProduct);

// 👇 Add these two lines:
router.delete('/:id', deleteProduct);
router.put('/:id', updateProduct);

export default router;