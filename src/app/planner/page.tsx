import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '../../db/client';
import { createStore } from '../../db/store';
import { calendarRange, isoDate, parseDate, shiftAnchor } from '../../domain/calendar';
import { Shell } from '../shell';
export const dynamic = 'force-dynamic';
const statusLabels: Record<string, string> = { idea: 'Idée', draft: 'Brouillon', review: 'En validation', approved: 'Validé' };
const displayDay = (value: string) => new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
const periodName = (date: Date) => new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
export default async function Planner({ searchParams }: { searchParams: Promise<{ date?: string; view?: string }> }) {
  const store = createStore(db), token = (await cookies()).get('marketing_os_session')?.value;
  const actor = await store.current(token); if (!actor) redirect('/login');
  const params = await searchParams, mode = params.view === 'week' ? 'week' : 'month';
  const candidate = typeof params.date === 'string' ? parseDate(params.date) : null;
  const anchor = candidate && candidate.getUTCFullYear() >= 1901 && candidate.getUTCFullYear() <= 2098 ? candidate : parseDate(new Date().toISOString().slice(0, 10))!;
  const range = calendarRange(anchor, mode), entries = await store.listPlannedDrafts(token, range.start, range.end), visible = entries.slice(0, 500);
  const previous = shiftAnchor(anchor, mode, -1), next = shiftAnchor(anchor, mode, 1);
  const url = (view: string, date: Date) => `/planner?view=${view}&date=${isoDate(date)}`;
  return <Shell workspace={actor.tenantName}>
    <div className="eyebrow">PLANIFICATION ÉDITORIALE</div><h1>Calendrier</h1>
    <p className="muted">Organisez vos contenus par date. Ces dates sont indicatives : aucune publication automatique n’est active.</p>
    <div className="calendar-toolbar"><div className="calendar-period"><h2>{mode === 'month' ? periodName(anchor) : `${displayDay(range.start)} – ${displayDay(range.end)} ${anchor.getUTCFullYear()}`}</h2><div className="calendar-navigation">{previous.getUTCFullYear() >= 1901 && <Link href={url(mode, previous)} aria-label="Période précédente">← Précédent</Link>}{next.getUTCFullYear() <= 2098 && <Link href={url(mode, next)} aria-label="Période suivante">Suivant →</Link>}</div></div><div className="view-switch" aria-label="Vues du calendrier"><Link href={url('month', anchor)} aria-current={mode === 'month' ? 'page' : undefined}>Mois</Link><Link href={url('week', anchor)} aria-current={mode === 'week' ? 'page' : undefined}>Semaine</Link></div></div>
    <p className="hint">Dates civiles, sans heure ni fuseau. Pour ajouter ou modifier une date, ouvrez <Link href="/drafts">Brouillons</Link>.</p>
    {entries.length > 500 && <p className="alert" role="status">Seuls les 500 premiers brouillons de cette période sont affichés.</p>}
    <div className="calendar-grid" aria-label="Calendrier éditorial">{range.dates.map(day => <section className={`calendar-day${day.slice(0, 7) !== isoDate(anchor).slice(0, 7) && mode === 'month' ? ' outside' : ''}`} key={day} aria-label={displayDay(day)}><h3>{displayDay(day)}</h3>{visible.filter(item => item.plannedDate === day).map(item => <article className="calendar-entry" key={item.id}><span className="entry-status">{statusLabels[item.status] ?? item.status}</span><p>{item.text}</p>{item.category && <span className="entry-category">{item.category}</span>}</article>)}</section>)}</div>
  </Shell>;
}
