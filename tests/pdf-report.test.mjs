import test from 'node:test';
import assert from 'node:assert/strict';
import { makePdf, pdfUnsupportedText, pdfWithinLimits } from '../src/domain/pdf-report.ts';
test('PDF reports enforce limits without truncating', () => {
  assert.equal(pdfWithinLimits(Array.from({length: 101}, () => ({text:'x'}))), false);
  assert.equal(pdfWithinLimits([{text:'x'.repeat(100001)}]), false);
  assert.equal(pdfWithinLimits([{text:'x'.repeat(100000)}]), true);
});
test('PDF renderer creates empty and French reports', async () => {
  const empty = await makePdf('competitors', '2026-01-01', '2026-01-02', 'Boutique', []);
  assert.equal(empty.subarray(0,5).toString(), '%PDF-');
  const filled = await makePdf('content', '2026-01-01', '2026-01-02', 'Boutique', [{plannedDate:'2026-01-01',status:'draft',category:'Été',text:'Promotion spéciale et livraison'}]);
  assert.equal(filled.subarray(0,5).toString(), '%PDF-'); assert.ok(filled.length > 2000);
});

test('unsupported bidirectional and missing glyph text is rejected before rendering', () => {
  assert.equal(pdfUnsupportedText(['Bonjour é è à']), false);
  assert.equal(pdfUnsupportedText(['Bonjour مرحبا']), true);
  assert.equal(pdfUnsupportedText(['texte 漢']), true);
  assert.equal(pdfUnsupportedText(['texte\u0001']), true);
});
