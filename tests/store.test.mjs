import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { createStore } from '../src/db/store.ts';
import * as schema from '../src/db/schema.ts';

const client = new PGlite();
await client.exec(await readFile(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
await client.exec(await readFile(new URL('../migrations/0002_competitors.sql', import.meta.url), 'utf8'));
await client.exec(await readFile(new URL('../migrations/0003_content_planner.sql', import.meta.url), 'utf8'));
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
test('planning is tenant-scoped and does not change publication status', async () => {
  const draft = await store.createDraft(alice, 'Planned text');
  assert.equal(await store.planDraft(bob, draft.id, '2026-02-12', 'Campaign'), false);
  assert.equal(await store.planDraft(alice, draft.id, '2026-02-12', '  Campaign  '), true);
  const planned = await store.listPlannedDrafts(alice, '2026-02-01', '2026-02-28');
  assert.equal(planned.length, 1); assert.equal(planned[0].plannedDate, '2026-02-12');
  assert.equal(planned[0].category, 'Campaign'); assert.equal(planned[0].status, 'draft');
  assert.equal((await store.listPlannedDrafts(bob, '2026-02-01', '2026-02-28')).length, 0);
  assert.equal(await store.planDraft(alice, draft.id, '', ''), true);
  assert.equal((await store.listPlannedDrafts(alice, '2026-02-01', '2026-02-28')).length, 0);
  await store.deleteDraft(alice, draft.id);
});
test('planner rejects invalid dates, categories, and ranges', async () => {
  const draft = await store.createDraft(alice, 'Test');
  await assert.rejects(store.planDraft(alice, draft.id, '2026-02-30', ''), /Invalid planning date/);
  await assert.rejects(store.planDraft(alice, draft.id, '2026-02-01', 'a'.repeat(81)), /Invalid category/);
  await assert.rejects(store.listPlannedDrafts(alice, '2026-02-01', '2026-04-01'), /Invalid calendar range/);
  await assert.rejects(store.listPlannedDrafts('bad', '2026-02-01', '2026-02-07'), /Unauthorized/);
  await store.deleteDraft(alice, draft.id);
});
test('competitors and observations are tenant-isolated and deletions cascade', async () => {
  const rival = await store.createCompetitor(alice, 'Shop X', 'https://example.com/shop');
  assert.deepEqual((await store.listCompetitors(alice)).map(c => c.name), ['Shop X']);
  assert.equal((await store.listCompetitors(bob)).length, 0);
  await assert.rejects(store.addObservation(bob, rival.id, 'offer', 'Hidden', 'https://example.com/offer', '2025-01-01'), /not found/);
  const observation = await store.addObservation(alice, rival.id, 'price', 'Price shown: 1500 DZD', 'https://example.com/product', '2025-01-01');
  assert.equal(observation.observedDate, '2025-01-01'); assert.ok(observation.collectedAt instanceof Date);
  assert.equal((await store.listObservations(bob)).length, 0);
  assert.equal(await store.deleteObservation(bob, observation.id), false);
  assert.equal(await store.deleteCompetitor(bob, rival.id), false);
  assert.equal(await store.deleteCompetitor(alice, rival.id), true);
  assert.equal((await store.listObservations(alice)).length, 0);
});
test('competitor input validation rejects unsafe URLs and invalid observations', async () => {
  for (const url of ['javascript:alert(1)', 'http://example.com', 'https://user:pass@example.com', 'https://localhost/']) {
    await assert.rejects(store.createCompetitor(alice, 'Shop', url), /Invalid public URL/);
  }
  const rival = await store.createCompetitor(alice, 'Shop Y', 'https://example.com/');
  for (const date of ['2025-02-30', '3000-01-01', 'not-a-date']) await assert.rejects(store.addObservation(alice, rival.id, 'offer', 'A', 'https://example.com', date), /Invalid observation date/);
  await assert.rejects(store.addObservation(alice, rival.id, 'bogus', 'A', 'https://example.com', '2025-01-01'), /Invalid observation kind/);
  await assert.rejects(store.addObservation(alice, rival.id, 'offer', ' ', 'https://example.com', '2025-01-01'), /Invalid note/);
  await assert.rejects(store.listCompetitors('invalid'), /Unauthorized/);
  await store.deleteCompetitor(alice, rival.id);
});
test('reviewers can read competitors but cannot change them', async () => {
  const actor = await store.current(alice);
  await client.query("UPDATE memberships SET role = 'reviewer' WHERE tenant_id = $1 AND user_id = $2", [actor.tenantId, actor.userId]);
  await store.listCompetitors(alice);
  await assert.rejects(store.createCompetitor(alice, 'Shop', 'https://example.com'), /Forbidden/);
  await assert.rejects(store.planDraft(alice, '00000000-0000-4000-8000-000000000000', '2026-01-01', ''), /Forbidden/);
  await client.query("UPDATE memberships SET role = 'owner' WHERE tenant_id = $1 AND user_id = $2", [actor.tenantId, actor.userId]);
});
test('removing membership immediately revokes access', async () => {
  const actor = await store.current(bob);
  await client.query('DELETE FROM memberships WHERE tenant_id = $1 AND user_id = $2', [actor.tenantId, actor.userId]);
  assert.equal(await store.current(bob), null);
});
test.after(async () => { await client.close(); });
