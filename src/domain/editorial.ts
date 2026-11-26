export type Status = 'idea' | 'draft' | 'review' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed';
export type Role = 'owner' | 'editor' | 'reviewer' | 'worker';
export type Actor = { tenantId: string; role: Role };
export type Post = { tenantId: string; status: Status; text: string; scheduledAt: string | null; version: number };

const transitions: Record<Status, readonly Status[]> = {
  idea: ['draft'], draft: ['review'], review: ['draft', 'approved'],
  approved: ['draft', 'scheduled'], scheduled: ['draft', 'publishing'],
  publishing: ['published', 'failed'], failed: ['draft', 'scheduled'], published: [],
};

/** Caller must supply an authenticated actor and enforce version atomically in persistence. */
export function transition(post: Post, actor: Actor, target: Status, expectedVersion: number, now: Date, scheduledAt?: string): Post {
  if (!post.tenantId || post.tenantId !== actor.tenantId) throw new Error('Forbidden');
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion !== post.version) throw new Error('Version conflict');
  if (!transitions[post.status]?.includes(target)) throw new Error('Invalid transition');
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid current time');
  const workerAction = target === 'publishing' || target === 'published' || target === 'failed';
  if (workerAction ? actor.role !== 'worker' : !['owner', 'editor', 'reviewer'].includes(actor.role)) throw new Error('Forbidden');
  if (actor.role === 'reviewer' && !(post.status === 'review' && (target === 'approved' || target === 'draft'))) throw new Error('Forbidden');
  if (target === 'approved' && actor.role !== 'owner' && actor.role !== 'reviewer') throw new Error('Forbidden');
  if (target === 'publishing' && (!post.scheduledAt || !Number.isFinite(Date.parse(post.scheduledAt)) || Date.parse(post.scheduledAt) > now.getTime())) throw new Error('Post is not due');
  if (target === 'scheduled') {
    if (!post.text.trim()) throw new Error('Content is required');
    // Require an unambiguous UTC instant rather than a local time.
    if (!scheduledAt || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(scheduledAt)) throw new Error('UTC schedule required');
    const date = new Date(scheduledAt);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= now.getTime()) throw new Error('Schedule must be in the future');
    // Reject normalized invalid dates such as February 30.
    if (date.toISOString() !== (scheduledAt.includes('.') ? scheduledAt : scheduledAt.replace('Z', '.000Z'))) throw new Error('Invalid schedule');
  }
  return { ...post, status: target, scheduledAt: target === 'scheduled' ? scheduledAt! : target === 'draft' ? null : post.scheduledAt, version: post.version + 1 };
}
