import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { PoolClient } from 'pg';
import { pool } from '../postgres.client';

const migrationDirectory = path.resolve(__dirname, '../../database/migrations');
const migrationLock = 72419830;

const migrate = async (): Promise<void> => {
  let client: PoolClient | undefined;
  let lockAcquired = false;
  try {
    client = await pool.connect();
    await client.query('SELECT pg_advisory_lock($1)', [migrationLock]);
    lockAcquired = true;
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const appliedResult = await client.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations',
    );
    const applied = new Set(appliedResult.rows.map(({ filename }) => filename));
    const migrations = (await readdir(migrationDirectory))
      .filter((filename) => filename.endsWith('.sql'))
      .sort();

    for (const filename of migrations) {
      if (applied.has(filename)) continue;
      const sql = await readFile(path.join(migrationDirectory, filename), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
        await client.query('COMMIT');
        console.log(`Applied migration ${filename}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    try {
      if (client && lockAcquired) {
        await client.query('SELECT pg_advisory_unlock($1)', [migrationLock]);
      }
    } finally {
      client?.release();
    }
    await pool.end();
  }
};

migrate().catch((error: unknown) => {
  console.error('Database migration failed:', error);
  process.exitCode = 1;
});
