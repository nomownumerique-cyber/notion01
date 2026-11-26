import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDate, calendarRange, isoDate, shiftAnchor } from '../src/domain/calendar.ts';
test('calendar rejects invalid dates and handles leap years', () => {
  assert.equal(parseDate('2026-02-29'), null);
  assert.equal(isoDate(parseDate('2024-02-29')), '2024-02-29');
  assert.equal(parseDate('not-a-date'), null);
});
test('month view starts Monday and ends Sunday including adjacent days', () => {
  const range = calendarRange(parseDate('2026-02-21'), 'month');
  assert.equal(range.start, '2026-01-26'); assert.equal(range.end, '2026-03-01'); assert.equal(range.dates.length, 35);
});
test('week view and navigation cross year boundaries', () => {
  const date = parseDate('2026-01-01'), week = calendarRange(date, 'week');
  assert.equal(week.start, '2025-12-29'); assert.equal(week.end, '2026-01-04');
  assert.equal(isoDate(shiftAnchor(date, 'week', -1)), '2025-12-25');
  assert.equal(isoDate(shiftAnchor(date, 'month', -1)), '2025-12-01');
});
