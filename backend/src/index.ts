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
  origin: (origin, callback) => {
    // 1. Allow requests with NO origin (like Postman or Mobile Apps)
    if (!origin) return callback(null, true);

    // 2. Allow Localhost (Development)
    if (origin.startsWith('http://localhost')) {
      return callback(null, true);
    }

    // 3. Allow ANY Vercel App (Production & Previews)
    // This checks if the domain ends with ".vercel.app"
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // 4. Block everyone else
    console.log('Blocked by CORS:', origin); // Log it so you can see if you blocked yourself
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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