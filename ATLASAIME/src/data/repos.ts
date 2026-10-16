import { REPO_SNAPSHOT, GITHUB_USER, SNAPSHOT_DATE } from './githubSnapshot';
import type { RepoSnapshot } from './githubSnapshot';
import type { CollectionId, Fragment } from '../types';

export { REPO_SNAPSHOT, GITHUB_USER, SNAPSHOT_DATE };
export type { RepoSnapshot };

export const COLLECTIONS: { id: CollectionId; label: string; hint: string }[] = [
  { id: 'mariage', label: 'Mariage', hint: 'sites, coffrets & cartes' },
  { id: 'aime', label: 'AIME®', hint: 'plateforme & univers' },
  { id: 'broderie', label: 'Broderie', hint: 'atelier & stitch' },
  { id: 'son', label: 'Son', hint: 'radio & bande-son' },
  { id: 'editorial', label: 'Éditorial', hint: 'magazines & bibliothèques' },
  { id: 'design', label: 'Design system', hint: 'fondations & composants' },
  { id: 'outils', label: 'Outils', hint: 'apps & utilitaires' },
  { id: 'experimental', label: 'Expérimental', hint: '3D, cadrans & mutations' },
  { id: 'autres', label: 'Autres', hint: 'divers' },
];

const RULES: [CollectionId, RegExp][] = [
  ['son', /sillage|radio|bande-originale|soundtrack|music/i],
  ['broderie', /brode|broderie|stitch|embroider/i],
  ['editorial', /magazine|wedmag|biblioth|cercle|weddingbook/i],
  ['design', /design ?system|designsystem|colorcard/i],
  ['experimental', /3d|spatial|butterfly|ripple|metamorphose|nexus|aurora|timbre|stamp/i],
  ['outils', /dispoo|budget|relia|desk|scan|builder|composer|timeline|archive|cachet|pacte/i],
  ['mariage', /mariage|wedd|vows|eternity|coffret|emmalucas|gaia|grand jour/i],
  ['aime', /aime|pointzero|monde/i],
];

export function collectionOf(r: RepoSnapshot): CollectionId {
  const haystack = `${r.name} ${r.siteTitle} ${r.description}`;
  for (const [id, re] of RULES) if (re.test(haystack)) return id;
  return 'autres';
}

export const hostOf = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

/** Capture réelle de la page (pré-générée) — viewport 1440 × 900 */
export const screenshotUrl = (url: string) =>
  `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=960&h=600&vpw=1440&vph=900`;

/** Carte OpenGraph générée par GitHub pour un dépôt */
export const githubOgUrl = (name: string) => `https://opengraph.githubassets.com/atlas/${GITHUB_USER.login}/${name}`;
export const githubRepoUrl = (name: string) => `${GITHUB_USER.htmlUrl}/${name}`;

export const formatSize = (kb: number) =>
  kb >= 1024 ? `${(kb / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo` : `${kb} Ko`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

export function timeAgo(input: string | number): string {
  const t = typeof input === 'number' ? input : new Date(input).getTime();
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} j`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo} mois`;
  return `${Math.round(mo / 12)} an(s)`;
}

export const LANG_SHORT: Record<string, string> = {
  TypeScript: 'TS',
  JavaScript: 'JS',
  HTML: 'HTML',
  Astro: 'ASTRO',
  CSS: 'CSS',
};

/** "Sillage — La bande-son de votre histoire" → { title: "Sillage", tagline: "La bande-son…" } */
export function splitTitle(siteTitle: string, fallback: string) {
  if (!siteTitle) return { title: fallback, tagline: '' };
  const parts = siteTitle.split(/\s[—·|]\s/);
  return { title: parts[0].trim() || fallback, tagline: parts.slice(1).join(' · ').trim() };
}

export const isEmptyRepo = (r: RepoSnapshot) => r.size === 0;

export function repoToFragment(r: RepoSnapshot): Fragment {
  const host = r.homepage ? hostOf(r.homepage) : null;
  const isSite = !!r.homepage && (r.embed === 'live' || r.embed === 'blocked');
  const lang = r.language ?? 'sans langage';
  let subtitle = `github · ${lang} · ${formatSize(r.size)}`;
  if (isSite) subtitle = `${host} · ${r.embed === 'live' ? 'iframe · en ligne' : 'CSP · aperçu statique'}`;
  else if (r.homepage && r.embed === 'offline') subtitle = `${host} · hors ligne · ${lang}`;

  return {
    id: `gh:${r.name}`,
    kind: isSite ? 'site' : 'repo',
    name: r.name,
    subtitle,
    source: 'github',
    url: r.homepage ?? undefined,
    repo: r.name,
    embed: r.embed,
    language: r.language,
    headline: r.siteTitle || undefined,
    description: r.description || r.siteDescription || '',
    pushedAt: r.pushedAt,
    createdAt: r.createdAt,
    size: r.size,
    collection: collectionOf(r),
    poster: isSite && r.homepage ? screenshotUrl(r.homepage) : githubOgUrl(r.name),
    fallbackPoster: r.ogImage || githubOgUrl(r.name),
  };
}

export function repoStats(repos: RepoSnapshot[]) {
  return {
    total: repos.length,
    live: repos.filter((r) => r.embed === 'live').length,
    blocked: repos.filter((r) => r.embed === 'blocked').length,
    offline: repos.filter((r) => r.embed === 'offline').length,
    code: repos.filter((r) => r.embed === 'none' && r.size > 0).length,
    empty: repos.filter((r) => r.size === 0).length,
  };
}

export const findRepo = (repos: RepoSnapshot[], name: string) => repos.find((r) => r.name === name);
