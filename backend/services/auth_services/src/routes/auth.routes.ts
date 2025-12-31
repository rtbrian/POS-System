import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { validateRegister } from '../validators/auth.validator'; // Import validator
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Add validateRegister BEFORE the controller
router.post('/register', validateRegister, register);
router.post('/login', login);

router.get('/me', verifyToken, getProfile);

export default router;