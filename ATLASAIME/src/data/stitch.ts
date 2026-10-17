import type { CollectionId, Fragment, Project, ProjectTheme } from '../types';
import type { RepoSnapshot } from './repos';
import { collectionOf, GITHUB_USER, repoToFragment } from './repos';
import { MEDIA_MAP } from './media';
import { loadExtras } from './catalog';
import { createProject, makeTextFragment, uid } from './templates';
import type { TextContent } from '../types';

export type SectionRole =
  | 'hero'
  | 'features'
  | 'gallery'
  | 'media'
  | 'audio'
  | 'testimonial'
  | 'cta'
  | 'docs'
  | 'code';

export const ROLE_LABEL: Record<SectionRole, string> = {
  hero: 'Accueil',
  features: 'Offres',
  gallery: 'Galerie',
  media: 'Vidéo',
  audio: 'Audio',
  testimonial: 'Témoignages',
  cta: 'Appel',
  docs: 'Documents',
  code: 'Code',
};

/** Ordre de lecture d'une page assemblée, bord à bord. */
export const FLOW: SectionRole[] = ['hero', 'features', 'gallery', 'media', 'audio', 'testimonial', 'cta', 'docs', 'code'];

export interface Section {
  fragment: Fragment;
  domain: CollectionId;
  role: SectionRole;
  source: string;
  weight: number;
}

function roleOf(f: Fragment): SectionRole {
  const hay = `${f.name} ${f.headline ?? ''} ${f.description ?? ''} ${f.subtitle}`.toLowerCase();
  if (f.kind === 'audio') return 'audio';
  if (f.kind === 'video') return 'media';
  if (f.kind === 'image' || f.kind === 'svg' || f.kind === 'model3d') return 'gallery';
  if (f.kind === 'pdf') return 'docs';
  if (f.kind === 'repo' || f.kind === 'code') return 'code';
  if (f.kind === 'text') {
    if (/témoignage|avis|client|review|love|merci|recommand/i.test(hay)) return 'testimonial';
    if (/contact|devis|rsvp|réserv|reserv|book|rendez|mail|command/i.test(hay)) return 'cta';
    return 'features';
  }
  if (/galerie|portfolio|works|projets|showcase|insta/i.test(hay)) return 'gallery';
  if (/contact|devis|rsvp|book|command/i.test(hay)) return 'cta';
  return 'hero';
}

function sourceLabel(f: Fragment, repo?: string): string {
  if (repo) return repo;
  if (f.source === 'url') return 'URL';
  if (f.source === 'upload' || f.source === 'media') return 'Import';
  return f.subtitle || '—';
}

function weightOf(repo: RepoSnapshot | undefined, f: Fragment): number {
  let w = 0;
  if (f.poster) w += 2;
  if (f.embed === 'live') w += 2;
  if (f.embed === 'blocked') w += 1;
  if (f.kind !== 'repo' && f.kind !== 'code') w += 1;
  if (repo && repo.size > 0) w += 1;
  return w;
}

function makeSection(f: Fragment, source: string, domain: CollectionId, r: RepoSnapshot | undefined): Section {
  return { fragment: f, domain, role: roleOf(f), source, weight: weightOf(r, f) };
}

/** Moissonne une « section » par fragment issu de tous les dépôts + imports locaux. */
export function gatherSections(repos: RepoSnapshot[], extras: Fragment[] = loadExtras()): Section[] {
  const out: Section[] = [];
  for (const r of repos) {
    const f = repoToFragment(r);
    out.push(makeSection(f, r.name, collectionOf(r), r));
  }
  for (const f of extras) {
    out.push(makeSection(f, sourceLabel(f), f.collection ?? 'autres', undefined));
  }
  return out;
}

export interface DomainSummary {
  domain: CollectionId;
  count: number;
  roles: SectionRole[];
}

export function domainSummaries(sections: Section[]): DomainSummary[] {
  const map = new Map<CollectionId, DomainSummary>();
  for (const s of sections) {
    const d = map.get(s.domain) ?? { domain: s.domain, count: 0, roles: [] };
    d.count += 1;
    if (!d.roles.includes(s.role)) d.roles.push(s.role);
    map.set(s.domain, d);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/**
 * Assemble, dans un domaine, un jeu de sections *complémentaires* et *diversifiées* :
 * une par rôle (hero → offres → galerie → …), en privilégiant à chaque fois un dépôt
 * différent pour que la page provienne de tous les repos du domaine.
 */
export function stitchDomain(sections: Section[], domain: CollectionId): Section[] {
  const pool = sections.filter((s) => s.domain === domain);
  const byRole = new Map<SectionRole, Section[]>();
  for (const s of pool) {
    const list = byRole.get(s.role) ?? [];
    list.push(s);
    byRole.set(s.role, list);
  }
  const usedRepos = new Set<string>();
  const picks: Section[] = [];
  for (const role of FLOW) {
    const cands = byRole.get(role);
    if (!cands || cands.length === 0) continue;
    cands.sort((a, b) => {
      const dw = b.weight - a.weight;
      if (dw !== 0) return dw;
      const au = usedRepos.has(a.source) ? 1 : 0;
      const bu = usedRepos.has(b.source) ? 1 : 0;
      return au - bu;
    });
    const pick = cands[0];
    picks.push(pick);
    usedRepos.add(pick.source);
  }
  return picks;
}

/* ----------------------------------------------------------------------------
 * 1) Récolte de sous-sections — on scrape le README de chaque dépôt (API GitHub,
 *    CORS-friendly) et on en extrait des blocs sémantiques réels, plus fins que le
 *    site entier. Chaque bloc devient une section exploitable pour l'assemblage.
 * -------------------------------------------------------------------------- */

function slug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 32);
}

