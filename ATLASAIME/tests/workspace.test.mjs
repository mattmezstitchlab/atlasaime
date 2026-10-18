import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

// Use Vite's own TSX transform; no extra test runtime or browser dependency.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
after(() => server.close());
const { createElement } = await import('react');
const { renderToStaticMarkup } = await import('react-dom/server');
const render = (Component, props = {}) => renderToStaticMarkup(createElement(Component, props));
const noop = () => {};

test('Accueil centers exploration and keeps estimates secondary', async () => {
  const { StartScreen } = await server.ssrLoadModule('/src/components/start/StartScreen.tsx');
  const html = render(StartScreen, {
    github: { repos: [], status: 'snapshot', syncedAt: '2026-10-18', sync: noop }, recent: [],
    onOpen: noop, onCreate: noop, onDelete: noop, onDuplicate: noop,
    onOpenViewer: noop, onOpenSystems: noop, onOpenDesk: noop,
  });
  assert.match(html, /Explorer et comparer/);
  assert.match(html, /Lire les documents/);
  assert.match(html, /Méthode de composition/);
  assert.match(html, /<details[^>]*><summary[^>]*>Suivi documentaire/);
  assert.doesNotMatch(html, /Nom du projet/); // manual controls are not invisibly focusable
  assert.doesNotMatch(html, /Générer les pages du site/);
});

test('Brief composer clearly states local behavior without staged agent reactions', async () => {
  const { AimeHero } = await server.ssrLoadModule('/src/components/start/AimeHero.tsx');
  const html = render(AimeHero, { repos: [], onCreate: noop, onExplore: noop });
  assert.match(html, /Aucun modèle IA ni service externe/);
  assert.match(html, /Trouver des sources/);
  assert.doesNotMatch(html, /Réactions locales|Étapes de préparation/);
});

test('Domain composition describes README extraction instead of scraping components', async () => {
  const { DomainStitch } = await server.ssrLoadModule('/src/components/start/DomainStitch.tsx');
  const html = render(DomainStitch, { repos: [], onCreate: noop });
  assert.match(html, /Extraits de README/);
  assert.match(html, /Texte de liaison · modèles locaux/);
  assert.doesNotMatch(html, /Mémoire générative|scrape sous-sections/);
});

test('Primary navigation prioritizes projects and documents over visual tools', async () => {
  const { WorkspaceNav } = await server.ssrLoadModule('/src/components/ui/WorkspaceNav.tsx');
  const html = render(WorkspaceNav, { active: 'home', onNavigate: noop });
  assert.match(html, /aria-label="Projets"/);
  assert.match(html, /aria-label="Bureau"/);
  assert.doesNotMatch(html, /aria-label="Design"/);
});
