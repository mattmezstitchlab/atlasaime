import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Check, Copy, ExternalLink, RefreshCw, Search, Trash2, BookOpen, ShieldAlert, WifiOff, Code2 } from 'lucide-react';
import type { LayoutId, Project, ProjectTypeId, SupportId, CollectionId } from '../../types';
import { LAYOUTS, LAYOUT_MAP, SUPPORTS, SUPPORT_MAP } from '../../data/layouts';
import { MEDIA_MAP } from '../../data/media';
import { PROJECT_TYPES, PROJECT_TYPE_MAP, PRESETS, createFromPreset, createProject } from '../../data/templates';
import type { RepoSnapshot } from '../../data/repos';
import { COLLECTIONS, GITHUB_USER, collectionOf, formatDate, formatSize, githubRepoUrl, LANG_SHORT, repoStats, screenshotUrl, splitTitle, timeAgo, githubOgUrl } from '../../data/repos';
import type { GithubState } from '../../hooks/useAtlas';
import { LayoutThumb } from '../ui/LayoutThumb';
import { AtlasLogo, GithubMark, Reveal, Segmented } from '../ui/controls';
import { cn } from '../../utils/cn';
import { AimeHero } from './AimeHero';
import { ProjectTimeline } from './ProjectTimeline';
import { FusionSection } from './FusionSection';
import { DomainStitch } from './DomainStitch';
import { WorkspaceNav } from '../ui/WorkspaceNav';

export interface StartScreenProps {
  github: GithubState;
  recent: Project[];
  onOpen: (p: Project) => void;
  onCreate: (p: Project) => void;
  onDelete: (id: string) => void;
  onDuplicate: (p: Project) => void;
  onOpenViewer: () => void;
  onOpenSystems: () => void;
  onOpenDesk: () => void;
}

type ContentMode = 'github' | 'selection' | 'vide';

function posterFor(id: string | null, project: Project | null, repoMap: Map<string, RepoSnapshot>): string | undefined {
  if (!id) return undefined;
  if (id.startsWith('gh:')) {
    const r = repoMap.get(id.slice(3));
    if (!r) return undefined;
    return r.homepage && (r.embed === 'live' || r.embed === 'blocked') ? screenshotUrl(r.homepage) : githubOgUrl(r.name);
  }
  const m = MEDIA_MAP.get(id);
  if (m) return m.kind === 'image' ? m.url : m.poster;
  const c = project?.customFragments.find((f) => f.id === id);
  return c?.kind === 'image' ? c.url : c?.poster;
}

const SectionHead = ({ eyebrow, title, children, id }: { eyebrow: string; title: ReactNode; children?: ReactNode; id: string }) => (
  <Reveal className="mb-8 flex flex-col gap-4 sm:mb-10 lg:flex-row lg:items-end lg:justify-between">
    <div id={id} className="scroll-mt-24">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-400">{eyebrow}</div>
      <h2 className="font-display text-4xl leading-[0.95] tracking-tight text-gray-950 sm:text-5xl">{title}</h2>
    </div>
    {children}
  </Reveal>
);

const StepTitle = ({ n, title, hint, id }: { n: string; title: string; hint: string; id?: string }) => (
  <Reveal className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between" style={{}}>
    <div id={id} className="flex items-baseline gap-3">
      <span className="font-mono text-[11px] text-gray-400">{n}</span>
      <h3 className="text-lg font-semibold tracking-tight text-gray-950 sm:text-xl">{title}</h3>
    </div>
    <p className="text-[13px] text-gray-500">{hint}</p>
  </Reveal>
);

