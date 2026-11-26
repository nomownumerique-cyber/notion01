import Link from 'next/link';

export default function Home() {
  return <div className="landing">
    <header className="landing-header"><div className="landing-container landing-header-inner">
      <Link href="/" className="landing-brand"><span className="landing-mark" aria-hidden="true">M</span>Marketing OS<span className="landing-brand-dot" aria-hidden="true">.</span></Link>
      <nav className="landing-nav" aria-label="Navigation de la page d’accueil"><a href="#fonctionnalites">Découvrir</a><Link href="/login">Se connecter</Link><Link className="landing-nav-cta" href="/register">Créer un compte <span aria-hidden="true">↗</span></Link></nav>
    </div></header>
    <main>
      <section className="landing-container landing-hero">
        <div className="landing-copy"><div className="landing-kicker"><span aria-hidden="true"></span> PENSÉ POUR LES COMMERÇANTS</div>
          <h1>Vos idées méritent<br/><em>de grandir.</em></h1>
          <p className="landing-lead">Préparez vos contenus, organisez votre calendrier et gardez un œil sur votre marché — dans un seul espace.</p>
          <div className="landing-actions"><Link href="/register" className="landing-button">Créer mon espace <span aria-hidden="true">↗</span></Link><a href="#fonctionnalites" className="landing-text-link">Découvrir les outils <span aria-hidden="true">↓</span></a></div>
          <p className="landing-hero-note">Une plateforme en développement, à votre rythme.</p>
        </div>
        <div className="landing-photo-wrap"><img className="landing-photo" src="/landing-visual" alt="" /><div className="landing-photo-caption"><span className="landing-caption-icon" aria-hidden="true">+</span><span>Pour les idées<br/><strong>qui prennent vie.</strong></span></div><span className="landing-photo-index" aria-hidden="true">01 / À VOTRE RYTHME</span></div>
      </section>
      <section id="fonctionnalites" className="landing-features"><div className="landing-container">
        <div className="landing-section-head"><div><div className="landing-kicker"><span aria-hidden="true"></span> VOTRE ESPACE DE TRAVAIL</div><h2>Moins de dispersion.<br/><em>Plus de clarté.</em></h2></div><p>Des outils concrets pour passer de l’idée à un contenu prêt à être publié.</p></div>
        <div className="landing-feature-grid">
          <article><span className="landing-number">01</span><h3>Préparer</h3><p>Rédigez vos brouillons et faites évoluer vos idées jusqu’à leur validation.</p><Link href="/register">Commencer <span aria-hidden="true">↗</span></Link></article>
          <article><span className="landing-number">02</span><h3>Organiser</h3><p>Classez vos contenus par date et catégorie, puis retrouvez-les dans le calendrier.</p><Link href="/register">Commencer <span aria-hidden="true">↗</span></Link></article>
          <article><span className="landing-number">03</span><h3>Observer</h3><p>Consignez les informations publiques de vos concurrents et gardez leurs sources.</p><Link href="/register">Commencer <span aria-hidden="true">↗</span></Link></article>
        </div>
      </div></section>
      <section className="landing-container landing-next"><div><div className="landing-kicker"><span aria-hidden="true"></span> EN TOUTE TRANSPARENCE</div><h2>Une étape à la fois.</h2><p>La publication automatique, les connexions aux réseaux sociaux et les statistiques publicitaires ne sont pas encore disponibles. Les dates du calendrier sont indicatives.</p></div><div className="landing-next-action"><span>Prêt à organiser vos idées ?</span><Link href="/register" className="landing-button landing-button-light">Créer mon espace <span aria-hidden="true">↗</span></Link></div></section>
    </main>
    <footer className="landing-container landing-footer"><Link href="/" className="landing-brand"><span className="landing-mark" aria-hidden="true">M</span>Marketing OS<span className="landing-brand-dot" aria-hidden="true">.</span></Link><p>Un espace pour vos idées et votre commerce.</p><Link href="/login">Se connecter ↗</Link></footer>
  </div>;
}
