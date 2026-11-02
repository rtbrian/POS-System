import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './auth_services/config/env.config';
import { errorHandler } from './auth_services/middleware/error.middleware';
import { AppError } from './errors/app-error';
import { pool, query } from './postgres.client';
import accountsRoutes from './finance/routes/accounts.routes';
import salesRoutes from './finance/routes/sales.routes';
import productRoutes from './inventory-service/routes/products.routes';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new AppError(403, 'CORS_ORIGIN_DENIED', 'Origin is not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
}));
app.use(rateLimit({
  windowMs: 60_000,
  limit: 600,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Too many requests; try again shortly' },
    });
  },
}));

app.get('/health', async (_req, res, next) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});

app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/accounts', accountsRoutes);
app.use((_req, _res, next) => {
  next(new AppError(404, 'ROUTE_NOT_FOUND', 'Route not found'));
});
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`POS API listening on port ${config.port}`);
});

const shutdown = (): void => {
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
