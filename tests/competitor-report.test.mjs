import test from 'node:test';
import assert from 'node:assert/strict';
import { competitorCsv } from '../src/domain/competitor-report.ts';
test('competitor CSV includes dates, public sources and neutralizes formulas', () => {
  const csv = competitorCsv([{ name: '=unsafe', publicUrl: 'https://example.com/shop', kind: 'price', note: '"Prix", 1 500 DZD', sourceUrl: 'https://example.com/item', observedDate: '2025-01-01', collectedAt: new Date('2026-11-26T12:00:00Z') }]);
  assert.match(csv, /^\uFEFF/); assert.match(csv, /"'=unsafe"/); assert.match(csv, /""Prix"", 1 500 DZD/);
  assert.match(csv, /"Prix"/); assert.match(csv, /https:\/\/example.com\/item/);
  assert.match(csv, /2025-01-01/); assert.match(csv, /2026-11-26T12:00:00.000Z/);
  assert.equal(competitorCsv([]).split('\r\n').length, 2);
});
