import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '../../db/client';
import { createStore } from '../../db/store';
import { createDraft, updateDraft, deleteDraft } from '../actions';
import { Shell } from '../shell';
export const dynamic = 'force-dynamic';
export default async function Drafts({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const store = createStore(db), token = (await cookies()).get('marketing_os_session')?.value;
  const actor = await store.current(token); if (!actor) redirect('/login');
  const drafts = await store.listDrafts(token); const error = (await searchParams).error;
  const editable = actor.role === 'owner' || actor.role === 'editor';
  return <Shell workspace={actor.tenantName}><div className="eyebrow">CONTENU</div><h1>Brouillons</h1><p className="muted">Préparez vos textes avant leur publication.</p>{error && <p className="alert" role="alert">Action impossible. Vérifiez votre saisie et réessayez.</p>}{editable && <section className="panel"><h2>Nouveau brouillon</h2><form action={createDraft} className="form"><label>Texte<textarea name="text" required maxLength={10000} rows={5}/></label><button type="submit">Enregistrer le brouillon</button></form></section>}<section className="draft-list"><h2>Vos brouillons</h2>{drafts.length === 0 ? <p className="empty">Aucun brouillon pour le moment.</p> : drafts.map(d => <article className="draft" key={d.id}><div><span className="status">Brouillon</span>{editable ? <form action={updateDraft} className="form edit-form"><input type="hidden" name="id" value={d.id}/><label>Modifier le texte<textarea name="text" defaultValue={d.text} required maxLength={10000} rows={3}/></label><button type="submit">Enregistrer les modifications</button></form> : <p className="draft-text">{d.text}</p>}</div>{editable && <form action={deleteDraft}><input type="hidden" name="id" value={d.id}/><button className="delete" type="submit" aria-label="Supprimer le brouillon">Supprimer</button></form>}</article>)}{drafts.length === 100 && <p className="hint">Les 100 brouillons les plus récents sont affichés.</p>}</section></Shell>;
}
