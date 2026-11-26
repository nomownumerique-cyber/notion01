import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '../../db/client';
import { createStore } from '../../db/store';
import { Shell } from '../shell';
export const dynamic = 'force-dynamic';
export default async function Dashboard() {
  const store = createStore(db), token = (await cookies()).get('marketing_os_session')?.value;
  const actor = await store.current(token); if (!actor) redirect('/login');
  const drafts = await store.listDrafts(token);
  return <Shell workspace={actor.tenantName}><div className="eyebrow">VUE D’ENSEMBLE</div><h1>Votre espace marketing</h1><p className="muted">Retrouvez vos contenus en préparation.</p><div className="cards"><section className="metric"><span className="metric-label">Brouillons récents</span><strong>{drafts.length === 100 ? '100+' : drafts.length}</strong><p className="hint">Brouillons chargés dans cet espace.</p><Link className="inline-link" href="/drafts">Voir les brouillons →</Link></section><section className="metric"><span className="metric-label">Données des réseaux</span><strong className="unavailable">Indisponibles</strong><p className="hint">Aucune intégration sociale n’est encore disponible.</p></section></div></Shell>;
}
