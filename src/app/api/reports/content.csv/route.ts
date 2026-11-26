import { cookies } from 'next/headers';
import { db } from '../../../../db/client';
import { createStore } from '../../../../db/store';
import { contentCsv, validReportRange } from '../../../../domain/content-report';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const token = (await cookies()).get('marketing_os_session')?.value;
  const store = createStore(db);
  if (!await store.current(token)) return new Response('Authentification requise', { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
  const url = new URL(request.url), start = url.searchParams.get('start') ?? '', end = url.searchParams.get('end') ?? '';
  if (!validReportRange(start, end)) return new Response('Période invalide : maximum 366 jours.', { status: 400, headers: { 'Cache-Control': 'private, no-store' } });
  const rows = await store.reportPlannedContent(token, start, end);
  if (rows.length > 500) return new Response('Plus de 500 contenus : choisissez une période plus courte.', { status: 413, headers: { 'Cache-Control': 'private, no-store' } });
  return new Response(contentCsv(rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="contenus-${start}-${end}.csv"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
