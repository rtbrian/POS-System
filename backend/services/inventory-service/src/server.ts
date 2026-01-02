import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/products.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(cors());

// Routes
app.use('/api/products', productRoutes);

app.listen(PORT, () => {
  console.log(`📦 Inventory Service running on http://localhost:${PORT}`);
});