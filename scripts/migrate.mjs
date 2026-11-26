import { readFile, readdir } from 'node:fs/promises';
import pg from 'pg';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const dir = new URL('../migrations/', import.meta.url);
  const files = (await readdir(dir)).filter(name => /^\d{4}_[a-z0-9_]+\.sql$/.test(name)).sort();
  for (const file of files) { await client.query(await readFile(new URL(file, dir), 'utf8')); console.log(`Applied ${file}`); }
  await client.query('COMMIT');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }
