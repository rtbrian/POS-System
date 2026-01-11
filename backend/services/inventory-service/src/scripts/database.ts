import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD,
  port: 5432,
  // 👇 THIS IS REQUIRED FOR SUPABASE
  ssl: {
    rejectUnauthorized: false 
  }
});

export default pool;