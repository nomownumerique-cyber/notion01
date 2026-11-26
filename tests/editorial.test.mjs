import test from 'node:test';
import assert from 'node:assert/strict';
import { transition } from '../src/domain/editorial.ts';
const now = new Date('2026-01-01T00:00:00.000Z');
const post = { tenantId: 'tenant-a', status: 'approved', text: 'Product update', scheduledAt: null, version: 1 };
const editor = { tenantId: 'tenant-a', role: 'editor' };
test('schedule accepts future UTC time and increments version', () => {
  assert.deepEqual(transition(post, editor, 'scheduled', 1, now, '2026-01-02T00:00:00Z'), { ...post, status: 'scheduled', scheduledAt: '2026-01-02T00:00:00Z', version: 2 });
});
test('reject cross-tenant access, stale versions, and invalid transition', () => {
  assert.throws(() => transition(post, { ...editor, tenantId: 'tenant-b' }, 'scheduled', 1, now), /Forbidden/);
  assert.throws(() => transition(post, editor, 'scheduled', 2, now), /Version conflict/);
  assert.throws(() => transition(post, editor, 'published', 1, now), /Invalid transition/);
});
test('reject empty content, past, ambiguous and invalid schedule', () => {
  assert.throws(() => transition({ ...post, text: ' ' }, editor, 'scheduled', 1, now, '2026-01-02T00:00:00Z'), /Content/);
  for (const time of ['2025-12-01T00:00:00Z', '2026-01-02T00:00:00', '2026-02-30T00:00:00Z']) assert.throws(() => transition(post, editor, 'scheduled', 1, now, time));
});
test('review approval and worker transitions require appropriate roles', () => {
  const review = { ...post, status: 'review' };
  assert.throws(() => transition(review, editor, 'approved', 1, now), /Forbidden/);
  assert.equal(transition(review, { ...editor, role: 'reviewer' }, 'approved', 1, now).status, 'approved');
  const scheduled = { ...post, status: 'scheduled', scheduledAt: '2026-01-02T00:00:00Z' };
  assert.throws(() => transition(scheduled, editor, 'publishing', 1, now), /Forbidden/);
  assert.throws(() => transition(scheduled, { ...editor, role: 'worker' }, 'publishing', 1, now), /not due/);
  assert.equal(transition(scheduled, { ...editor, role: 'worker' }, 'publishing', 1, new Date('2026-01-02T00:00:00Z')).status, 'publishing');
});
