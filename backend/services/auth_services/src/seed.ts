import { query } from 'shared/src/database/postgres.client';
import dotenv from 'dotenv';

dotenv.config();

const seed = async () => {
  try {
    console.log('🌱 Seeding Database...');

    // 1. Create Business
    await query(`
      INSERT INTO businesses (id, name) 
      VALUES (1, 'My First Store') 
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Business Created');

    // 2. Create Role
    await query(`
      INSERT INTO roles (id, name, business_id) 
      VALUES (1, 'Admin', 1) 
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Role Created');

    console.log('🎉 Database is ready!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
};

seed();