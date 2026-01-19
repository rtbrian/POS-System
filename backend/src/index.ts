import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './auth_services/routes/auth.routes';
import productRoutes from './inventory-service/routes/products.routes';
import { errorHandler } from './auth_services/middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173', 
    process.env.FRONTEND_URL || '*'
  ],
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Gateway Backend running on port ${PORT}`);
});