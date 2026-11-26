import { cookies } from 'next/headers';
import { db } from '../../../../db/client';
import { createStore } from '../../../../db/store';
import { validReportRange } from '../../../../domain/content-report';
import { makePdf, pdfUnsupportedText, pdfWithinLimits } from '../../../../domain/pdf-report';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const token = (await cookies()).get('marketing_os_session')?.value, store = createStore(db), actor = await store.current(token);
  if (!actor) return new Response('Authentification requise', { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
  const url = new URL(request.url), start = url.searchParams.get('start') ?? '', end = url.searchParams.get('end') ?? '';
  if (!validReportRange(start, end)) return new Response('Période invalide : maximum 366 jours.', { status: 400, headers: { 'Cache-Control': 'private, no-store' } });
  const rows = await store.reportCompetitorObservations(token, start, end);
  if (!pdfWithinLimits(rows)) return new Response('Rapport trop volumineux : choisissez une période plus courte (maximum 100 observations et 100 000 caractères).', { status: 413, headers: { 'Cache-Control': 'private, no-store' } });
  if (pdfUnsupportedText([actor.tenantName, ...rows.flatMap(row => Object.values(row).filter((value): value is string => typeof value === 'string'))])) return new Response('Le PDF ne prend pas encore en charge ce texte (écriture de droite à gauche ou caractères absents de la police). Utilisez le CSV.', { status: 422, headers: { 'Cache-Control': 'private, no-store' } });
  const pdf = await makePdf('competitors', start, end, actor.tenantName, rows);
  return new Response(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="concurrents-${start}-${end}.pdf"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
