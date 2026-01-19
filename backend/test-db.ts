import { query } from './src/database/postgres.client';

async function testConnection() {
  console.log('🔄 Attempting to connect...');
  try {
    // Run a simple query
    const result = await query('SELECT NOW() as time');
    console.log('✅ SUCCESS! Database responded.');
    console.log('🕒 Server Time:', result.rows[0].time);
  } catch (err) {
    console.error('❌ FAILED: Could not connect to database.');
    console.error(err);
  }
}

testConnection();