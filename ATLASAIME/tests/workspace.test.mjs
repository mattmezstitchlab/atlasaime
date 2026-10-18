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

test('Storage keeps 30 compositions, preserves media on quota failure and retries without false success', async () => {
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const h = await server.ssrLoadModule('/src/hooks/useAtlas.ts');
  const { createProject } = await server.ssrLoadModule('/src/data/templates.ts');
  const base = createProject({ name: 'Test', typeId: 'blank', fill: 'vide' });
  for (let i = 0; i < 30; i++) h.saveProject({ ...base, id: `test-${i}`, updatedAt: i });
  assert.equal(h.loadProjects().length, 30);
  const persisted = store.get('atlas:projects:v2');
  globalThis.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  const media = { ...base, id: 'media', customFragments: [{ id: 'upload', kind: 'image', name: 'image', subtitle: '', source: 'upload', url: 'data:image/png;base64,dGVzdA==' }] };
  h.saveProject(media);
  assert.match(h.getStorageError(), /impossible/);
  assert.equal(store.get('atlas:projects:v2'), persisted);
  assert.equal(h.loadProjects().find(p => p.id === 'media').customFragments[0].url, media.customFragments[0].url);
  globalThis.localStorage.setItem = (k, v) => store.set(k, v);
  h.saveProject(media);
  assert.equal(h.getStorageError(), '');
  assert.equal(JSON.parse(store.get('atlas:projects:v2')).length, 31);
  for (const p of h.loadProjects()) h.removeProject(p.id);
  assert.equal(h.loadProjects().length, 0); // no unexpected demo resurrection
});

test('Full backup restores media on empty storage and never replaces existing IDs', async () => {
  const { createProject } = await server.ssrLoadModule('/src/data/templates.ts');
  const h = await server.ssrLoadModule('/src/hooks/useAtlas.ts');
  const backup = await server.ssrLoadModule('/src/data/projectBackup.ts');
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const p = createProject({ name: 'Portable', typeId: 'blank', fill: 'vide' });
  p.customFragments = [{ id: 'pdf', kind: 'pdf', name: 'PDF', subtitle: '', source: 'upload', url: 'data:application/pdf;base64,dGVzdA==' }];
  const parsed = backup.parseBackup(backup.exportBackup([p]));
  assert.deepEqual(parsed, JSON.parse(JSON.stringify([p])));
  h.saveProject(p);
  const restored = h.restoreProjects(parsed);
  assert.equal(restored.length, 2);
  assert.notEqual(restored[0].id, p.id);
  assert.equal(restored[0].customFragments[0].url, p.customFragments[0].url);
  assert.equal(restored[1].id, p.id);
  assert.throws(() => backup.parseBackup(JSON.stringify({ format: 'atlas.backup', version: 1, projects: [{ ...p, layoutId: 'invalid' }] })));
  assert.throws(() => backup.parseBackup(JSON.stringify({ format: 'atlas.backup', version: 1, projects: [p,p] })));
  assert.throws(() => backup.exportBackup([{ ...p, customFragments: [{ ...p.customFragments[0], url: 'blob:expired' }] }]));
  assert.equal(h.decodeProject(btoa(JSON.stringify({ cells: [], layoutId: 'invalid' }))), null);
  const malicious = { ...p, customFragments: [{ ...p.customFragments[0], url: 'javascript:alert(1)' }] };
  assert.equal(h.decodeProject(btoa(JSON.stringify(malicious))), null);
});

