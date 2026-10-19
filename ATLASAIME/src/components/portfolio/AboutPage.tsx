import { useEffect } from 'react';
import { RESEARCH_TRACES, RESEARCH_THREADS } from '../../data/researchTimeline';
import './portfolio.css';

export function AboutPage() {
  useEffect(() => { document.title = 'Matt Mez — Fondateur d’AIME · À propos'; }, []);
  return <div className="folio folio-mosaic folio-biography" style={{ height: '100dvh', overflowY: 'auto' }}>
    <a href="#biographie" className="folio-skip">Aller à la biographie</a>
    <header className="folio-nav"><a href="/" className="folio-brand">MATT MEZ<span> / AIME</span></a><nav aria-label="Navigation publique"><a href="/">Projets</a><a href="/a-propos" aria-current="page">À propos</a></nav></header>
    <main id="biographie">
      <section className="bio-introduction"><p className="folio-eyebrow">Matthieu Lecointre · Matt Mez · Lille, Nord</p><h1>Fondateur d’AIME.<br /><em>Créateur de liens.</em></h1><p className="bio-signature">Musicien, designer, créateur de liens.</p><p className="bio-lead">Je m’appelle Matthieu Lecointre. Sur scène, je suis Matt Mez Sax. Mon parcours réunit la musique, le graphisme et la direction artistique. Avec AIME, j’explore aussi les interfaces et les expériences numériques.</p></section>
      <section className="bio-chapters" aria-label="Parcours et démarche">
        <article><span className="folio-eyebrow">01 · Le son</span><h2>Rencontrer par<br />la musique.</h2><p>Saxophoniste dans l’événementiel, j’accompagne des célébrations et des moments partagés. La scène, les mariages et les événements sont des espaces où le son rencontre les personnes. Cette pratique fait partie de mon parcours, au même titre que le travail visuel.</p></article>
        <article><span className="folio-eyebrow">02 · Le regard</span><h2>Donner forme<br />aux idées.</h2><p>Mon parcours passe aussi par le graphisme et la direction artistique. Composer une image, construire une identité, rendre une intention lisible : une autre manière de travailler le rythme, les contrastes et la relation entre les éléments.</p></article>
        <article><span className="folio-eyebrow">03 · AIME</span><h2>Faire dialoguer<br />les univers.</h2><p>Je suis le fondateur d’AIME. Cet univers de projets rapproche création, moments de vie et expériences numériques. Les projets explorent notamment le son, la mémoire, les relations documentées, les événements et la matière textile.</p><p>Ce portfolio en montre les directions, à travers des concepts, des prototypes et des expériences. Toutes les idées présentées ne sont pas des produits terminés.</p></article>
      </section>
      <section className="bio-vision"><p className="folio-eyebrow">Une démarche transversale</p><h2>De la musique à l’image,<br />de l’image aux interfaces.</h2><p>La composition est le fil qui relie ces pratiques : réunir des éléments singuliers sans leur faire perdre leur identité. Le son, les images et les outils numériques offrent des manières différentes de créer des liens.</p><p>Comment donner une place à la mémoire ? Comment rendre les relations plus lisibles ? Comment garder une dimension sensible dans le numérique ? Les projets réunis autour d’AIME proposent des pistes, sans prétendre apporter une réponse unique.</p></section>
      <section className="bio-research" aria-labelledby="recherches-title">
        <p className="folio-eyebrow">Mémoire de recherche</p><h2 id="recherches-title">Une démarche qui se construit.</h2>
        <p className="bio-research-intro">Une recherche menée sur environ trois ans, selon mon récit. Les documents retrouvés en éclairent certains fils ; les étapes anciennes restent à dater. Cette frise présente des traces d’écriture, pas les dates de naissance des idées.</p>
        <ol className="bio-timeline">{RESEARCH_TRACES.map(trace => <li key={trace.date}><time dateTime={trace.date}>{trace.label}</time><h3>{trace.title}</h3><p>{trace.body}</p><blockquote>« {trace.excerpt} »</blockquote><p className="bio-document">Document : {trace.document}</p></li>)}</ol>
        <h3 className="bio-threads-title">Des fils qui traversent les projets</h3><p className="bio-research-intro">Ces textes ne portent pas de date explicite dans les fichiers consultés. Ils sont présentés par thème, sans leur attribuer un ordre chronologique ni les confondre avec un récit autobiographique.</p>
        <div className="bio-threads">{RESEARCH_THREADS.map(thread => <article key={thread.title}><p className="folio-eyebrow">{thread.status}</p><h3>{thread.title}</h3><p>{thread.body}</p><blockquote>« {thread.excerpt} »</blockquote><p className="bio-document">Document : {thread.document}</p></article>)}</div>
        <a href="/" className="bio-return">Découvrir les projets dans la mosaïque ↗</a>
      </section>
    </main>
    <footer className="folio-footer"><span>Matthieu Lecointre / Matt Mez</span><a href="/">Retour aux projets ↗</a></footer>
  </div>;
}
