import { useEffect, useState } from 'react';
import { PORTFOLIO_PROJECTS } from '../../data/portfolio';
import { COLLECTIONS, githubRepoUrl, SNAPSHOT_DATE } from '../../data/repos';
import { RepoPreview } from '../ui/RepoPreview';
import './portfolio.css';

export function PublicPortfolio() {
  const [domain, setDomain] = useState('');
  const [query, setQuery] = useState('');
  const projects = PORTFOLIO_PROJECTS.filter(p => (!domain || p.domain === domain) && `${p.repo.name} ${p.concept}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')));
  useEffect(() => { document.title = 'MATT MEZ · Projets & explorations — AIME'; }, []);
  return <div className="folio">
    <a href="#folio-projects" className="folio-skip">Aller aux projets</a>
    <header className="folio-nav"><a href="/portfolio" className="folio-brand">MATT MEZ<span> / AIME</span></a><nav aria-label="Navigation du portfolio"><a href="#folio-projects">Projets</a><a href="#folio-about">À propos</a><a href="/">Atelier ↗</a></nav></header>
    <main>
      <section className="folio-hero"><p className="folio-eyebrow">Création · interfaces · expériences</p><h1>Des idées.<br /><span>Des liens.</span><br />Des possibles.</h1><div className="folio-intro"><p>Un ensemble de projets pour explorer les relations entre le numérique, les moments de vie, le son et la matière.</p><a href="#folio-projects">Explorer les projets <span aria-hidden="true">↓</span></a></div><span className="folio-orbit" aria-hidden="true">aime*</span></section>
      <section id="folio-projects" className="folio-projects" aria-label="Projets publics"><div className="folio-section-heading"><h2>Projets & explorations</h2><span>{projects.length} projets</span></div>
        <div className="folio-filters"><label><span className="sr-only">Rechercher un projet</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un projet…" /></label><select aria-label="Filtrer par univers" value={domain} onChange={e => setDomain(e.target.value)}><option value="">Tous les univers</option>{COLLECTIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
        <div className="folio-grid">{projects.map((p,i) => <article id={`projet-${p.repo.name}`} key={p.repo.name} className={`folio-card ${i % 5 === 0 ? 'folio-card-wide' : ''}`}>
          <a className="folio-visual" href={`#concept-${p.repo.name}`} aria-label={`Découvrir le concept de ${p.repo.name}`}><RepoPreview repo={p.repo} /></a>
          <div className="folio-card-heading"><h3>{p.repo.name}</h3><span>{COLLECTIONS.find(c => c.id === p.domain)?.label}</span></div>
          <p id={`concept-${p.repo.name}`} className="folio-concept">{p.concept}</p>
          <div className="folio-links">{p.repo.homepage && p.repo.embed !== 'offline' && <a href={p.repo.homepage} target="_blank" rel="noreferrer">Découvrir le projet ↗</a>}<a href={githubRepoUrl(p.repo.name)} target="_blank" rel="noreferrer">Sources ↗</a></div>
        </article>)}</div>
        {!projects.length && <p>Aucun projet pour ces critères.</p>}
      </section>
      <section id="folio-about" className="folio-about"><p className="folio-eyebrow">Le fil conducteur</p><h2>Tout ne doit pas<br />faire un.<br /><em>Tout peut se relier.</em></h2><p>Ce portfolio rassemble des concepts, des prototypes et des expériences. Chaque projet garde sa singularité et ses sources. Une image peut être une capture ou une maquette indicative : sa provenance est signalée, sans prétendre qu’un prototype est un service terminé.</p><a href="https://github.com/mattmezstitchlab" target="_blank" rel="noreferrer">Explorer les sources sur GitHub ↗</a></section>
    </main>
    <footer className="folio-footer"><span>MATT MEZ / AIME</span><p>Sélection publique · sources relevées le {new Date(SNAPSHOT_DATE).toLocaleDateString('fr-FR')}. Disponibilité actuelle des sites non vérifiée.</p><a href="#top" onClick={e => { e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'}); }}>Retour en haut ↑</a></footer>
  </div>;
}
