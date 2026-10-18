import { repoPreview } from './repoPreview';
import type { EmbedStatus } from './githubSnapshot';
import type { Fragment, FragmentKind, Project } from '../types';
import type { RepoSnapshot } from './repos';
import { hostOf, repoToFragment, screenshotUrl } from './repos';
import { YOUTUBE_CHANNEL, YOUTUBE_VIDEOS, youtubeEmbed, youtubeWatch } from './youtube';
import { DOCUMENTED_SYSTEMS, paletteForRepo, systemForRepo } from './designSystems';

export type CatalogSource = 'github' | 'youtube' | 'base44' | 'figma' | 'lovable' | 'replit' | 'url';

export type Signal =
  | 'fonctionnel'
  | 'hors-ligne'
  | 'iframe-bloquee'
  | 'hors-bibliotheque'
  | 'non-place'
  | 'moteur'
  | 'developpe'
  | 'esquisse'
  | 'vide'
  | 'visuel'
  | 'design-system'
  | 'code';

export interface CatalogItem {
  id: string;
  source: CatalogSource;
  name: string;
  title: string;
  description: string;
  url?: string;
  repo?: string;
  poster?: string;
  previewLabel?: string;
  embed: EmbedStatus | 'unknown';
  language?: string | null;
  size?: number;
  date?: string;
  views?: number;
  signals: Signal[];
  fragmentId: string;
}

export const SIGNAL_LABEL: Record<Signal, string> = {
  fonctionnel: 'Fonctionnel',
  'hors-ligne': 'Hors ligne',
  'iframe-bloquee': 'Iframe bloquée',
  'hors-bibliotheque': 'Pas dans la bibliothèque',
  'non-place': 'Pas encore placé',
  moteur: 'Moteur',
  developpe: 'Développé',
  esquisse: 'Esquisse',
  vide: 'Vide',
  visuel: 'Visuel',
  'design-system': 'Design system',
  code: 'Code seul',
};

export const SOURCE_LABEL: Record<CatalogSource, string> = {
  github: 'GitHub',
  youtube: 'YouTube',
  base44: 'Base44',
  figma: 'Figma',
  lovable: 'Lovable',
  replit: 'Replit',
  url: 'URL',
};

const ENGINE = /composer|desk|archive|systematlas|desktop|builder|cachet|bibliotheque|timeline/i;
const SYSTEM_NAME = /design.?system|colorcard|token/i;

export function maturity(size = 0, name = ''): Signal {
  if (size <= 0 && !ENGINE.test(name)) return 'vide';
  if (size >= 8000 || (ENGINE.test(name) && size > 80)) return 'moteur';
  if (size >= 800) return 'developpe';
  if (size <= 0) return 'vide';
  return 'esquisse';
}

export function classifyHost(url: string): CatalogSource {
  const h = hostOf(url).toLowerCase();
  if (h.includes('youtube.com') || h === 'youtu.be') return 'youtube';
  if (h.includes('base44.app') || h.includes('base44.com')) return 'base44';
  if (h.includes('figma.com')) return 'figma';
  if (h.includes('lovable.app') || h.includes('lovable.dev')) return 'lovable';
  if (h.includes('replit.com') || h.includes('replit.dev') || h.endsWith('repl.co')) return 'replit';
  if (h.includes('github.com')) return 'github';
  return 'url';
}

export function youtubeIdFromUrl(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|embed\/|watch\?v=|v\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1] ?? null;
}

/** Site Base44 réellement en ligne (HTTP 200, iframe refusée). */
export const BASE44_SITE = {
  id: 'pf:base44-mattmezsax',
  name: 'Matt Mez Sax',
  url: 'https://mattmezsax.base44.app',
  title: 'Prestations musicales — Demande de devis',
  description: 'Vérifier une date et demander un devis. Le site répond, mais interdit l’affichage dans une iframe.',
};

const LIBRARY_KEY = 'atlas:library-extra:v1';
const URLS_KEY = 'atlas:sources:v1';