function splitMarkdown(md: string): { heading: string; body: string }[] {
  const lines = md.split('\n');
  const out: { heading: string; body: string }[] = [];
  let cur: { heading: string; body: string } | null = null;
  let buf: string[] = [];
  const push = () => {
    if (cur) out.push({ heading: cur.heading, body: buf.join(' ').trim() });
    cur = null;
    buf = [];
  };
  for (const line of lines) {
    const m = line.match(/^#{2,3}\s+(.*)$/);
    if (m) {
      push();
      cur = { heading: m[1].trim(), body: '' };
    } else if (cur) {
      const clean = line.replace(/[#*`>_\[\]\(\)]/g, '').trim();
      if (clean) buf.push(clean);
    }
  }
  push();
  return out.filter((s) => s.heading && s.body.length > 12);
}

function roleFromHeading(h: string): SectionRole {
  const t = h.toLowerCase();
  if (/fonction|feature|offre|service|caractér|capacit/i.test(t)) return 'features';
  if (/galerie|portfolio|showcase|exemple|galler/i.test(t)) return 'gallery';
  if (/vidéo|video|démo|demo|show/i.test(t)) return 'media';
  if (/audio|son|musique/i.test(t)) return 'audio';
  if (/témoign|avis|client|review/i.test(t)) return 'testimonial';
  if (/contact|devis|rsvp|réserv|reserv|commenc|call/i.test(t)) return 'cta';
  if (/doc|guide|api|référence|reference/i.test(t)) return 'docs';
  if (/à propos|about|intro|présentation|presentation/i.test(t)) return 'hero';
  return 'features';
}

/** Tente de récupérer les sections du README d'un dépôt (best-effort, jamais bloquant). */
export async function fetchReadmeSections(repoName: string): Promise<{ heading: string; body: string }[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USER.login}/${repoName}/readme`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { content?: string };
    if (!data.content) return [];
    const text = atob(data.content.replace(/\s/g, ''));
    return splitMarkdown(text);
  } catch {
    return [];
  }
}

export async function extractRepoSubSections(repo: RepoSnapshot): Promise<Section[]> {
  const domain = collectionOf(repo);
  const md = await fetchReadmeSections(repo.name);
  if (!md.length) {
    // Repli : une sous-section « offres » synthétisée depuis la description du dépôt.
    if (!repo.description && repo.size === 0) return [];
    const f: Fragment = {
      id: `sub:${repo.name}:a-propos`,
      kind: 'text',
      name: repo.name,
      subtitle: `sous-section · ${repo.name}`,
      source: 'text',
      headline: repo.siteTitle || repo.name,
      description: (repo.description || 'Dépôt du domaine ' + domain).slice(0, 160),
      text: { eyebrow: repo.name, title: repo.siteTitle || repo.name, body: repo.description || `Projet du domaine « ${domain} » — ${repo.size} Ko de code source.` },
      collection: domain,
    };
    return [{ fragment: f, domain, role: 'features', source: repo.name, weight: 1 }];
  }
  return md.slice(0, 6).map((s) => {
    const role = roleFromHeading(s.heading);
    const f: Fragment = {
      id: `sub:${repo.name}:${slug(s.heading)}`,
      kind: 'text',
      name: s.heading,
      subtitle: `sous-section · ${repo.name}`,
      source: 'text',
      headline: s.heading,
      description: s.body.slice(0, 160),
      text: { eyebrow: repo.name, title: s.heading, body: s.body.slice(0, 280) },
      collection: domain,
    };
    return { fragment: f, domain, role, source: repo.name, weight: 1 };
  });
}

/** Récolte asynchrone des sous-sections de tous les dépôts (pour le niveau « bloc »). */
export async function harvestSubSections(repos: RepoSnapshot[]): Promise<Section[]> {
  const lists = await Promise.all(repos.map((r) => extractRepoSubSections(r).catch(() => [] as Section[])));
  return lists.flat();
}

/* ----------------------------------------------------------------------------
 * 2) Mémoire générative — rédige le texte de liaison entre les sections d'un
 *    même domaine, à partir des seules métadonnées locales (aucun modèle externe).
 * -------------------------------------------------------------------------- */

export interface LinkBand {
  id: string;
  text: TextContent;
}

export function composeLinks(picks: Section[], domainLabel: string): LinkBand[] {
  const bands: LinkBand[] = [];
  bands.push({
    id: 'intro',
    text: {
      eyebrow: `Mémoire · ${domainLabel}`,
      title: `Une seule continuité, ${picks.length} dépôts.`,
      body: `Ce parcours réunit les sections les plus complémentaires du domaine « ${domainLabel} », chacune puisée dans un dépôt différent pour ne jamais répéter une même voix.`,
    },
  });
  picks.forEach((p, i) => {
    if (i === picks.length - 1) return;
    const next = picks[i + 1];
    bands.push({
      id: `t-${i}`,
      text: {
        eyebrow: `Lien · ${p.source} → ${next.source}`,
        title: `${ROLE_LABEL[p.role]} devient ${ROLE_LABEL[next.role].toLowerCase()}.`,
        body: `On passe de « ${p.fragment.name} » à « ${next.fragment.name} » : la même intention, deux écritures.`,
      },
    });
  });
  bands.push({
    id: 'outro',
    text: {
      eyebrow: 'Suite',
      title: 'Et la page continue.',
      body: 'Chaque section reste éditable, sourcée et réversible. Ouvre la composition pour ajuster l’ordre ou remplacer une source.',
    },
  });
  return bands;
}

/* ----------------------------------------------------------------------------
 * 3) Lien partageable — encode l'assemblage (domaine + identifiants) dans l'URL.
 * -------------------------------------------------------------------------- */

function b64uEncode(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64uDecode<T>(s: string): T | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

export function encodeAssemblage(domain: CollectionId, ids: string[]): string {
  return b64uEncode({ d: domain, ids });
}

export function decodeAssemblage(code: string): { domain: CollectionId; ids: string[] } | null {
  const obj = b64uDecode<{ d: string; ids: string[] }>(code);
  if (obj && typeof obj.d === 'string' && Array.isArray(obj.ids)) return { domain: obj.d as CollectionId, ids: obj.ids };
  return null;
}

/** Recompose des sections à partir d'identifiants (pour ouvrir un lien partagé). */
export function resolveAssembly(ids: string[], repos: RepoSnapshot[]): { domain: CollectionId; picks: Section[] } | null {
  const picks: Section[] = [];
  for (const id of ids) {
    if (id.startsWith('gh:')) {
      const r = repos.find((x) => x.name === id.slice(3));
      if (r) {
        const f = repoToFragment(r);
        picks.push({ fragment: f, domain: collectionOf(r), role: roleOf(f), source: r.name, weight: 2 });
      }
    } else if (id.startsWith('m:')) {
      const f = MEDIA_MAP.get(id);
      if (f) picks.push({ fragment: f, domain: f.collection ?? 'autres', role: roleOf(f), source: f.subtitle || 'média', weight: 2 });
    } else if (id.startsWith('url:') || id.startsWith('yt:')) {
      const f: Fragment = { id, kind: id.startsWith('yt:') ? 'video' : 'site', name: id, subtitle: 'lien', source: 'url' };
      picks.push({ fragment: f, domain: 'autres', role: 'hero', source: 'lien', weight: 1 });
    }
  }
  if (!picks.length) return null;
  return { domain: picks[0].domain, picks };
}

/* ----------------------------------------------------------------------------
 * Projet éditable — intercale les bandes de liaison entre les sections.
 * -------------------------------------------------------------------------- */

const STITCH_THEME: Partial<ProjectTheme> = { background: 'blanc', gap: 0, padding: 0, showLabels: false, reduceMotion: true };

export function buildStitchProject(name: string, picks: Section[], repos: RepoSnapshot[], links: LinkBand[] = []): Project {
  const custom: Fragment[] = [];
  const explicit: string[] = [];
  picks.forEach((p, i) => {
    const id = p.fragment.id;
    if (/^(gh:|m:|url:|yt:)/.test(id)) explicit.push(id);
    else {
      custom.push(p.fragment);
      explicit.push(id);
    }
    const link = links[i];
    if (link) {
      const f = makeTextFragment(link.text);
      custom.push(f);
      explicit.push(f.id);
    }
  });
  const project = createProject({
    name,
    typeId: 'archive',
    layoutId: 'editorial',
    supportId: 'desktop',
    explicit,
    repos,
    theme: STITCH_THEME,
  });
  project.customFragments = [...custom, ...project.customFragments];
  project.cells.forEach((c) => {
    c.settings = { ...c.settings, radius: 0, border: false, shadow: 'aucune', designVariant: 'editorial', hover: 'aucun', animation: 'aucune' };
  });
  return project;
}

export function uidFrag(): string {
  return uid('frag');
}
