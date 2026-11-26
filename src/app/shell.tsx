import Link from 'next/link';
import { logout } from './actions';
export function Shell({ workspace, children }: { workspace: string; children: React.ReactNode }) {
  return <div className="app-shell"><header className="topbar"><Link className="brand" href="/dashboard"><span className="brand-mark">M</span> Marketing OS</Link><span className="workspace">{workspace}</span><form action={logout}><button className="text-button" type="submit">Déconnexion</button></form></header><div className="app-body"><nav aria-label="Navigation principale"><Link href="/dashboard">Vue d’ensemble</Link><Link href="/drafts">Brouillons</Link><Link href="/planner">Calendrier</Link><Link href="/workflow">Validation</Link><Link href="/competitors">Concurrents</Link><Link href="/reports">Rapports</Link></nav><main className="content">{children}</main></div></div>;
}
