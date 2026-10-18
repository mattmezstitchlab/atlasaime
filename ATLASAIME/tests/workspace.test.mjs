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

const sampleRepo = { name: 'MONDEMARIAGE', description: '', siteTitle: '', siteDescription: '', ogImage: '', homepage: null, embed: 'none', language: 'HTML', size: 200, stars: 0, createdAt: '2026-10-01', pushedAt: '2026-10-01' };

test('Undeployed projects have a self-contained labelled mock, not a fake screenshot', async () => {
  const { mockRepoPreview, repoPreview } = await server.ssrLoadModule('/src/data/repoPreview.ts');
  const preview = repoPreview(sampleRepo);
  assert.equal(preview.label, 'Maquette — non fonctionnelle');
  assert.match(preview.url, /^data:image\/svg\+xml/);
  const svg = decodeURIComponent(preview.url.split(',')[1]);
  assert.match(svg, /MONDEMARIAGE/);
  assert.match(svg, /Maquette — non fonctionnelle/);
  assert.match(svg, /MARIAGE/);
  const escaped = decodeURIComponent(mockRepoPreview({ ...sampleRepo, name: '<script>&"' }).url.split(',')[1]);
  assert.doesNotMatch(escaped, /<script>/);
  assert.match(escaped, /&lt;script&gt;&amp;&quot;/);
});

test('Offline status avoids screenshot service; existing visual is not labelled as capture', async () => {
  const { repoPreview } = await server.ssrLoadModule('/src/data/repoPreview.ts');
  assert.match(repoPreview({ ...sampleRepo, homepage: 'https://example.org', embed: 'offline' }).url, /^data:/);
  const visual = repoPreview({ ...sampleRepo, ogImage: 'https://example.org/preview.png' });
  assert.equal(visual.label, 'Visuel du projet');
  assert.equal(visual.url, 'https://example.org/preview.png');
  const live = repoPreview({ ...sampleRepo, homepage: 'https://example.org', embed: 'live' });
  assert.match(live.url, /mshots/);
  assert.match(live.label, /service externe/);
});

test('Mock posters reach editor fragments and rendered cards without external requests', async () => {
  const { repoToFragment } = await server.ssrLoadModule('/src/data/repos.ts');
  const { RepoPreview } = await server.ssrLoadModule('/src/components/ui/RepoPreview.tsx');
  const fragment = repoToFragment(sampleRepo);
  assert.match(fragment.poster, /^data:/);
  assert.match(fragment.fallbackPoster, /^data:/);
  const html = render(RepoPreview, { repo: sampleRepo });
  assert.match(html, /Maquette — non fonctionnelle/);
  assert.match(html, /pas sur le rendu du code/);
});

test('Failed remote images fall back to a mock and a changed source is retried', async () => {
  const { repoPreview, resolveRepoPreview } = await server.ssrLoadModule('/src/data/repoPreview.ts');
  const repo = { ...sampleRepo, homepage: 'https://example.org', embed: 'live' };
  const initial = repoPreview(repo);
  assert.equal(resolveRepoPreview(repo, initial.url).label, 'Maquette — non fonctionnelle');
  assert.match(resolveRepoPreview({ ...repo, homepage: 'https://example.org/new' }, initial.url).label, /Capture/);
  const { buildCatalog } = await server.ssrLoadModule('/src/data/catalog.ts');
  const item = buildCatalog([sampleRepo], [], [], []).find((item) => item.repo === sampleRepo.name);
  assert.equal(item.previewLabel, 'Maquette — non fonctionnelle');
});
