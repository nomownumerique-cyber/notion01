import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardPeriod, defaultDashboardPeriod } from '../src/domain/dashboard-period.ts';
test('dashboard compares an immediately preceding equal-length inclusive period', () => {
  assert.deepEqual(dashboardPeriod('2024-03-01','2024-03-03'), { start:'2024-03-01', end:'2024-03-03', previousStart:'2024-02-27', previousEnd:'2024-02-29' });
  assert.equal(dashboardPeriod('2024-01-01','2025-01-01'), null);
  assert.equal(dashboardPeriod('1900-01-01','1900-01-02'), null);
  assert.equal(dashboardPeriod('2026-02-30','2026-03-01'), null);
  assert.deepEqual(defaultDashboardPeriod(new Date('2026-01-05T10:00:00Z')), { start:'2025-12-07', end:'2026-01-05', previousStart:'2025-11-07', previousEnd:'2025-12-06' });
});