function DeviceGlyph({ id, active }: { id: SupportId; active: boolean }) {
  const stroke = active ? '#fff' : '#18181b';
  const fill = active ? 'rgba(255,255,255,0.12)' : '#f4f4f5';
  return (
    <svg viewBox="0 0 64 48" className="h-12 w-16" aria-hidden="true">
      {id === 'desktop' && (
        <>
          <rect x="6" y="6" width="52" height="30" rx="3" fill={fill} stroke={stroke} strokeWidth="2" />
          <path d="M24 42h16M32 36v6" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {id === 'tablet' && <rect x="18" y="4" width="28" height="40" rx="5" fill={fill} stroke={stroke} strokeWidth="2" />}
      {id === 'mobile' && (
        <>
          <rect x="23" y="4" width="18" height="40" rx="5" fill={fill} stroke={stroke} strokeWidth="2" />
          <path d="M29 8h6" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {id === 'a4' && (
        <>
          <path d="M20 4h18l8 8v32H20z" fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M38 4v8h8M25 20h14M25 26h14M25 32h9" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {id === 'slide' && (
        <>
          <rect x="4" y="8" width="56" height="31.5" rx="2.5" fill={fill} stroke={stroke} strokeWidth="2" />
          <path d="M26 44h12" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function StatusChip({ r }: { r: RepoSnapshot }) {
  const base = 'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium shadow-sm';
  if (r.embed === 'live')
    return (
      <span className={cn(base, 'bg-black text-white')}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> En ligne
      </span>
    );
  if (r.embed === 'blocked')
    return (
      <span className={cn(base, 'bg-white text-gray-800 ring-1 ring-black/5')}>
        <ShieldAlert className="h-3 w-3" /> CSP · statique
      </span>
    );
  if (r.embed === 'offline')
    return (
      <span className={cn(base, 'bg-white text-gray-600 ring-1 ring-black/5')}>
        <WifiOff className="h-3 w-3" /> Hors ligne
      </span>
    );
  return (
    <span className={cn(base, 'bg-white text-gray-600 ring-1 ring-black/5')}>
      <Code2 className="h-3 w-3" /> Code
    </span>
  );
}

function RepoVisual({ r }: { r: RepoSnapshot }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const site = r.homepage && (r.embed === 'live' || r.embed === 'blocked');
  if (site && !failed) {
    return (
      <>
        {!ready && <div className="skeleton absolute inset-0" />}
        <img
          src={screenshotUrl(r.homepage!)}
          alt={`Capture de ${r.siteTitle || r.name}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setReady(true)}
          onError={() => setFailed(true)}
          className={cn('absolute inset-0 h-full w-full object-cover object-top transition-all duration-700 group-hover:scale-[1.03]', ready ? 'opacity-100' : 'opacity-0')}
        />
      </>
    );
  }
  return (
    <div className="absolute inset-0 flex flex-col justify-between bg-[#f5f5f3] p-4">
      <span className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-gray-400">
        <span className="flex items-center gap-1.5">
          <GithubMark className="h-3 w-3" /> {GITHUB_USER.login}
        </span>
        <span className="rounded border border-gray-300 bg-white px-1 text-gray-500">{LANG_SHORT[r.language ?? ''] ?? r.language ?? '—'}</span>
      </span>
      <span className="break-words text-2xl font-semibold leading-none tracking-tight text-gray-900">{r.name}</span>
      <span className="space-y-1 opacity-60" aria-hidden="true">
        {[78, 52, 66].map((w, i) => (
          <span key={i} className="block h-1 rounded-full bg-gray-300" style={{ width: `${w}%` }} />
        ))}
      </span>
    </div>
  );
}

export function StartScreen({ github, recent, onOpen, onCreate, onDelete, onDuplicate, onOpenViewer, onOpenSystems, onOpenDesk }: StartScreenProps) {
  const repos = github.repos;
  const stats = useMemo(() => repoStats(repos), [repos]);
  const repoMap = useMemo(() => new Map(repos.map((r) => [r.name, r])), [repos]);

  const [typeId, setTypeId] = useState<ProjectTypeId>('portfolio');
  const [layoutId, setLayoutId] = useState<LayoutId>('bento');
  const [supportId, setSupportId] = useState<SupportId>('desktop');
  const [content, setContent] = useState<ContentMode>('github');
  const [selection, setSelection] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [q, setQ] = useState('');
  const [col, setCol] = useState<CollectionId | null>(null);
  const [status, setStatus] = useState<'tous' | 'live' | 'code'>('tous');
  const [sort, setSort] = useState<'recent' | 'az'>('recent');
  const [limit, setLimit] = useState(12);
  const [wizardVisible, setWizardVisible] = useState(false);
  const wizardRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const type = PROJECT_TYPE_MAP[typeId];
  const layout = LAYOUT_MAP[layoutId];
  const support = SUPPORT_MAP[supportId];
  const defaultName = `${type.name} — ${new Date().toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`;

  const creationOptions = useMemo(
    () => ({
      typeId,
      layoutId,
      supportId,
      fill: content === 'github' ? ('github' as const) : ('vide' as const),
      selection: content === 'selection' ? selection.map((n) => `gh:${n}`) : [],
      repos,
    }),
    [typeId, layoutId, supportId, content, selection, repos],
  );
  const preview = useMemo(() => createProject({ ...creationOptions, name: 'aperçu' }), [creationOptions]);
  const previewPosters = preview.cells.map((c) => posterFor(c.fragmentId, preview, repoMap));
  const previewNames = preview.cells
    .map((c) => (c.fragmentId ? preview.customFragments.find((f) => f.id === c.fragmentId)?.name ?? c.fragmentId.replace(/^(gh|m):/, '') : null))
    .filter((x): x is string => !!x);

  useEffect(() => {
    const el = wizardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setWizardVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const pickType = (id: ProjectTypeId) => {
    setTypeId(id);
    setLayoutId(PROJECT_TYPE_MAP[id].layout);
    setSupportId(PROJECT_TYPE_MAP[id].support);
  };

  const create = () => onCreate(createProject({ ...creationOptions, name: name.trim() || defaultName }));

  const caseStudy = (r: RepoSnapshot) => {
    const related = repos.find((x) => x.name !== r.name && x.embed === 'live' && collectionOf(x) === collectionOf(r));
    const p = createProject({
      typeId: 'case-study',
      name: `Étude de cas — ${r.name}`,
      explicit: ['t:case-intro', `gh:${r.name}`, 't:case-process', related ? `gh:${related.name}` : 'm:aiguille', 't:case-result'],
      repos,
    });
    const intro = p.customFragments[0];
    if (intro?.text) {
      const { title } = splitTitle(r.siteTitle, r.name);
      intro.text = { eyebrow: `Étude de cas · ${r.name}`, title: `${title}.`, body: r.siteDescription || r.description || 'Un projet de l’atelier @mattmezstitchlab.' };
      intro.name = title;
    }
    onCreate(p);
  };

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return repos
      .filter((r) => r.size > 0)
      .filter((r) => !col || collectionOf(r) === col)
      .filter((r) => (status === 'live' ? r.embed === 'live' || r.embed === 'blocked' : status === 'code' ? r.embed === 'none' || r.embed === 'offline' : true))
      .filter((r) => !query || `${r.name} ${r.siteTitle} ${r.description} ${r.siteDescription}`.toLowerCase().includes(query))
      .sort((a, b) => (sort === 'az' ? a.name.localeCompare(b.name) : b.pushedAt.localeCompare(a.pushedAt)));
  }, [repos, q, col, status, sort]);

  const counts = useMemo(() => {
    const c: Partial<Record<CollectionId, number>> = {};
    repos.forEach((r) => {
      if (r.size > 0) c[collectionOf(r)] = (c[collectionOf(r)] ?? 0) + 1;
    });
    return c;
  }, [repos]);

  const toggleSel = (n: string) => setSelection((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));

  return (
    <div ref={scrollRef} className="h-screen overflow-y-auto overflow-x-hidden bg-[#f5f5f7] text-gray-900">
      {/* Barre supérieure */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <AtlasLogo />
            <span className="hidden h-5 w-px bg-gray-200 sm:block" />
            <span className="hidden text-[13px] font-semibold text-gray-900 sm:block">Mémoire active</span>
            <span className="hidden text-[11px] text-gray-400 md:block">Workspace · {recent.length} compositions</span>
          </div>
          <div className="flex flex-1 justify-end md:justify-center">
            <div className="hidden md:block">
              <WorkspaceNav active="home" onNavigate={(page) => {
              if (page === 'viewer') onOpenViewer();
              else if (page === 'systems') onOpenSystems();
              else if (page === 'desk') onOpenDesk();
            }} />
            </div>
            <div className="md:hidden">
              <WorkspaceNav compact active="home" onNavigate={(page) => {
                if (page === 'viewer') onOpenViewer();
                else if (page === 'systems') onOpenSystems();
                else if (page === 'desk') onOpenDesk();
              }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void github.sync()}
              title="Synchroniser avec GitHub"
              className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 text-[12px] text-gray-600 transition-colors hover:border-gray-300"
            >
              <img src={GITHUB_USER.avatarUrl} alt="" className="h-6 w-6 rounded-full" />
              <span className="hidden font-medium text-gray-900 sm:inline">@{GITHUB_USER.login}</span>
              <span className={cn('h-1.5 w-1.5 rounded-full', github.status === 'live' ? 'bg-emerald-500' : github.status === 'error' ? 'bg-amber-500' : 'bg-gray-400')} />
              <RefreshCw className={cn('h-3 w-3 text-gray-400 group-hover:text-black', github.status === 'loading' && 'animate-spin')} />
            </button>
            <button
              type="button"
              onClick={() => onCreate(createProject({ typeId: 'blank', fill: 'vide', name: `Toile vierge — ${new Date().toLocaleDateString('fr-FR')}` }))}
              className="hidden rounded-lg bg-black px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-gray-800 sm:block"
            >
              Toile vierge
            </button>
          </div>
        </div>
      </header>

      <AimeHero repos={repos} onCreate={onCreate} onExplore={() => scrollTo('nouveau')} />

      <div className="mx-auto max-w-[1400px] space-y-24 px-4 py-20 sm:space-y-32 sm:px-6">
        {/* Reprendre */}
        {recent.length > 0 && (
          <section>
            <SectionHead id="reprendre" eyebrow={`Reprendre · ${recent.length} projet${recent.length > 1 ? 's' : ''}`} title="Vos compositions" />
            <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
              {recent.slice(0, 10).map((p, i) => {
                const posters = p.cells.map((c) => posterFor(c.fragmentId, p, repoMap));
                return (
                  <Reveal key={p.id} delay={Math.min(i, 6) * 50} className="w-[280px] shrink-0 snap-start sm:w-[320px]">
                    <div className="group relative rounded-2xl border border-gray-200 bg-white p-2 transition-all hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl">
                      <button type="button" onClick={() => onOpen(p)} className="block w-full text-left">
                        <LayoutThumb layoutId={p.layoutId} posters={posters} className="bg-gray-50 ring-1 ring-black/5" />
                        <div className="px-2 pb-1.5 pt-3">
                          <div className="truncate text-[14px] font-semibold text-gray-950">{p.name}</div>
                          <div className="mt-0.5 truncate font-mono text-[10px] text-gray-400">
                            {LAYOUT_MAP[p.layoutId]?.name} · {SUPPORT_MAP[p.supportId]?.name} · {p.cells.filter((c) => c.fragmentId).length} fragments · il y a {timeAgo(p.updatedAt)}
                          </div>
                        </div>
                      </button>
                      <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <button type="button" title="Dupliquer" onClick={() => onDuplicate(p)} className="rounded-md bg-white/95 p-1.5 text-gray-600 shadow-sm ring-1 ring-black/5 hover:text-black">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" title="Supprimer" onClick={() => onDelete(p.id)} className="rounded-md bg-white/95 p-1.5 text-gray-600 shadow-sm ring-1 ring-black/5 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </section>
        )}

        <ProjectTimeline repos={repos} onOpenRepo={onOpenViewer} />

        <FusionSection repos={repos} onCreate={onCreate} />

        <DomainStitch repos={repos} onCreate={onCreate} />

        {/* Assistant */}
        <section ref={wizardRef}>
          <SectionHead id="nouveau" eyebrow="Nouveau projet · 4 choix" title={<>Que voulez-vous <em className="text-gray-400">composer</em> ?</>}>
            <p className="max-w-md text-[14px] leading-relaxed text-gray-500">Chaque choix met à jour l’aperçu : les vignettes montrent vos vrais sites placés dans la composition.</p>
          </SectionHead>

          <StepTitle n="01" title="Projet de page" hint="Le type de page oriente la composition et le contenu proposés." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {PROJECT_TYPES.map((t, i) => {
              const Icon = t.icon;
              const active = t.id === typeId;
              return (
                <Reveal key={t.id} delay={Math.min(i, 8) * 35}>
                  <button
                    type="button"
                    onClick={() => pickType(t.id)}
                    aria-pressed={active}
                    className={cn(
                      'group relative flex h-full w-full flex-col rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg',
                      active ? 'border-black shadow-lg ring-1 ring-black' : 'border-gray-200 hover:border-gray-300',
                    )}
                  >
                    <span className="mb-4 flex items-start justify-between">
                      <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl transition-colors', active ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200')}>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      {active && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </span>
                    <span className="text-[15px] font-semibold text-gray-950">{t.name}</span>
                    <span className="mt-1 text-[13px] leading-snug text-gray-500">{t.description}</span>
                    <span className="mt-4 flex flex-wrap gap-1">
                      {t.sections.map((s) => (
                        <span key={s} className="rounded border border-gray-200 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-gray-500">
                          {s}
                        </span>
                      ))}
                    </span>
                    <span className="mt-auto pt-4 font-mono text-[10px] text-gray-400">
                      Suggéré · {LAYOUT_MAP[t.layout].name} · {SUPPORT_MAP[t.support].name}
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-16">
            <StepTitle n="02" title="Composition" hint={`${LAYOUTS.length} mises en page — toutes modifiables ensuite, sans perte de contenu.`} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {LAYOUTS.map((l, i) => {
                const active = l.id === layoutId;
                return (
                  <Reveal key={l.id} delay={Math.min(i, 10) * 30}>
                    <button
                      type="button"
                      onClick={() => setLayoutId(l.id)}
                      aria-pressed={active}
                      className={cn(
                        'group relative w-full rounded-2xl border bg-white p-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg',
                        active ? 'border-black shadow-lg ring-1 ring-black' : 'border-gray-200 hover:border-gray-300',
                      )}
                    >
                      <LayoutThumb layoutId={l.id} posters={content === 'vide' ? undefined : previewPosters} active={active} className="bg-gray-50 ring-1 ring-black/5" />
                      <span className="block px-1.5 pb-1 pt-2.5">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-semibold text-gray-950">{l.name}</span>
                          {l.id === type.layout && <span className="shrink-0 rounded bg-black px-1 py-px font-mono text-[8px] uppercase text-white">Reco.</span>}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-gray-500">{l.description}</span>
                      </span>
                    </button>
                  </Reveal>
                );
              })}
            </div>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-2">
            <div>
              <StepTitle n="03" title="Support" hint="Le format de la planche. Les autres restent prévisualisables." />
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {SUPPORTS.map((s) => {
                  const active = s.id === supportId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSupportId(s.id)}
                      aria-pressed={active}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 transition-all hover:-translate-y-0.5',
                        active ? 'border-black bg-black text-white shadow-lg' : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:shadow-md',
                      )}
                    >
                      <DeviceGlyph id={s.id} active={active} />
                      <span className="text-[13px] font-semibold">{s.name}</span>
                      <span className={cn('font-mono text-[10px]', active ? 'text-white/60' : 'text-gray-400')}>{s.detail}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <StepTitle n="04" title="Contenu" hint="D’où viennent les fragments ?" />
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ['github', 'Mes dépôts GitHub', 'Sites et dépôts adaptés au type de projet.'],
                    ['selection', `Ma sélection (${selection.length})`, 'Les dépôts cochés plus bas, dans l’ordre.'],
                    ['vide', 'Vide', 'Cellules vides, à remplir par glisser-déposer.'],
                  ] as [ContentMode, string, string][]
                ).map(([id, label, hint]) => (
                  <button
                    key={id}
                    type="button"
                    disabled={id === 'selection' && selection.length === 0}
                    onClick={() => setContent(id)}
                    aria-pressed={content === id}
                    className={cn(
                      'rounded-2xl border p-3.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40',
                      content === id ? 'border-black bg-white shadow-lg ring-1 ring-black' : 'border-gray-200 bg-white hover:border-gray-300',
                    )}
                  >
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-gray-950">
                      <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border', content === id ? 'border-black bg-black' : 'border-gray-300')}>
                        {content === id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      {label}
                    </span>
                    <span className="mt-1.5 block text-[12px] leading-snug text-gray-500">{hint}</span>
                  </button>
                ))}
              </div>
              {content !== 'vide' && previewNames.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {previewNames.map((n, i) => (
                    <span key={`${n}-${i}`} className="rounded-md border border-gray-200 bg-white px-2 py-1 font-mono text-[10px] text-gray-600">
                      {String.fromCharCode(65 + i)} · {n}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Modèles */}
        <section>
          <SectionHead id="modeles" eyebrow="Modèles prêts · depuis ton GitHub" title={<>Partir d’un <em className="text-gray-400">exemple réel</em></>}>
            <p className="max-w-md text-[14px] leading-relaxed text-gray-500">Neuf compositions préparées avec tes vrais sites : POINTZERO, Sillage, RIPPLECIRCLE, dispoo, le design system Le Monde Aime…</p>
          </SectionHead>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PRESETS.map((p, i) => {
              const posters = p.fill.map((id) => posterFor(id, null, repoMap));
              return (
                <Reveal key={p.id} delay={Math.min(i, 6) * 50}>
                  <button
                    type="button"
                    onClick={() => onCreate(createFromPreset(p, repos))}
                    className="group flex h-full w-full flex-col rounded-2xl border border-gray-200 bg-white p-2 text-left transition-all hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl"
                  >
                    <div className="relative overflow-hidden rounded-xl">
                      <LayoutThumb layoutId={p.layoutId} posters={posters} className="bg-gray-50 ring-1 ring-black/5 transition-transform duration-700 group-hover:scale-[1.02]" />
                    </div>
                    <div className="flex flex-1 flex-col px-2 pb-2 pt-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[16px] font-semibold text-gray-950">{p.name}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-black" />
                      </div>
                      <p className="mt-1 text-[13px] leading-snug text-gray-500">{p.description}</p>
                      <div className="mt-auto flex flex-wrap gap-1 pt-4">
                        {[PROJECT_TYPE_MAP[p.typeId].name, LAYOUT_MAP[p.layoutId].name, SUPPORT_MAP[p.supportId].name].map((c) => (
                          <span key={c} className="rounded border border-gray-200 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-gray-500">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Dépôts */}
        <section>
          <SectionHead
            id="depots"
            eyebrow={`GitHub · @${GITHUB_USER.login}`}
            title={
              <>
                Tes {stats.total} <em className="text-gray-400">dépôts</em>
              </>
            }
          >
            <div className="flex items-center gap-3 text-[12px] text-gray-500">
              <span className="font-mono text-[11px]">
                {github.status === 'live' ? `Synchronisé il y a ${timeAgo(github.syncedAt)}` : github.status === 'loading' ? 'Synchronisation…' : `Instantané du ${formatDate(github.syncedAt)}`}
              </span>
              <button type="button" onClick={() => void github.sync()} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-700 hover:border-gray-300">
                <RefreshCw className={cn('h-3.5 w-3.5', github.status === 'loading' && 'animate-spin')} /> Synchroniser
              </button>
            </div>
          </SectionHead>

          <Reveal className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              <button
                type="button"
                onClick={() => setCol(null)}
                className={cn('whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors', !col ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300')}
              >
                Toutes <span className="font-mono text-[10px] opacity-60">{stats.total - stats.empty}</span>
              </button>
              {COLLECTIONS.filter((c) => counts[c.id]).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCol(col === c.id ? null : c.id)}
                  className={cn('whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors', col === c.id ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300')}
                >
                  {c.label} <span className="font-mono text-[10px] opacity-60">{counts[c.id]}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1 lg:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un dépôt…" className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:border-black lg:w-56" />
              </div>
              <Segmented
                value={status}
                onChange={setStatus}
                className="w-[210px]"
                options={[
                  { value: 'tous', label: 'Tous' },
                  { value: 'live', label: 'Sites' },
                  { value: 'code', label: 'Code' },
                ]}
              />
              <Segmented
                value={sort}
                onChange={setSort}
                className="w-[150px]"
                options={[
                  { value: 'recent', label: 'Récents' },
                  { value: 'az', label: 'A → Z' },
                ]}
              />
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.slice(0, limit).map((r, i) => {
              const selected = selection.includes(r.name);
              const { title, tagline } = splitTitle(r.siteTitle, r.name);
              return (
                <Reveal key={r.name} delay={Math.min(i % 12, 8) * 35}>
                  <article className={cn('group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all hover:-translate-y-1 hover:shadow-xl', selected ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300')}>
                    <div className="relative aspect-[16/10] overflow-hidden border-b border-gray-100 bg-gray-50">
                      <RepoVisual r={r} />
                      <span className="absolute left-3 top-3">
                        <StatusChip r={r} />
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSel(r.name)}
                        aria-pressed={selected}
                        aria-label={selected ? `Retirer ${r.name} de la sélection` : `Sélectionner ${r.name}`}
                        className={cn(
                          'absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md border shadow-sm transition-all',
                          selected ? 'border-black bg-black text-white' : 'border-gray-300 bg-white/95 text-transparent hover:text-gray-400',
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="truncate text-[15px] font-semibold text-gray-950">{r.name}</h3>
                        <span className="shrink-0 font-mono text-[10px] text-gray-400">{LANG_SHORT[r.language ?? ''] ?? r.language ?? '—'}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-gray-500">
                        {r.siteTitle ? (tagline ? `${title} — ${tagline}` : title) : r.description || (r.embed === 'offline' ? 'Site hors ligne · dépôt de code disponible.' : 'Dépôt de code, sans site publié.')}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                        <span className="truncate font-mono text-[10px] text-gray-400">
                          {formatDate(r.pushedAt)} · {formatSize(r.size)}
                        </span>
                        <span className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => caseStudy(r)}
                            title="Créer une étude de cas"
                            className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:border-black hover:bg-black hover:text-white"
                          >
                            <BookOpen className="h-3 w-3" /> Étude
                          </button>
                          <a
                            href={r.homepage && r.embed !== 'offline' ? r.homepage : githubRepoUrl(r.name)}
                            target="_blank"
                            rel="noreferrer"
                            title={r.homepage && r.embed !== 'offline' ? 'Ouvrir le site' : 'Voir sur GitHub'}
                            className="flex items-center rounded-md border border-gray-200 px-1.5 py-1 text-gray-500 transition-colors hover:border-gray-300 hover:text-black"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </span>
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
          {filtered.length === 0 && <p className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400">Aucun dépôt ne correspond à ces filtres.</p>}
          {filtered.length > limit && (
            <div className="mt-8 flex justify-center">
              <button type="button" onClick={() => setLimit((n) => n + 12)} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md">
                Afficher plus · {filtered.length - limit} restants
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Pied de page */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <AtlasLogo />
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-gray-500">
              Instantané GitHub du {formatDate(SNAPSHOT_FALLBACK(github.syncedAt))} · synchronisation live via l’API publique · captures d’écran réelles des sites · photographies Pexels.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {[
              ['⌘ K', 'Rechercher'],
              ['E · U · P', 'Éditer · Utiliser · Présenter'],
              ['V · H', 'Sélection · Main'],
              ['C', 'Recadrage vivant'],
              ['L', 'Changer de composition'],
              ['⌘ Z', 'Annuler · ⇧ rétablir'],
            ].map(([k, l]) => (
              <div key={k} className="flex items-center gap-3">
                <dt>
                  <kbd className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-[10px] text-gray-600">{k}</kbd>
                </dt>
                <dd className="text-[12px] text-gray-500">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </footer>

      {/* Barre de création collante */}
      <div
        className={cn(
          'pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3 transition-all duration-500',
          wizardVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        )}
      >
        <div className={cn('flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-gray-200 bg-white/95 p-2 shadow-2xl backdrop-blur', wizardVisible && 'pointer-events-auto')}>
          <div className="hidden w-20 shrink-0 sm:block">
            <LayoutThumb layoutId={layoutId} posters={content === 'vide' ? undefined : previewPosters} className="rounded-md bg-gray-50 ring-1 ring-black/5" />
          </div>
          <div className="hidden min-w-0 md:block">
            <div className="truncate text-[13px] font-semibold text-gray-950">
              {type.name} · {layout.name}
            </div>
            <div className="truncate font-mono text-[10px] text-gray-400">
              {support.name} {support.detail} · {preview.cells.length} cellules · {preview.cells.filter((c) => c.fragmentId).length} fragments
            </div>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder={defaultName}
            aria-label="Nom du projet"
            className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-black focus:bg-white"
          />
          <button type="button" onClick={create} className="group flex shrink-0 items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-[13px] font-medium text-white hover:bg-gray-800">
            Créer <span className="hidden sm:inline">le projet</span> <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {selection.length > 0 && !wizardVisible && (
        <div className="animate-pop fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black py-1.5 pl-4 pr-1.5 text-[12px] text-white shadow-2xl">
          <span>
            {selection.length} dépôt{selection.length > 1 ? 's' : ''} sélectionné{selection.length > 1 ? 's' : ''}
          </span>
          <button type="button" onClick={() => setSelection([])} className="text-white/60 hover:text-white">
            Effacer
          </button>
          <button
            type="button"
            onClick={() => {
              setContent('selection');
              scrollTo('nouveau');
            }}
            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-black hover:bg-gray-200"
          >
            Composer avec <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

const SNAPSHOT_FALLBACK = (iso: string) => iso;
