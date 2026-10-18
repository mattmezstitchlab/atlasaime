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

test('Home prioritizes the searchable project catalogue and hides advanced tools', async () => {
  const { StartScreen } = await server.ssrLoadModule('/src/components/start/StartScreen.tsx');
  const html = render(StartScreen, {
    github: { repos: [], status: 'snapshot', syncedAt: '2026-10-18', sync: noop }, recent: [],
    onOpen: noop, onCreate: noop, onDelete: noop, onDuplicate: noop,
    onOpenViewer: noop, onOpenSystems: noop, onOpenDesk: noop,
  });
  assert.match(html, /Catalogue des projets/);
  assert.match(html, /Rechercher un projet/);
  assert.match(html, /Créer une composition/);
  assert.match(html, /<details[^>]*><summary[^>]*>Outils avancés/);
  assert.doesNotMatch(html, /Méthode de composition|Estimation|Lecture du brief/);
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
  assert.match(html, /aria-label="Documents"/);
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

test('Navigation exposes exactly three named destinations', async () => {
  const { WorkspaceNav } = await server.ssrLoadModule('/src/components/ui/WorkspaceNav.tsx');
  const html = render(WorkspaceNav, { active: 'home', onNavigate: noop });
  assert.equal((html.match(/<button/g) ?? []).length, 3);
  for (const label of ['Projets','Documents','Mes compositions']) assert.ok(html.includes(`aria-label="${label}"`));
});

test('Composition view keeps all saved work and hides the project catalogue', async () => {
  const { StartScreen, SIMPLE_FORMATS } = await server.ssrLoadModule('/src/components/start/StartScreen.tsx');
  const { createProject } = await server.ssrLoadModule('/src/data/templates.ts');
  const recent = Array.from({ length: 30 }, (_, i) => createProject({ name: `Unique composition ${i}`, typeId: 'blank', fill: 'vide' }));
  const html = render(StartScreen, { initialTab: 'compositions', recent, github: { repos: [], status: 'snapshot', sync: noop }, onOpen: noop, onCreate: noop, onOpenViewer: noop, onOpenDesk: noop });
  assert.match(html, /Unique composition 29/);
  assert.doesNotMatch(html, /Catalogue des projets/);
  assert.deepEqual(SIMPLE_FORMATS.map(f => f.name), ['Page','Grille','Diaporama']);
});

test('Catalogue cards keep opening and selection actions with a project sheet', async () => {
  const { StartScreen } = await server.ssrLoadModule('/src/components/start/StartScreen.tsx');
  const html = render(StartScreen, { recent: [], github: { repos: [sampleRepo], status: 'snapshot', sync: noop }, onOpen: noop, onCreate: noop, onOpenViewer: noop, onOpenDesk: noop });
  assert.match(html, /MONDEMARIAGE/);
  assert.match(html, /type="checkbox"/);
  assert.match(html, /Ouvrir le code/);
  assert.match(html, /Fiche du projet/);
  assert.doesNotMatch(html, /> Étude</);
});

test('Editor starts in simple mode without agent, graph or animation controls', async () => {
  const { Editor } = await server.ssrLoadModule('/src/components/editor/Editor.tsx');
  const { createProject } = await server.ssrLoadModule('/src/data/templates.ts');
  const html = render(Editor, { initialProject: createProject({ name: 'Simple editor', typeId: 'archive', layoutId: 'editorial', fill: 'vide' }), github: { repos: [], status: 'snapshot' }, projectsCount: 1, onExit: noop, onSaved: noop, onDuplicate: noop });
  assert.match(html, /Mise en page/);
  assert.doesNotMatch(html, /Vue simple|Réglages avancés/);
  assert.match(html, /Outils de l’atelier/);
  assert.doesNotMatch(html, />Graphe<|> Graphe<|INSPECTEUR|Réactions locales/);
  assert.match(html, /Ajouter/);
});

test('Document sections expose synchronized selection and insertion positions', async () => {
  const { SectionCanvas } = await server.ssrLoadModule('/src/components/editor/SectionCanvas.tsx');
  const { createProject, makeTextFragment } = await server.ssrLoadModule('/src/data/templates.ts');
  const project = createProject({ name: 'Plan test', typeId: 'archive', layoutId: 'editorial', fill: 'vide' });
  project.cells = project.cells.slice(0,2);
  const f = makeTextFragment({ title: 'Introduction test', body: 'Corps test' });
  project.cells[0].fragmentId = f.id;
  const props = { project, fragments: new Map([[f.id,f]]), selectedId: project.cells[0].id, onSelect: noop, onInsert: noop, onMove: noop, onSettings: noop, preview: false };
  const html = render(SectionCanvas, props);
  assert.match(html, /Plan de la présentation/);
  assert.match(html, /aria-current="true"/);
  assert.match(html, /Introduction test/);
  for (const i of [1,2,3]) assert.ok(html.includes(`Ajouter une section à la position ${i}`));
  const preview = render(SectionCanvas, { ...props, preview: true });
  assert.doesNotMatch(preview, /Plan de la présentation|Ajouter ici|Modifier|Réglages de la sélection/);
  assert.match(preview, /Corps test/);
});

test('Section ordering preserves content and obeys position locks', async () => {
  const { moveSection } = await server.ssrLoadModule('/src/components/editor/SectionCanvas.tsx');
  const { createProject } = await server.ssrLoadModule('/src/data/templates.ts');
  const project = createProject({ name: 'Move', typeId: 'archive', fill: 'vide' });
  const first = project.cells[0];
  const moved = moveSection(project, first.id, 1);
  assert.equal(moved.cells[1].id, first.id);
  assert.equal(project.cells[0].id, first.id);
  assert.equal(moveSection(project, first.id, -1), project);
  project.cells[1].settings.locks.position = true;
  assert.equal(moveSection(project, first.id, 1), project);
});

test('Preview supports grid and sequential slides without losing section content', async () => {
  const { SectionCanvas } = await server.ssrLoadModule('/src/components/editor/SectionCanvas.tsx');
  const { createProject } = await server.ssrLoadModule('/src/data/templates.ts');
  const project = createProject({ name: 'Formats', typeId: 'archive', layoutId: 'slides', fill: 'vide' });
  const props = { project, fragments: new Map(), selectedId: null, onSelect: noop, onInsert: noop, onMove: noop, onSettings: noop, preview: true };
  assert.match(render(SectionCanvas, props), /Précédente/);
  assert.match(render(SectionCanvas, { ...props, project: { ...project, layoutId: 'bento' } }), /md:grid-cols-2/);
});

test('Insertion creates an empty selected destination between the original sections', async () => {
  const { insertDocumentSection } = await server.ssrLoadModule('/src/components/editor/SectionCanvas.tsx');
  const { createProject } = await server.ssrLoadModule('/src/data/templates.ts');
  const project = createProject({ name: 'Insert', typeId: 'archive', fill: 'vide' });
  const before = project.cells.map(c => c.id);
  const next = insertDocumentSection(project, 1, 'inserted-section');
  assert.deepEqual(next.cells.map(c => c.id), [before[0], 'inserted-section', ...before.slice(1)]);
  assert.equal(next.cells[1].fragmentId, null);
  assert.equal(project.cells.length + 1, next.cells.length);
  assert.deepEqual(project.cells.map(c => c.id), before);
});


test('Unified panel switches between plan and the existing library without a second editor', async () => {
  const { SectionCanvas } = await server.ssrLoadModule('/src/components/editor/SectionCanvas.tsx');
  const { createProject } = await server.ssrLoadModule('/src/data/templates.ts');
  const props = { project: createProject({ name: 'Unified', typeId: 'archive', fill: 'vide' }), fragments: new Map(), selectedId: null, onSelect: noop, onInsert: noop, onMove: noop, onSettings: noop, preview: false, library: createElement('div', {}, 'LIBRARY_CONTENT'), onLibraryChange: noop };
  const plan = render(SectionCanvas, props);
  assert.match(plan, /Panneau de l’atelier/);
  assert.match(plan, /Plan de la présentation/);
  assert.doesNotMatch(plan, /LIBRARY_CONTENT/);
  const library = render(SectionCanvas, { ...props, libraryOpen: true });
  assert.match(library, /LIBRARY_CONTENT/);
  assert.doesNotMatch(library, /Plan de la présentation/);
});
