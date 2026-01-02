import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST ,
  user: process.env.DB_USER , 
  password: process.env.DB_PASSWORD , 
  database: process.env.DB_NAME ,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test the connection when the app starts
pool.on('connect', () => {
  console.log('✅ Connected to the Database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);