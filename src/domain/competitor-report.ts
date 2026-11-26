import { csvCell } from './content-report.ts';

export type CompetitorReportRow = { name: string; publicUrl: string; kind: string; note: string; sourceUrl: string; observedDate: string; collectedAt: Date };
const labels: Record<string, string> = { publication: 'Publication', offer: 'Offre', price: 'Prix', positioning: 'Positionnement', other: 'Autre' };
export function competitorCsv(rows: CompetitorReportRow[]): string {
  const header = ['Concurrent', 'Page publique', 'Type', 'Observation saisie manuellement', 'Source publique', 'Date observée', 'Enregistré le (UTC)'];
  const lines = [header, ...rows.map(row => [row.name, row.publicUrl, labels[row.kind] ?? row.kind, row.note, row.sourceUrl, row.observedDate, row.collectedAt.toISOString()])];
  return '\uFEFF' + lines.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
