import { query } from 'shared/src/database/postgres.client';
import dotenv from 'dotenv';

dotenv.config();

const resetDb = async () => {
  try {
    console.log('💥 Destroying old table...');
    
    // 1. Delete the broken table
    await query('DROP TABLE IF EXISTS products CASCADE;');

    console.log('🏗️ Building fresh table...');

    // 2. Create the correct table with ALL columns
    await query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        category VARCHAR(100),
        barcode VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Database Reset Complete! Table is perfect.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset Failed:', error);
    process.exit(1);
  }
};

resetDb();