test('Assembly snapshots preserve domain, URLs, README text and all link bands', async () => {
  const s = await server.ssrLoadModule('/src/data/stitch.ts');
  const picks = [
    { fragment: { id: 'url:external', kind: 'site', name: 'Site', subtitle: '', source: 'url', url: 'https://example.org' }, domain: 'autres', role: 'hero', source: 'external', weight: 1 },
    { fragment: { id: 'sub:test:texte', kind: 'text', name: 'Texte', subtitle: '', source: 'text', text: { title: 'Titre', body: 'Extrait conservé' } }, domain: 'autres', role: 'features', source: 'test', weight: 1 },
  ];
  const links = s.composeLinks(picks, 'Autres');
  const code = s.encodeAssemblage('mariage', picks.map(p => p.fragment.id), picks, links);
  const decoded = s.decodeAssemblage(code);
  assert.equal(decoded.domain, 'mariage');
  assert.deepEqual(decoded.picks, picks);
  assert.deepEqual(decoded.links, links);
  const project = s.buildStitchProject('Shared', decoded.picks, [], decoded.links);
  const fragments = project.cells.map(c => project.customFragments.find(f => f.id === c.fragmentId));
  assert.equal(fragments[0].text.title, links[0].text.title);
  assert.equal(fragments[1].url, 'https://example.org');
  assert.equal(fragments.at(-1).text.title, links.at(-1).text.title);
  assert.equal(project.cells.length, picks.length + links.length);
  const old = s.decodeAssemblage(s.encodeAssemblage('mariage', ['gh:MONMARIAGE']));
  assert.deepEqual(old.ids, ['gh:MONMARIAGE']);
  assert.equal(s.decodeAssemblage('invalid'), null);
  assert.throws(() => s.encodeAssemblage('mariage', [], [{ ...picks[1], fragment: { ...picks[1].fragment, text: { title: 'a'.repeat(200001) } } }]));
});

test('Brief support answer changes the generated support', async () => {
  const { analyzeBrief } = await server.ssrLoadModule('/src/data/agents.ts');
  const { generateSiteFromBrief } = await server.ssrLoadModule('/src/data/siteGenerator.ts');
  const brief = analyzeBrief('Un outil pour mes clients', []);
  assert.equal(generateSiteFromBrief(brief, { support: 'mobile' }, []).project.supportId, 'mobile');
});

test('Shared GitHub snapshot remains editable even without a current GitHub listing', async () => {
  const s = await server.ssrLoadModule('/src/data/stitch.ts');
  const picks = [{ fragment: { id: 'gh:gone', kind: 'repo', name: 'Snapshot', subtitle: '', source: 'github', repo: 'gone' }, domain: 'autres', role: 'code', source: 'gone', weight: 1 }];
  const project = s.buildStitchProject('Snapshot', picks, []);
  assert.equal(project.cells.length, 1);
  assert.equal(project.cells[0].fragmentId, 'gh:gone');
  assert.equal(project.customFragments[0].name, 'Snapshot');
});

test('Backup embeds used library URLs rather than depending on another browser library', async () => {
  const { createProject } = await server.ssrLoadModule('/src/data/templates.ts');
  const { exportBackup, parseBackup } = await server.ssrLoadModule('/src/data/projectBackup.ts');
  const { saveExtra } = await server.ssrLoadModule('/src/data/catalog.ts');
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  saveExtra({ id: 'url:library', kind: 'site', source: 'url', subtitle: '', name: 'Library', url: 'https://example.org/library' });
  const p = createProject({ name: 'Library', typeId: 'blank', fill: 'vide' });
  p.cells[0].fragmentId = 'url:library';
  const json = exportBackup([p]);
  store.clear();
  const restored = parseBackup(json)[0];
  assert.equal(restored.customFragments.find(f => f.id === 'url:library').url, 'https://example.org/library');
});

test('Malformed settings and unreadable existing storage are not silently overwritten', async () => {
  const { createProject } = await server.ssrLoadModule('/src/data/templates.ts');
  const { isProject } = await server.ssrLoadModule('/src/data/projectBackup.ts');
  const h = await server.ssrLoadModule('/src/hooks/useAtlas.ts');
  const p = createProject({ name: 'Validation', typeId: 'blank', fill: 'vide' });
  assert.equal(isProject({ ...p, cells: [{ ...p.cells[0], settings: {} }] }), false);
  const corrupt = '{not valid JSON';
  let value = corrupt;
  globalThis.localStorage = { getItem: () => value, setItem: (_, next) => { value = next; } };
  h.loadProjects();
  h.saveProject(p);
  assert.equal(value, corrupt);
  assert.match(h.getStorageError(), /impossible/);
});
