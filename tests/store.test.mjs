import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { createStore } from '../src/db/store.ts';
import * as schema from '../src/db/schema.ts';

const client = new PGlite();
await client.exec(await readFile(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
const store = createStore(drizzle(client, { schema }));
let alice, bob, aliceDraft;
test('register accounts and establish isolated workspaces', async () => {
  alice = await store.register('Alice@example.com', 'correct horse battery', 'Alice shop');
  bob = await store.register('bob@example.com', 'correct horse battery', 'Bob shop');
  assert.equal((await store.current(alice)).email, 'alice@example.com');
  assert.notEqual((await store.current(alice)).tenantId, (await store.current(bob)).tenantId);
});
test('invalid passwords and duplicate accounts fail', async () => {
  await assert.rejects(store.login('alice@example.com', 'wrong password 1'), /Invalid credentials/);
  await assert.rejects(store.register('alice@example.com', 'correct horse battery', 'Other'));
  await assert.rejects(store.register('x@example.com', 'short', 'Other'), /Invalid credentials/);
});
test('draft creation and deletion are scoped to the session tenant', async () => {
  aliceDraft = await store.createDraft(alice, '  Product launch  ');
  await store.createDraft(bob, 'Bob private draft');
  assert.deepEqual((await store.listDrafts(alice)).map(p => p.text), ['Product launch']);
  assert.deepEqual((await store.listDrafts(bob)).map(p => p.text), ['Bob private draft']);
  assert.equal(await store.updateDraft(bob, aliceDraft.id, 'Intrusion'), false);
  assert.equal(await store.updateDraft(alice, aliceDraft.id, 'Updated'), true);
  assert.equal((await store.listDrafts(alice))[0].text, 'Updated');
  assert.equal(await store.deleteDraft(bob, aliceDraft.id), false);
  assert.equal((await store.listDrafts(alice)).length, 1);
  assert.equal(await store.deleteDraft(alice, aliceDraft.id), true);
  assert.equal((await store.listDrafts(alice)).length, 0);
});
test('invalid sessions and content are rejected', async () => {
  await assert.rejects(store.listDrafts('invalid'), /Unauthorized/);
  await assert.rejects(store.createDraft(alice, '   '), /Invalid draft/);
  await assert.rejects(store.createDraft(alice, 'a'.repeat(10001)), /Invalid draft/);
  await assert.rejects(store.deleteDraft(alice, 'bad-id'), /Invalid draft/);
});
test('login and revocation invalidate the old session', async () => {
  const fresh = await store.login('ALICE@example.com', 'correct horse battery');
  assert.equal((await store.current(fresh)).tenantName, 'Alice shop');
  await store.logout(fresh); assert.equal(await store.current(fresh), null);
  await assert.rejects(store.listDrafts(fresh), /Unauthorized/);
});
test('expired sessions cannot access drafts', async () => {
  const token = await store.login('alice@example.com', 'correct horse battery');
  const { createHash } = await import('node:crypto');
  const hash = createHash('sha256').update(token).digest('hex');
  await client.query("UPDATE sessions SET expires_at = now() - interval '1 minute' WHERE token_hash = $1", [hash]);
  assert.equal(await store.current(token), null);
  await assert.rejects(store.listDrafts(token), /Unauthorized/);
});
test('repeated authentication attempts are rate limited', async () => {
  for (let i = 0; i < 10; i++) await assert.rejects(store.login('unknown@example.com', 'incorrect password value'), /Invalid credentials/);
  await assert.rejects(store.login('unknown@example.com', 'incorrect password value'), /Too many attempts/);
});
test('removing membership immediately revokes access', async () => {
  const actor = await store.current(bob);
  await client.query('DELETE FROM memberships WHERE tenant_id = $1 AND user_id = $2', [actor.tenantId, actor.userId]);
  assert.equal(await store.current(bob), null);
});
test.after(async () => { await client.close(); });
