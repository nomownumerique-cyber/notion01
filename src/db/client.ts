import 'server-only';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
const globalDb = globalThis as unknown as { pool?: Pool };
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = globalDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
if (process.env.NODE_ENV !== 'production') globalDb.pool = pool;
export const db = drizzle(pool, { schema });
