import Link from 'next/link';
import { login } from '../actions';
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const error = (await searchParams).error;
  return <main className="auth-shell"><section className="auth-card"><div className="brand"><span className="brand-mark">M</span> Marketing OS</div><div className="eyebrow">VOTRE ESPACE MARKETING</div><h1>Bon retour.</h1><p className="muted">Connectez-vous à votre espace de travail.</p>{error && <p className="alert" role="alert">Connexion impossible. Vérifiez vos informations ou réessayez plus tard.</p>}<form action={login} className="form"><label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label><label>Mot de passe<input name="password" type="password" autoComplete="current-password" required minLength={12} maxLength={128}/></label><button type="submit">Se connecter <span aria-hidden="true">→</span></button></form><p className="switch">Nouveau ici ? <Link href="/register">Créer un compte</Link></p></section></main>;
}
