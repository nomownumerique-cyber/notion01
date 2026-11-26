import { parseDate } from './calendar.ts';

export function validReportRange(start: string, end: string): boolean {
  const from = parseDate(start), to = parseDate(end);
  return !!from && !!to && to.getTime() >= from.getTime() && to.getTime() - from.getTime() <= 365 * 86400000;
}

// Quote every cell and neutralize spreadsheet formulas, including leading whitespace.
export function csvCell(value: string): string {
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/u.test(value) || /^[\t\r\n]/u.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export type ReportRow = { plannedDate: string | null; status: string; category: string | null; text: string };
export function contentCsv(rows: ReportRow[]): string {
  const labels: Record<string, string> = { idea: 'Idée', draft: 'Brouillon', review: 'En validation', approved: 'Validé' };
  const lines = [['Date indicative', 'Statut', 'Catégorie', 'Texte'], ...rows.map(row => [row.plannedDate ?? '', labels[row.status] ?? row.status, row.category ?? '', row.text])];
  return '\uFEFF' + lines.map(line => line.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
