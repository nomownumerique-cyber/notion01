import { pgTable, uuid, varchar, text, timestamp, integer, primaryKey, uniqueIndex, date, foreignKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), email: varchar('email', { length: 254 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey(), name: varchar('name', { length: 120 }).notNull(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const memberships = pgTable('memberships', {
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), role: varchar('role', { length: 20 }).notNull(),
}, (t) => [primaryKey({ columns: [t.tenantId, t.userId] })]);
export const sessions = pgTable('sessions', {
  tokenHash: varchar('token_hash', { length: 64 }).primaryKey(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }), expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey(), tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  text: text('text').notNull(), status: varchar('status', { length: 20 }).notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const authAttempts = pgTable('auth_attempts', {
  key: varchar('key', { length: 64 }).primaryKey(), attempts: integer('attempts').notNull(), windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
});

export const competitors = pgTable('competitors', {
  id: uuid('id').primaryKey(), tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(), publicUrl: text('public_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('competitors_tenant_id_unique').on(t.tenantId, t.id)]);
export const competitorObservations = pgTable('competitor_observations', {
  id: uuid('id').primaryKey(), tenantId: uuid('tenant_id').notNull(), competitorId: uuid('competitor_id').notNull(),
  kind: varchar('kind', { length: 20 }).notNull(), note: text('note').notNull(), sourceUrl: text('source_url').notNull(),
  observedDate: date('observed_date').notNull(), collectedAt: timestamp('collected_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [foreignKey({ columns: [t.tenantId, t.competitorId], foreignColumns: [competitors.tenantId, competitors.id] }).onDelete('cascade')]);
