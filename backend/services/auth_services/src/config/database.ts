import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load .env variables directly
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // <--- Uses the password you just confirmed
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error acquiring client:', err.message);
  }
  console.log('✅ Auth Service connected to Supabase!');
  release();
});

export default pool;