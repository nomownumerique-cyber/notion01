import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.ts';

const scrypt = promisify(scryptCallback);
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const normEmail = (s: string) => s.trim().toLowerCase();
function validate(email: string, password: string) {
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 128) throw new Error('Invalid credentials');
}
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16); const hash = await scrypt(password, salt, 64) as Buffer;
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}
async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algo, saltHex, hashHex] = encoded.split(':');
  if (algo !== 'scrypt' || !/^[0-9a-f]{32}$/.test(saltHex ?? '') || !/^[0-9a-f]{128}$/.test(hashHex ?? '')) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), 64) as Buffer;
  return timingSafeEqual(expected, actual);
}
const DUMMY_HASH = `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`;
const expiry = () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
type Database = NodePgDatabase<typeof schema>;

export function createStore(db: Database) {
  async function throttle(email: string) {
    const key = digest(`auth:${email}`);
    const result = await db.execute(sql`INSERT INTO auth_attempts (key, attempts, window_start) VALUES (${key}, 1, now()) ON CONFLICT (key) DO UPDATE SET attempts = CASE WHEN auth_attempts.window_start < now() - interval '10 minutes' THEN 1 ELSE auth_attempts.attempts + 1 END, window_start = CASE WHEN auth_attempts.window_start < now() - interval '10 minutes' THEN now() ELSE auth_attempts.window_start END RETURNING attempts`);
    const rows = (result as unknown as { rows: { attempts: number }[] }).rows;
    if (Number(rows[0].attempts) > 10) throw new Error('Too many attempts');
  }
  async function createSession(userId: string, tenantId: string) {
    const token = randomBytes(32).toString('base64url');
    await db.insert(schema.sessions).values({ tokenHash: digest(token), userId, tenantId, expiresAt: expiry() });
    return token;
  }
  async function current(token: string | undefined) {
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
    const [row] = await db.select({ userId: schema.users.id, email: schema.users.email, tenantId: schema.tenants.id, tenantName: schema.tenants.name, role: schema.memberships.role })
      .from(schema.sessions).innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
      .innerJoin(schema.tenants, eq(schema.sessions.tenantId, schema.tenants.id))
      .innerJoin(schema.memberships, and(eq(schema.memberships.tenantId, schema.sessions.tenantId), eq(schema.memberships.userId, schema.sessions.userId)))
      .where(and(eq(schema.sessions.tokenHash, digest(token)), gt(schema.sessions.expiresAt, new Date()))).limit(1);
    return row ?? null;
  }
  async function requireUser(token: string | undefined) {
    const actor = await current(token); if (!actor) throw new Error('Unauthorized'); return actor;
  }
  return {
    async register(emailInput: string, password: string, tenantNameInput: string) {
      const email = normEmail(emailInput), name = tenantNameInput.trim(); validate(email, password);
      if (!name || name.length > 120) throw new Error('Invalid workspace name');
      await throttle(email); const passwordHash = await hashPassword(password);
      const userId = randomUUID(), tenantId = randomUUID();
      await db.transaction(async (tx) => {
        await tx.insert(schema.users).values({ id: userId, email, passwordHash });
        await tx.insert(schema.tenants).values({ id: tenantId, name });
        await tx.insert(schema.memberships).values({ userId, tenantId, role: 'owner' });
      });
      return createSession(userId, tenantId);
    },
    async login(emailInput: string, password: string) {
      const email = normEmail(emailInput); validate(email, password); await throttle(email);
      const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !valid) throw new Error('Invalid credentials');
      const [member] = await db.select().from(schema.memberships).where(eq(schema.memberships.userId, user.id)).limit(1);
      if (!member) throw new Error('Invalid credentials');
      return createSession(user.id, member.tenantId);
    },
    current,
    async logout(token: string | undefined) { if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, digest(token))); },
    async listDrafts(token: string | undefined) {
      const actor = await requireUser(token);
      return db.select().from(schema.posts).where(and(eq(schema.posts.tenantId, actor.tenantId), eq(schema.posts.status, 'draft'))).orderBy(desc(schema.posts.createdAt)).limit(100);
    },
    async createDraft(token: string | undefined, input: string) {
      const actor = await requireUser(token);
      if (!['owner', 'editor'].includes(actor.role)) throw new Error('Forbidden');
      const text = input.trim(); if (!text || text.length > 10000) throw new Error('Invalid draft');
      const [post] = await db.insert(schema.posts).values({ id: randomUUID(), tenantId: actor.tenantId, text, status: 'draft' }).returning(); return post;
    },
    async updateDraft(token: string | undefined, id: string, input: string) {
      const actor = await requireUser(token);
      if (!['owner', 'editor'].includes(actor.role)) throw new Error('Forbidden');
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('Invalid draft');
      const text = input.trim(); if (!text || text.length > 10000) throw new Error('Invalid draft');
      const updated = await db.update(schema.posts).set({ text, updatedAt: new Date() }).where(and(eq(schema.posts.id, id), eq(schema.posts.tenantId, actor.tenantId), eq(schema.posts.status, 'draft'))).returning({ id: schema.posts.id });
      return updated.length === 1;
    },
    async deleteDraft(token: string | undefined, id: string) {
      const actor = await requireUser(token);
      if (!['owner', 'editor'].includes(actor.role)) throw new Error('Forbidden');
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('Invalid draft');
      const deleted = await db.delete(schema.posts).where(and(eq(schema.posts.id, id), eq(schema.posts.tenantId, actor.tenantId), eq(schema.posts.status, 'draft'))).returning({ id: schema.posts.id });
      return deleted.length === 1;
    },
  };
}
