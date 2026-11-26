import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '../../db/client';
import { createStore } from '../../db/store';
import { addObservation, createCompetitor, deleteCompetitor, deleteObservation } from '../actions';
import { Shell } from '../shell';
export const dynamic = 'force-dynamic';
const labels: Record<string, string> = { publication: 'Publication', offer: 'Offre', price: 'Prix', positioning: 'Positionnement', other: 'Autre' };
const dateLabel = (value: Date) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(value);
export default async function Competitors({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const store = createStore(db), token = (await cookies()).get('marketing_os_session')?.value;
  const actor = await store.current(token); if (!actor) redirect('/login');
  const competitors = await store.listCompetitors(token);
  const observations = await store.listObservations(token);
  const error = (await searchParams).error, editable = actor.role === 'owner' || actor.role === 'editor';
  return <Shell workspace={actor.tenantName}>
    <div className="eyebrow">VEILLE CONCURRENTIELLE</div><h1>Concurrents</h1>
    <p className="muted">Consignez des informations publiques et leurs sources. Les données sont saisies manuellement, sans vérification automatique.</p>
    {error && <p className="alert" role="alert">Action impossible. Vérifiez les champs, le lien HTTPS et la date, puis réessayez.</p>}
    {editable && <section className="panel"><h2>Ajouter un concurrent</h2><form action={createCompetitor} className="form"><label>Nom<input name="name" required maxLength={120}/></label><label>Adresse de la page publique<input name="publicUrl" type="url" required maxLength={2048} placeholder="https://..." /></label><button type="submit">Ajouter le concurrent</button></form></section>}
    <section className="draft-list"><h2>Concurrents enregistrés</h2>
      {competitors.length === 0 ? <p className="empty">Aucun concurrent enregistré.</p> : competitors.map(c => <article className="competitor" key={c.id}>
        <div className="competitor-heading"><div><h3>{c.name}</h3><a href={c.publicUrl} target="_blank" rel="noreferrer noopener">Ouvrir la page publique ↗</a></div>{editable && <form action={deleteCompetitor}><input type="hidden" name="id" value={c.id}/><button className="delete" type="submit" aria-label={`Supprimer ${c.name} et ses observations`}>Supprimer</button></form>}</div>
        <p className="hint">La suppression du concurrent supprime aussi ses observations.</p>
        <h4>Observations</h4>
        {observations.filter(o => o.competitorId === c.id).length === 0 ? <p className="hint">Aucune observation affichée.</p> : observations.filter(o => o.competitorId === c.id).map(o => <div className="observation" key={o.id}><div><span className="status">{labels[o.kind]}</span><p className="draft-text">{o.note}</p><p className="hint">Observé le {o.observedDate} · Enregistré le {dateLabel(o.collectedAt)} UTC</p><a href={o.sourceUrl} target="_blank" rel="noreferrer noopener">Voir la source ↗</a></div>{editable && <form action={deleteObservation}><input type="hidden" name="id" value={o.id}/><button className="delete" type="submit" aria-label={`Supprimer l’observation ${o.id}`}>Supprimer</button></form>}</div>)}
        {editable && <details className="observation-form"><summary>Ajouter une observation</summary><form action={addObservation} className="form"><input type="hidden" name="competitorId" value={c.id}/><label>Type<select name="kind" defaultValue="publication"><option value="publication">Publication</option><option value="offer">Offre</option><option value="price">Prix</option><option value="positioning">Positionnement</option><option value="other">Autre</option></select></label><label>Observation<textarea name="note" maxLength={5000} required rows={3}/></label><label>Adresse de la source publique<input name="sourceUrl" type="url" required maxLength={2048} placeholder="https://..."/></label><label>Date observée<input name="observedDate" type="date" required max={new Date().toISOString().slice(0, 10)}/></label><button type="submit">Enregistrer l’observation</button></form></details>}
      </article>)}
      {competitors.length === 100 && <p className="hint">Les 100 concurrents les plus récents sont affichés.</p>}{observations.length === 500 && <p className="hint">Les 500 observations les plus récentes sont affichées.</p>}
    </section>
  </Shell>;
}
