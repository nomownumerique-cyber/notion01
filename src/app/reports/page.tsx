import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '../../db/client';
import { createStore } from '../../db/store';
import { Shell } from '../shell';
export const dynamic = 'force-dynamic';
export default async function Reports() {
  const actor = await createStore(db).current((await cookies()).get('marketing_os_session')?.value);
  if (!actor) redirect('/login');
  const today = new Date().toISOString().slice(0, 10);
  return <Shell workspace={actor.tenantName}>
    <div className="eyebrow">DONNÉES INTERNES</div><h1>Rapports</h1>
    <p className="muted">Exportez les données enregistrées dans votre espace.</p>
    <section className="panel" aria-labelledby="content-report"><h2 id="content-report">Contenus planifiés · CSV</h2>
      <p className="hint">Source : contenus de cet espace, filtrés par date indicative. Ces dates ne déclenchent aucune publication. Les contenus sans date sont exclus. Maximum : 366 jours et 500 contenus par export.</p>
      <form className="form" action="/api/reports/content.csv" method="get"><label>Date de début<input type="date" name="start" min="1900-01-01" max="2099-12-31" defaultValue={today} required /></label><label>Date de fin<input type="date" name="end" min="1900-01-01" max="2099-12-31" defaultValue={today} required /></label><button type="submit">Télécharger le CSV</button></form>
    </section>
    <section className="panel report-section" aria-labelledby="competitor-report"><h2 id="competitor-report">Observations concurrentielles · CSV</h2>
      <p className="hint">Source : observations publiques saisies manuellement dans cet espace, non vérifiées automatiquement. Filtre par date observée ; les concurrents sans observation dans la période sont exclus. Maximum : 366 jours et 500 observations par export.</p>
      <form className="form" action="/api/reports/competitors.csv" method="get"><label>Date de début<input type="date" name="start" min="1900-01-01" max="2099-12-31" defaultValue={today} required /></label><label>Date de fin<input type="date" name="end" min="1900-01-01" max="2099-12-31" defaultValue={today} required /></label><button type="submit">Télécharger le CSV</button></form>
    </section>
    <p className="hint">Les rapports PDF et les statistiques des réseaux sociaux et des publicités ne sont pas encore disponibles.</p>
  </Shell>;
}