export function loadExtras(): Fragment[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    const list = raw ? (JSON.parse(raw) as Fragment[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveExtra(f: Fragment): Fragment[] {
  const next = [f, ...loadExtras().filter((x) => x.id !== f.id)].slice(0, 80);
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return next;
}

export function isInLibrary(id: string, extras: Fragment[]): boolean {
  if (id.startsWith('gh:') || id.startsWith('m:')) return true;
  return extras.some((f) => f.id === id);
}

export interface SavedUrl {
  url: string;
  name: string;
  addedAt: number;
}

export function loadSavedUrls(): SavedUrl[] {
  try {
    const raw = localStorage.getItem(URLS_KEY);
    const list = raw ? (JSON.parse(raw) as SavedUrl[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveUrl(entry: SavedUrl): SavedUrl[] {
  const next = [entry, ...loadSavedUrls().filter((x) => x.url !== entry.url)].slice(0, 40);
  try {
    localStorage.setItem(URLS_KEY, JSON.stringify(next));
  } catch {
    /* Quota ou mode privé : l'URL reste visible dans la session en cours. */
  }
  return next;
}

function placedIds(projects: Project[]): Set<string> {
  const s = new Set<string>();
  projects.forEach((p) => p.cells.forEach((c) => c.fragmentId && s.add(c.fragmentId)));
  return s;
}

export function fragmentFromItem(item: CatalogItem): Fragment {
  const yt = item.source === 'youtube' ? item.id.replace('yt:', '') : youtubeIdFromUrl(item.url);
  if (item.source === 'youtube' && yt) {
    return {
      id: item.fragmentId,
      kind: 'video',
      name: item.name,
      subtitle: `youtube.com/@mattmezsax · ${item.views?.toLocaleString('fr-FR') ?? 0} vues`,
      source: 'url',
      url: youtubeEmbed(yt),
      poster: item.poster,
      embed: 'live',
      headline: item.title,
      description: item.description,
      collection: 'son',
    };
  }
  return {
    id: item.fragmentId,
    kind: item.source === 'github' ? (item.embed === 'none' ? 'repo' : 'site') : 'site',
    name: item.name,
    subtitle: `${item.url ? hostOf(item.url) : SOURCE_LABEL[item.source]} · ${SIGNAL_LABEL[item.signals.find((s) => s === 'fonctionnel' || s === 'hors-ligne' || s === 'iframe-bloquee') ?? 'code']}`,
    source: item.source === 'github' ? 'github' : 'url',
    url: item.url,
    repo: item.repo,
    embed: item.embed,
    language: item.language,
    headline: item.title,
    description: item.description,
    poster: item.poster,
    fallbackPoster: item.poster,
    size: item.size,
    pushedAt: item.date,
  };
}

export function allKnownFragments(): Fragment[] {
  const urls = loadSavedUrls().map((u) =>
    fragmentFromItem({
      id: `url:${encodeURIComponent(u.url)}`,
      source: classifyHost(u.url),
      name: u.name,
      title: u.name,
      description: '',
      url: u.url,
      poster: screenshotUrl(u.url),
      embed: 'unknown',
      signals: [],
      fragmentId: `url:${encodeURIComponent(u.url)}`,
    }),
  );
  const map = new Map<string, Fragment>();
  [...builtinFragments(), ...urls, ...loadExtras()].forEach((f) => map.set(f.id, f));
  return [...map.values()];
}

export function builtinFragments(): Fragment[] {
  const yt = YOUTUBE_VIDEOS.map((v) =>
    fragmentFromItem({
      id: `yt:${v.id}`,
      source: 'youtube',
      name: v.title,
      title: v.title,
      description: v.description,
      url: youtubeWatch(v.id),
      poster: v.thumb,
      embed: 'live',
      views: v.views,
      date: v.published,
      signals: [],
      fragmentId: `yt:${v.id}`,
    }),
  );
  const base = fragmentFromItem({
    id: BASE44_SITE.id,
    source: 'base44',
    name: BASE44_SITE.name,
    title: BASE44_SITE.title,
    description: BASE44_SITE.description,
    url: BASE44_SITE.url,
    poster: screenshotUrl(BASE44_SITE.url),
    embed: 'blocked',
    signals: [],
    fragmentId: BASE44_SITE.id,
  });
  return [...yt, base];
}

export function buildCatalog(repos: RepoSnapshot[], projects: Project[], extras: Fragment[], urls: SavedUrl[]): CatalogItem[] {
  const placed = placedIds(projects);
  const items: CatalogItem[] = [];

  for (const r of repos) {
    const id = `gh:${r.name}`;
    const frag = repoToFragment(r);
    const level = maturity(r.size, r.name);
    const hasSite = r.embed === 'live' || r.embed === 'blocked';
    const hasSystem = !!systemForRepo(r.name) || !!paletteForRepo(r.name) || SYSTEM_NAME.test(r.name);
    const signals: Signal[] = [];
    if (r.embed === 'live') signals.push('fonctionnel');
    else if (r.embed === 'blocked') signals.push('fonctionnel', 'iframe-bloquee');
    else if (r.embed === 'offline') signals.push('hors-ligne');
    else signals.push(r.size > 0 ? 'code' : 'vide');
    signals.push(level);
    if (hasSite || r.embed === 'offline') signals.push('visuel');
    if (hasSystem) signals.push('design-system');
    if (!placed.has(id)) signals.push('non-place');
    items.push({
      id,
      source: 'github',
      name: r.name,
      title: r.siteTitle || r.name,
      description: r.siteDescription || r.description || (r.size === 0 ? 'Dépôt vide.' : 'Dépôt de code, sans site publié.'),
      url: r.homepage ?? undefined,
      repo: r.name,
      poster: frag.poster,
      previewLabel: repoPreview(r).label,
      embed: r.embed,
      language: r.language,
      size: r.size,
      date: r.pushedAt,
      signals,
      fragmentId: id,
    });
  }

  for (const v of YOUTUBE_VIDEOS) {
    const id = `yt:${v.id}`;
    items.push({
      id,
      source: 'youtube',
      name: v.title,
      title: v.title,
      description: v.description || `Vidéo publique · ${YOUTUBE_CHANNEL.name}`,
      url: youtubeWatch(v.id),
      poster: v.thumb,
      embed: 'live',
      views: v.views,
      date: v.published,
      signals: ['fonctionnel', 'visuel', ...(isInLibrary(id, extras) ? [] : (['hors-bibliotheque'] as Signal[])), ...(placed.has(id) ? [] : (['non-place'] as Signal[]))],
      fragmentId: id,
    });
  }

  items.push({
    id: BASE44_SITE.id,
    source: 'base44',
    name: BASE44_SITE.name,
    title: BASE44_SITE.title,
    description: BASE44_SITE.description,
    url: BASE44_SITE.url,
    poster: screenshotUrl(BASE44_SITE.url),
    embed: 'blocked',
    date: '2026-10-16',
    signals: ['fonctionnel', 'iframe-bloquee', 'visuel', 'design-system', ...(isInLibrary(BASE44_SITE.id, extras) ? [] : (['hors-bibliotheque'] as Signal[])), ...(placed.has(BASE44_SITE.id) ? [] : (['non-place'] as Signal[]))],
    fragmentId: BASE44_SITE.id,
  });

  for (const u of urls) {
    const source = classifyHost(u.url);
    const id = `url:${encodeURIComponent(u.url)}`;
    const yt = youtubeIdFromUrl(u.url);
    items.push({
      id,
      source,
      name: u.name || hostOf(u.url),
      title: u.name || hostOf(u.url),
      description: 'Ajouté par vous. Le statut iframe se vérifie en ouvrant l’aperçu.',
      url: u.url,
      poster: yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : screenshotUrl(u.url),
      embed: 'unknown',
      date: new Date(u.addedAt).toISOString(),
      signals: ['visuel', ...(isInLibrary(id, extras) ? [] : (['hors-bibliotheque'] as Signal[]))],
      fragmentId: id,
    });
  }

  return items;
}

export interface FeatureRow {
  label: string;
  on: boolean;
  detail: string;
}

export interface FeatureGroup {
  id: string;
  label: string;
  rows: FeatureRow[];
}

export function featureGroups(item: CatalogItem): FeatureGroup[] {
  const live = item.signals.includes('fonctionnel');
  const blocked = item.signals.includes('iframe-bloquee');
  const visual = item.signals.includes('visuel');
  const system = item.signals.includes('design-system');
  const engine = item.signals.includes('moteur');
  const developed = item.signals.includes('developpe') || engine;
  return [
    {
      id: 'statut',
      label: 'Statut',
      rows: [
        { label: 'Fonctionnel', on: live, detail: live ? 'Répond en ligne' : 'Pas de surface active' },
        { label: 'Hors ligne', on: item.signals.includes('hors-ligne'), detail: item.embed === 'offline' ? 'URL publiée, site absent' : '—' },
        { label: 'Dans la bibliothèque', on: !item.signals.includes('hors-bibliotheque'), detail: item.signals.includes('hors-bibliotheque') ? 'À importer' : 'Déjà listé' },
        { label: 'Placé', on: !item.signals.includes('non-place'), detail: item.signals.includes('non-place') ? 'Dans aucune composition' : 'Utilisé' },
      ],
    },
    {
      id: 'integration',
      label: 'Intégration',
      rows: [
        { label: 'Iframe live', on: item.embed === 'live' || item.embed === 'unknown', detail: item.embed === 'live' ? 'Affichable' : item.embed === 'unknown' ? 'À tester' : 'Non' },
        { label: 'Iframe bloquée', on: blocked, detail: blocked ? 'Aperçu statique seulement' : '—' },
        { label: 'Lecture', on: item.source === 'youtube' || /sillage|radio|audio/i.test(item.name), detail: item.source === 'youtube' ? 'Lecteur YouTube' : 'Selon le fragment' },
        { label: 'Lien public', on: !!item.url, detail: item.url ? hostOf(item.url) : 'Aucun' },
      ],
    },
    {
      id: 'moteur',
      label: 'Moteur',
      rows: [
        { label: 'Moteur', on: engine, detail: engine ? `${Math.round((item.size ?? 0) / 1024)} Mo de code` : 'Pas un moteur' },
        { label: 'Développé', on: developed, detail: developed ? item.language ?? 'code' : 'Peu de code' },
        { label: 'Esquisse', on: item.signals.includes('esquisse'), detail: item.signals.includes('esquisse') ? 'Petit dépôt' : '—' },
        { label: 'Vide', on: item.signals.includes('vide'), detail: item.signals.includes('vide') ? '0 Ko' : '—' },
      ],
    },
    {
      id: 'visuel',
      label: 'Visuels',
      rows: [
        { label: 'Capture réelle', on: visual && item.source !== 'youtube' && item.embed !== 'none', detail: visual ? 'Miniature disponible' : 'Pas de visuel publié' },
        { label: 'Vidéo', on: item.source === 'youtube', detail: item.views ? `${item.views.toLocaleString('fr-FR')} vues` : '—' },
        { label: 'Carte code', on: item.embed === 'none' && (item.size ?? 0) > 0, detail: 'Open Graph GitHub' },
      ],
    },
    {
      id: 'systeme',
      label: 'Design system',
      rows: [
        { label: 'Documenté', on: !!item.repo && !!systemForRepo(item.repo) && systemForRepo(item.repo)!.status === 'documente', detail: item.repo && systemForRepo(item.repo) ? systemForRepo(item.repo)!.name : '—' },
        { label: 'Tokens extraits', on: system, detail: system ? 'Palette lue dans le CSS' : 'Aucun token trouvé' },
        { label: 'Composants', on: !!item.repo && (systemForRepo(item.repo)?.components.length ?? 0) > 2, detail: item.repo ? (systemForRepo(item.repo)?.components.slice(0, 3).join(' · ') || '—') : '—' },
      ],
    },
  ];
}

export function featureGroupsForFragment(f: Fragment, opts?: { inLibrary?: boolean; placed?: boolean }): FeatureGroup[] {
  const item: CatalogItem = {
    id: f.id,
    source: f.id.startsWith('yt:') ? 'youtube' : f.id.startsWith('pf:base44') ? 'base44' : f.source === 'github' ? 'github' : classifyHost(f.url ?? ''),
    name: f.name,
    title: f.headline ?? f.name,
    description: f.description ?? '',
    url: f.url,
    repo: f.repo,
    poster: f.poster,
    embed: f.embed === 'unknown' ? 'unknown' : (f.embed ?? 'none'),
    language: f.language,
    size: f.size,
    signals: [],
    fragmentId: f.id,
  };
  const level = f.repo || f.size ? maturity(f.size ?? 0, f.repo ?? f.name) : f.kind === 'video' ? 'developpe' : 'esquisse';
  if (f.embed === 'live' || f.embed === 'unknown') item.signals.push('fonctionnel');
  if (f.embed === 'blocked') item.signals.push('fonctionnel', 'iframe-bloquee');
  if (f.embed === 'offline') item.signals.push('hors-ligne');
  if (f.embed === 'none') item.signals.push((f.size ?? 0) > 0 ? 'code' : 'vide');
  item.signals.push(level);
  if (f.poster || f.kind === 'image' || f.kind === 'video' || f.kind === 'site') item.signals.push('visuel');
  if (f.repo && (systemForRepo(f.repo) || paletteForRepo(f.repo))) item.signals.push('design-system');
  if (opts?.inLibrary === false) item.signals.push('hors-bibliotheque');
  if (opts?.placed === false) item.signals.push('non-place');
  return featureGroups(item);
}

export const DOCUMENTED_IDS = DOCUMENTED_SYSTEMS.map((s) => s.id);

export function kindOfCatalog(id: string): FragmentKind | undefined {
  if (id.startsWith('yt:')) return 'video';
  if (id.startsWith('pf:') || id.startsWith('url:')) return 'site';
  return undefined;
}
