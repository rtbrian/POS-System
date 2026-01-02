import {Router} from 'express';
import {createProduct, getProducts} from '../controllers/products.controller';

const router = Router();

router.post('/', createProduct);
router.get('/', getProducts);

export default router;