import { pgTable, uuid, varchar, text, timestamp, integer, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';

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
