import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '../../db/client';
import { createStore } from '../../db/store';
import { createIdea, changeEditorialStatus } from '../actions';
import { Shell } from '../shell';
export const dynamic = 'force-dynamic';
const labels: Record<string, string> = { idea: 'Idée', draft: 'Brouillon', review: 'En validation', approved: 'Validé' };
const dateLabel = (value: Date) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(value);
export default async function Workflow({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const store = createStore(db), token = (await cookies()).get('marketing_os_session')?.value;
  const actor = await store.current(token); if (!actor) redirect('/login');
  const posts = await store.listEditorial(token), events = await store.listEditorialEvents(token);
  const error = (await searchParams).error, canEdit = actor.role === 'owner' || actor.role === 'editor', canApprove = actor.role === 'owner' || actor.role === 'reviewer';
  return <Shell workspace={actor.tenantName}><div className="eyebrow">WORKFLOW ÉDITORIAL</div><h1>Validation des contenus</h1><p className="muted">Idée → brouillon → validation → contenu validé. La publication n’est pas encore disponible.</p>
    {error && <p className="alert" role="alert">Action impossible. Le contenu a peut-être changé : actualisez et réessayez, ou vérifiez vos permissions.</p>}
    {canEdit && <section className="panel"><h2>Nouvelle idée</h2><form action={createIdea} className="form"><label>Votre idée<textarea name="text" rows={3} maxLength={10000} required/></label><button type="submit">Ajouter l’idée</button></form></section>}
    <section className="draft-list"><h2>Contenus</h2>{posts.length === 0 && <p className="empty">Aucun contenu pour le moment.</p>}
      {posts.slice(0,100).map(post => {
        const actions: { target: string; label: string }[] = [];
        if (post.status === 'idea' && canEdit) actions.push({ target: 'draft', label: 'Transformer en brouillon' });
        if (post.status === 'draft' && canEdit) actions.push({ target: 'review', label: 'Envoyer en validation' });
        if (post.status === 'review') { if (canApprove) actions.push({ target: 'approved', label: 'Valider' }); if (canEdit || canApprove) actions.push({ target: 'draft', label: 'Renvoyer en brouillon' }); }
        if (post.status === 'approved' && canEdit) actions.push({ target: 'draft', label: 'Rouvrir en brouillon' });
        const history = events.slice(0,500).filter(event => event.postId === post.id);
        return <article className="workflow-card" key={post.id}><span className="status">{labels[post.status] ?? post.status}</span><p className="draft-text">{post.text}</p>{post.plannedDate && <p className="hint">Date indicative : {post.plannedDate}{post.category ? ` · ${post.category}` : ''}</p>}
          {post.status === 'draft' && canEdit && <p><Link href="/drafts">Modifier dans Brouillons →</Link></p>}
          <div className="workflow-actions">{actions.map(action => <form action={changeEditorialStatus} key={action.target}><input type="hidden" name="id" value={post.id}/><input type="hidden" name="version" value={post.version}/><input type="hidden" name="target" value={action.target}/><button type="submit">{action.label}</button></form>)}</div>
          {history.length > 0 && <details className="workflow-history"><summary>Historique des validations</summary><ul>{history.map(event => <li key={event.id}>{labels[event.fromStatus]} → {labels[event.toStatus]} · {event.actorEmail} · {dateLabel(event.createdAt)} UTC</li>)}</ul></details>}
        </article>;
      })}
      {posts.length > 100 && <p className="hint">Les 100 contenus les plus récemment modifiés sont affichés.</p>}{events.length > 500 && <p className="hint">Seuls les 500 événements les plus récents sont affichés.</p>}
    </section>
  </Shell>;
}
