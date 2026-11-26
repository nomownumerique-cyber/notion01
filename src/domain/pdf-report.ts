import PDFDocument from 'pdfkit';
import { join } from 'node:path';
import * as fontkit from 'fontkit';
import type { ReportRow } from './content-report.ts';
import type { CompetitorReportRow } from './competitor-report.ts';

const fonts = join(process.cwd(), 'node_modules', 'dejavu-fonts-ttf', 'ttf');
const status: Record<string, string> = { idea: 'Idée', draft: 'Brouillon', review: 'En validation', approved: 'Validé' };
const kinds: Record<string, string> = { publication: 'Publication', offer: 'Offre', price: 'Prix', positioning: 'Positionnement', other: 'Autre' };
export function pdfWithinLimits(rows: Array<{ text?: string; note?: string; name?: string; publicUrl?: string; sourceUrl?: string; category?: string | null }>): boolean {
  return rows.length <= 100 && rows.reduce((sum, row) => sum + (row.text?.length ?? 0) + (row.note?.length ?? 0) + (row.name?.length ?? 0) + (row.publicUrl?.length ?? 0) + (row.sourceUrl?.length ?? 0) + (row.category?.length ?? 0), 0) <= 100000;
}
// PDFKit does not reliably apply bidirectional layout. Reject such text rather than
// producing a misleading report; CSV remains available without this restriction.
export function pdfUnsupportedText(values: string[]): boolean {
  const font = fontkit.openSync(join(fonts, 'DejaVuSans.ttf')), bold = fontkit.openSync(join(fonts, 'DejaVuSans-Bold.ttf'));
  if (!('hasGlyphForCodePoint' in font) || !('hasGlyphForCodePoint' in bold)) throw new Error('Invalid PDF font');
  return values.some(value => [...value].some(character => {
    const cp = character.codePointAt(0)!;
    if (cp === 9 || cp === 10 || cp === 13) return false;
    return cp < 32 || cp === 127 || /[\u0590-\u08ff\u200c-\u200f\u202a-\u202e\u2066-\u2069\ufb1d-\ufeff]/u.test(character) || (cp >= 0x10800 && cp <= 0x10fff) || (cp >= 0x1e900 && cp <= 0x1e95f) || !font.hasGlyphForCodePoint(cp) || !bold.hasGlyphForCodePoint(cp);
  }));
}
function safe(value: string): string { return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ''); }
export async function makePdf(kind: 'content' | 'competitors', start: string, end: string, workspace: string, rows: ReportRow[] | CompetitorReportRow[]): Promise<Buffer> {
  const title = kind === 'content' ? 'Contenus du calendrier' : 'Observations concurrentielles';
  const doc = new PDFDocument({ size: 'A4', margins: { top: 48, bottom: 48, left: 48, right: 48 }, info: { Title: title, Author: 'Marketing OS' } });
  const chunks: Buffer[] = [];
  const completed = new Promise<Buffer>((resolve, reject) => { doc.on('data', (chunk: Buffer) => chunks.push(chunk)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });
  doc.registerFont('regular', join(fonts, 'DejaVuSans.ttf')); doc.registerFont('bold', join(fonts, 'DejaVuSans-Bold.ttf'));
  const body = (value: string, font = 'regular', color = '#243247', size = 11) => doc.font(font).fontSize(size).fillColor(color).text(safe(value), { lineGap: 3 });
  body('MARKETING OS  /  RAPPORT', 'bold', '#2459be', 10);
  doc.moveDown(.8); body(title, 'bold', '#182639', 20); doc.moveDown(.35);
  body(`Espace : ${workspace}`); body(`Période : ${start} au ${end}`);
  body(`Généré le : ${new Date().toISOString()} (UTC)`, 'regular', '#53647b', 10);
  doc.moveDown(.7);
  body(kind === 'content' ? 'Source : calendrier interne. Filtre par date indicative ; aucune publication automatique. Les contenus sans date sont exclus.' : 'Source : observations publiques saisies manuellement et non vérifiées automatiquement. Filtre par date observée ; les concurrents sans observation dans la période sont exclus.', 'regular', '#53647b', 10);
  doc.moveDown(.6); body(`${rows.length} ${kind === 'content' ? 'contenu(s)' : 'observation(s)'}`, 'bold', '#182639', 12);
  if (!rows.length) { doc.moveDown(); body('Aucune donnée enregistrée pour cette période.', 'regular', '#53647b'); }
  rows.forEach((entry, index) => {
    doc.moveDown(1);
    if (doc.y > doc.page.height - doc.page.margins.bottom - 90) doc.addPage();
    body(`${String(index + 1).padStart(2, '0')}  /  ${kind === 'content' ? 'CONTENU' : 'OBSERVATION'}`, 'bold', '#2459be', 10);
    doc.moveDown(.3);
    if (kind === 'content') {
      const row = entry as ReportRow;
      body(`Date indicative : ${row.plannedDate ?? 'Non renseignée'}  |  Statut actuel : ${status[row.status] ?? row.status}`, 'bold', '#182639', 10);
      if (row.category) body(`Catégorie : ${row.category}`, 'regular', '#53647b', 10);
      doc.moveDown(.35); body(row.text);
    } else {
      const row = entry as CompetitorReportRow;
      body(row.name, 'bold', '#182639', 13);
      body(`Type : ${kinds[row.kind] ?? row.kind}  |  Observé le : ${row.observedDate}`, 'regular', '#53647b', 10);
      body(`Enregistré le : ${row.collectedAt.toISOString()} (UTC)`, 'regular', '#53647b', 10);
      doc.moveDown(.3); body(row.note); doc.moveDown(.3);
      body(`Page publique : ${row.publicUrl}`, 'regular', '#53647b', 10);
      body(`Source : ${row.sourceUrl}`, 'regular', '#53647b', 10);
    }
  });
  doc.end(); return completed;
}
