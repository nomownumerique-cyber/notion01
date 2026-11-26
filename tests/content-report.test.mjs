import test from 'node:test';
import assert from 'node:assert/strict';
import { validReportRange, csvCell, contentCsv } from '../src/domain/content-report.ts';
test('report range validates real dates and inclusive 366-day maximum', () => {
  assert.equal(validReportRange('2024-01-01', '2024-12-31'), true);
  assert.equal(validReportRange('2024-01-01', '2025-01-01'), false);
  assert.equal(validReportRange('2026-02-29', '2026-03-01'), false);
  assert.equal(validReportRange('2026-02-02', '2026-02-01'), false);
});
test('CSV quotes and neutralizes spreadsheet formulas', () => {
  assert.equal(csvCell(' =SUM(1,2)'), `"' =SUM(1,2)"`);
  assert.equal(csvCell('\t@cmd'), `"'\t@cmd"`);
  assert.equal(csvCell('Texte "cité"\nligne'), '"Texte ""cité""\nligne"');
  assert.match(contentCsv([{plannedDate: '2026-11-26', status: 'approved', category: null, text: '=1+1'}]), /"Validé","","'=1\+1"/);
});
