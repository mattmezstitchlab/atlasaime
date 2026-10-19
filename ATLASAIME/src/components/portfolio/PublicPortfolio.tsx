import { useEffect, useRef, useState } from 'react';
import { PORTFOLIO_PROJECTS } from '../../data/portfolio';
import { COLLECTIONS, SNAPSHOT_DATE } from '../../data/repos';
import { RepoPreview } from '../ui/RepoPreview';
import './portfolio.css';

export function PublicPortfolio() {
  const scroll = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<(typeof PORTFOLIO_PROJECTS)[number] | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [light, setLight] = useState(false);
  useEffect(() => { if (selected) dialog.current?.showModal(); }, [selected]);
  const [domain, setDomain] = useState('');
  const [query, setQuery] = useState('');
  const projects = PORTFOLIO_PROJECTS.filter(p => (!domain || p.domain === domain) && `${p.repo.name} ${p.concept}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')));
  useEffect(() => { document.title = 'MATT MEZ · Projets & explorations — AIME'; }, []);
  return <div ref={scroll} className={`folio folio-mosaic ${light ? 'folio-light' : ''}`} style={{ height: '100dvh', overflowY: 'auto' }}>
    <a href="#folio-projects" className="folio-skip">Aller aux projets</a>
    <header className="folio-nav"><a href="/portfolio" className="folio-brand">MATT MEZ<span> / AIME</span></a><nav aria-label="Navigation du portfolio"><a href="#folio-projects">Projets</a><a href="/a-propos">À propos</a></nav></header>
    <main>
      <section className="folio-hero folio-hero-compact"><p className="folio-eyebrow">Création · interfaces · expériences</p><h1>Projets<span> & explorations.</span></h1><div className="folio-intro"><p>Un ensemble de projets pour explorer les relations entre le numérique, les moments de vie, le son et la matière.</p><a href="#folio-projects">Explorer les projets <span aria-hidden="true">↓</span></a></div><span className="folio-orbit" aria-hidden="true">aime*</span></section>
      <section id="folio-projects" className="folio-projects" aria-label="Projets publics"><div className="folio-section-heading"><h2>Projets & explorations</h2><span>{projects.length} projets</span></div>
        <div className="folio-filters"><div className="folio-view-controls" role="group" aria-label="Affichage des projets"><button type="button" aria-pressed={view === 'grid'} onClick={() => setView('grid')}>Mosaïque</button><button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>Liste</button><button type="button" onClick={() => setLight(v => !v)}>{light ? 'Sombre' : 'Clair'}</button></div><label><span className="sr-only">Rechercher un projet</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un projet…" /></label><select aria-label="Filtrer par univers" value={domain} onChange={e => setDomain(e.target.value)}><option value="">Tous les univers</option>{COLLECTIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
        <div className={`folio-grid ${view === 'list' ? 'folio-list' : ''}`}>{projects.map((p) => <article id={`projet-${p.repo.name}`} key={p.repo.name} className="folio-card">
          <div className="folio-card-heading"><h3><button type="button" onClick={() => setSelected(p)}>{p.repo.name}</button></h3><span>▪ {COLLECTIONS.find(c => c.id === p.domain)?.label}</span></div>
          <button type="button" className="folio-visual" onClick={() => setSelected(p)} aria-label={`Découvrir le concept de ${p.repo.name}`}><RepoPreview repo={p.repo} /></button>
          {view === 'list' && <p className="folio-concept">{p.concept}</p>}

        </article>)}</div>
        {!projects.length && <p>Aucun projet pour ces critères.</p>}
      </section>
      <dialog ref={dialog} className="folio-dialog" onClose={() => setSelected(null)} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }} aria-label={selected ? `Concept de ${selected.repo.name}` : 'Concept du projet'}>
        {selected && <><div className="folio-dialog-actions"><button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="Fermer le projet">✕ Fermer</button></div><h2>{selected.repo.name}</h2><p className="folio-dialog-category">{COLLECTIONS.find(c => c.id === selected.domain)?.label}</p><div className="folio-visual"><RepoPreview repo={selected.repo} /></div><p className="folio-concept">{selected.concept}</p>{selected.repo.homepage && !/^https?:\/\/(?:www\.)?github\.com(?:[/:]|$)/i.test(selected.repo.homepage) && selected.repo.embed !== 'offline' && <a href={selected.repo.homepage} target="_blank" rel="noreferrer">Découvrir le projet ↗</a>}</>}
      </dialog>
      <section id="folio-about" className="folio-about"><p className="folio-eyebrow">Le fil conducteur</p><h2>Tout ne doit pas<br />faire un.<br /><em>Tout peut se relier.</em></h2><p>Ce portfolio rassemble des concepts, des prototypes et des expériences. Chaque projet garde sa singularité et ses sources. Une image peut être une capture ou une maquette indicative : sa provenance est signalée, sans prétendre qu’un prototype est un service terminé.</p><a href="/a-propos">Découvrir Matt Mez, fondateur d’AIME ↗</a></section>
    </main>
    <footer className="folio-footer"><span>MATT MEZ / AIME</span><p>Sélection publique · sources relevées le {new Date(SNAPSHOT_DATE).toLocaleDateString('fr-FR')}. Disponibilité actuelle des sites non vérifiée.</p><a href="#top" onClick={e => { e.preventDefault(); scroll.current?.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); }}>Retour en haut ↑</a></footer>
  </div>;
}
