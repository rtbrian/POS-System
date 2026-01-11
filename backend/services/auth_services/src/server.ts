import express from 'express';
import cors from 'cors';
import { config } from './config/env.config'; // Use new config
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/error.middleware'; // Import error handler
import './config/env.config';

const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);

// Global Error Handler (Must be last!)
app.use(errorHandler);

// Start Server
app.listen(config.port, () => {
  console.log(`✅ Auth Service running on http://localhost:${config.port}`);
});