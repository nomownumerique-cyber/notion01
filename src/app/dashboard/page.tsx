import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '../../db/client';
import { createStore } from '../../db/store';
import { dashboardPeriod, defaultDashboardPeriod } from '../../domain/dashboard-period';
import { Shell } from '../shell';
export const dynamic = 'force-dynamic';
const labels: Record<string, string> = { idea: 'Idées', draft: 'Brouillons', review: 'En validation', approved: 'Validés' };
export default async function Dashboard({ searchParams }: { searchParams: Promise<{ start?: string; end?: string }> }) {
  const store = createStore(db), token = (await cookies()).get('marketing_os_session')?.value;
  const actor = await store.current(token); if (!actor) redirect('/login');
  const params = await searchParams, hasFilter = params.start !== undefined || params.end !== undefined;
  const selected = typeof params.start === 'string' && typeof params.end === 'string' ? dashboardPeriod(params.start, params.end) : null;
  const period = selected ?? defaultDashboardPeriod(new Date());
  const data = await store.dashboardCounts(token, period.start, period.end);
  const get = (rows: { status: string; count: number }[], status: string) => rows.find(row => row.status === status)?.count ?? 0;
  return <Shell workspace={actor.tenantName}>
    <div className="eyebrow">VUE D’ENSEMBLE</div><h1>Votre espace marketing</h1>
    <p className="muted">Suivez les contenus préparés dans cet espace.</p>
    <section className="panel"><h2>Période des contenus</h2>
      <p className="hint">Source : calendrier interne. Les chiffres reflètent le statut actuel des contenus selon leur date indicative, pas un historique des statuts. Les contenus sans date ne sont pas comptés. La période précédente a la même durée. Aucune publication automatique n’est active.</p>
      {hasFilter && !selected && <p className="alert" role="alert">Période invalide. Choisissez jusqu’à 366 jours entre 1901 et 2098 ; les 30 derniers jours sont affichés.</p>}
      <form className="form period-form" action="/dashboard" method="get"><label>Du<input type="date" name="start" min="1901-01-01" max="2098-12-31" defaultValue={period.start} required /></label><label>Au<input type="date" name="end" min="1901-01-01" max="2098-12-31" defaultValue={period.end} required /></label><button type="submit">Appliquer</button></form>
      <p className="hint">Période précédente : {data.period.previousStart} au {data.period.previousEnd}.</p>
    </section>
    <h2 className="dashboard-heading">Contenus par statut actuel</h2>
    <div className="cards" aria-label="Contenus par statut">{Object.entries(labels).map(([status, label]) => <section className="metric" key={status}><span className="metric-label">{label}</span><strong>{get(data.current, status)}</strong><p className="hint">Période précédente : {get(data.previous, status)}</p></section>)}</div>
    <p><Link className="inline-link" href="/planner">Voir le calendrier →</Link></p>
    <section className="metric"><span className="metric-label">Données des réseaux et publicités</span><strong className="unavailable">Indisponibles</strong><p className="hint">Aucune intégration sociale ou publicitaire n’est encore disponible.</p></section>
  </Shell>;
}
