import {
  LayoutDashboard,
  Rocket,
  BookOpen,
  CalendarHeart,
  Palette,
  Presentation,
  Library,
  Archive,
  Link2,
  Newspaper,
  Square,
  AppWindow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  CellSettings,
  Fragment,
  FragmentKind,
  LayoutId,
  Project,
  ProjectTheme,
  ProjectTypeId,
  SupportId,
  TextContent,
} from '../types';
import { LAYOUT_MAP } from './layouts';
import { MEDIA_MAP } from './media';
import { REPO_SNAPSHOT, findRepo, repoToFragment } from './repos';
import type { RepoSnapshot } from './repos';

export interface ProjectTypeDef {
  id: ProjectTypeId;
  name: string;
  description: string;
  sections: string[];
  layout: LayoutId;
  support: SupportId;
  icon: LucideIcon;
}

export const PROJECT_TYPES: ProjectTypeDef[] = [
  { id: 'app', name: 'Application web', description: 'Un vrai parcours produit : accueil, espaces, actions et états.', sections: ['Accueil', 'Espaces', 'Actions', 'Réglages'], layout: 'sidebar', support: 'desktop', icon: AppWindow },
  { id: 'portfolio', name: 'Portfolio', description: 'Vos projets en ligne, mis en scène en cellules vivantes.', sections: ['Hero', 'Projets', 'Systèmes', 'Contact'], layout: 'bento', support: 'desktop', icon: LayoutDashboard },
  { id: 'landing', name: 'Landing page', description: 'Une promesse, des preuves, un appel à l’action.', sections: ['Hero', 'Preuves', 'Démo', 'CTA'], layout: 'hero-grid', support: 'desktop', icon: Rocket },
  { id: 'case-study', name: 'Étude de cas', description: 'Le récit d’un projet : contexte, process, résultat.', sections: ['Contexte', 'Process', 'Supports', 'Résultat'], layout: 'editorial', support: 'desktop', icon: BookOpen },
  { id: 'event', name: 'Événement · Mariage', description: 'Programme, lieux, musique et réponses des invités.', sections: ['Annonce', 'Programme', 'Musique', 'RSVP'], layout: 'timeline', support: 'desktop', icon: CalendarHeart },
  { id: 'moodboard', name: 'Moodboard', description: 'Matières, images, couleurs et sons, en vrac maîtrisé.', sections: ['Matières', 'Couleurs', 'Formes', 'Sons'], layout: 'masonry', support: 'desktop', icon: Palette },
  { id: 'presentation', name: 'Présentation', description: 'Un pitch diapositive par diapositive, en 16:9.', sections: ['Couverture', 'Démos', 'Vision', 'Fin'], layout: 'slides', support: 'slide', icon: Presentation },
  { id: 'docs', name: 'Documentation', description: 'Design system, composants et références.', sections: ['Navigation', 'Fondations', 'Composants'], layout: 'sidebar', support: 'desktop', icon: Library },
  { id: 'archive', name: 'Archive · Mémoire', description: 'Tout garder, tout retrouver : fragments datés et sourcés.', sections: ['Index', 'Fragments', 'Chronologie'], layout: 'grid3', support: 'desktop', icon: Archive },
  { id: 'linkinbio', name: 'Page de liens', description: 'Une colonne mobile, tous vos sites au même endroit.', sections: ['Profil', 'Liens', 'Contact'], layout: 'editorial', support: 'mobile', icon: Link2 },
  { id: 'press', name: 'Dossier de presse', description: 'Une page A4 prête à imprimer ou exporter.', sections: ['Couverture', 'Visuels', 'Contacts'], layout: 'split', support: 'a4', icon: Newspaper },
  { id: 'blank', name: 'Toile vierge', description: 'Composition libre, sans contrainte de grille.', sections: ['Libre'], layout: 'free', support: 'desktop', icon: Square },
];

export const PROJECT_TYPE_MAP = Object.fromEntries(PROJECT_TYPES.map((t) => [t.id, t])) as Record<ProjectTypeId, ProjectTypeDef>;

export const uid = (prefix = 'c') => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export const DEFAULT_THEME: ProjectTheme = { background: 'blanc', gap: 20, padding: 56, showLabels: true, reduceMotion: true };

export function defaultSettings(kind?: FragmentKind): CellSettings {
  return {
    viewport: 1440,
    crop: null,
    scale: 100,
    fit: 'adapter',
    hideOverflow: true,
    preview: 'live',
    opacity: 100,
    radius: 14,
    border: kind !== 'text',
    shadow: kind === 'text' ? 'aucune' : 'douce',
    animation: 'fade',
    hover: kind === 'text' ? 'aucun' : 'lift',
    designVariant: 'original',
    duration: 480,
    delay: 0,
    locks: { position: false, size: false, content: false, crop: false, interaction: false },
  };
}

const siteDesc = (name: string) => {
  const r = findRepo(REPO_SNAPSHOT, name);
  return r?.siteDescription || r?.description || '';
};

/** Textes rédigés à partir des vraies métadonnées de tes sites. */
export const TEXT_TEMPLATES: Record<string, TextContent> = {
  portfolio: { eyebrow: 'Portfolio · @mattmezstitchlab', title: 'Des architectures de continuité.', body: '84 dépôts, 20 sites en ligne — du mariage à la broderie, des outils pour relier les personnes, les moments et les objets.' },
  landing: { eyebrow: 'AIME · byaime.fr', title: 'Organisez votre mariage sereinement.', body: siteDesc('byaime-one-page'), tone: 'sombre' },
  'case-intro': { eyebrow: 'Étude de cas · AIME MÉTAMORPHOSE', title: 'Atelier des fragments.', body: siteDesc('AIME-METAMORPHOSE').replace(/^AIME MÉTAMORPHOSE — /, '') },
  'case-process': { eyebrow: 'Process', title: 'Capturer, recadrer, recomposer.', body: 'Chaque site devient un fragment vivant : un viewport source, une zone isolée, puis une recomposition dans une grille responsive.' },
  'case-result': { eyebrow: 'Résultat', title: 'Une mémoire active, lisible sur tous les supports.', body: 'Mobile 390, tablette 820, desktop 1440 et A4 — une composition, quatre lectures.' },
  cover: { eyebrow: 'AIME EVENT · Vol.07', title: '12 univers. 10 domaines. 5 générations.', body: 'Le programme est le lieu.', align: 'center', tone: 'sombre' },
  closing: { eyebrow: 'Merci', title: 'github.com/mattmezstitchlab', body: '84 dépôts · composés avec ATLAS', align: 'center' },
  'docs-nav': { eyebrow: 'LE MONDE AIME® · Design System', title: 'Fondations', body: 'Couleurs · Typographie · Espacements · Composants · Référence conversationnelle' },
  links: { eyebrow: '@mattmezstitchlab', title: 'Tous mes sites, au même endroit.', body: 'Mariage, broderie, musique et outils — une sélection en ligne.', align: 'center' },
  press: { eyebrow: 'Dossier de presse · 2026', title: 'AIME® — Le Monde Aime', body: siteDesc('AIMELEMONDEAIME') },
  note: { eyebrow: 'Note', title: 'Un nouveau bloc de texte.', body: 'Double-cliquez dans l’inspecteur pour éditer le contenu.' },
};

export const TYPE_FILL: Record<ProjectTypeId, string[]> = {
  app: ['gh:AIMEPROJET', 'gh:POINTZERO', 'gh:AIME-COMPOSER', 'gh:RELIA'],
  portfolio: ['gh:POINTZERO', 't:portfolio', 'gh:ColorCard', 'gh:SILLAGE', 'gh:RELIA', 'gh:lemondeaimedesignsystem', 'gh:AIMEPROJET', 'gh:AIME-METAMORPHOSE'],
  landing: ['gh:byaime-one-page', 'gh:dispoo-app', 'gh:MONMARIAGE', 'gh:RIPPLECIRCLE', 't:landing'],
  'case-study': ['t:case-intro', 'gh:AIME-METAMORPHOSE', 't:case-process', 'gh:AIME-COMPOSER', 't:case-result'],
  event: ['gh:dispoo-app', 'gh:MONMARIAGE', 'gh:RIPPLECIRCLE', 'gh:MINISITEWEDDING', 'gh:radiopink'],
  moodboard: ['m:aiguille', 'gh:ColorCard', 'm:hero-svg', 'm:alliances', 'm:broderie-main', 'm:escarpins', 'm:lecteur-audio'],
  presentation: ['t:cover', 'gh:AIMEEVENT', 'gh:POINTZERO', 'gh:RIPPLECIRCLE', 'gh:SILLAGE', 't:closing'],
  docs: ['t:docs-nav', 'gh:lemondeaimedesignsystem', 'gh:ColorCard', 'm:audioplayer-tsx'],
  archive: ['gh:RELIA', 'gh:AIME-ARCHIVE', 'm:timeline-1972', 'gh:AIMELEMONDEAIME', 'm:dossier-pdf', 'gh:AIME-TIMELINE'],
  linkinbio: ['t:links', 'gh:byaime-one-page', 'gh:SILLAGE', 'gh:dispoo-app', 'gh:WORLDWEDDING'],
  press: ['t:press', 'gh:AIMELEMONDEAIME'],
  blank: [],
};

export const TYPE_LABELS: Partial<Record<ProjectTypeId, string[]>> = {
  event: ['J−60 · Disponibilités', '14:00 · Cérémonie', '16:00 · Programme', '18:00 · Vœux', '21:00 · Soirée radio'],
};

export interface PresetDef {
  id: string;
  name: string;
  description: string;
  typeId: ProjectTypeId;
  layoutId: LayoutId;
  supportId: SupportId;
  fill: string[];
  labels?: string[];
  theme?: Partial<ProjectTheme>;
}

export const PRESETS: PresetDef[] = [
  { id: 'memoire-active', name: 'Mémoire active', description: 'La composition d’origine : lecteur audio, Hero.svg, teaser vidéo et l’atelier des fragments.', typeId: 'archive', layoutId: 'mosaic', supportId: 'desktop', fill: ['m:lecteur-audio', 'm:hero-svg', 'm:teaser-mp4', 'gh:AIME-METAMORPHOSE'], theme: { background: 'points' } },
  { id: 'portfolio-aime', name: 'Portfolio · AIME®', description: 'Tes sites phares en bento : POINTZERO, ColorCard, Sillage, RELIA, design system.', typeId: 'portfolio', layoutId: 'bento', supportId: 'desktop', fill: TYPE_FILL.portfolio },
  { id: 'grand-jour', name: 'Le grand jour', description: 'La frise d’un mariage : disponibilités, cérémonie, programme, vœux, radio.', typeId: 'event', layoutId: 'timeline', supportId: 'desktop', fill: TYPE_FILL.event, labels: TYPE_LABELS.event },
  { id: 'byaime-landing', name: 'Landing · BYAIME', description: 'Hero live byaime-one-page, trois preuves et un bandeau d’appel.', typeId: 'landing', layoutId: 'hero-grid', supportId: 'desktop', fill: TYPE_FILL.landing },
  { id: 'atelier-broderie', name: 'Atelier de broderie', description: 'L’Atelier Universel et BRODEZ en vedette, avec leur pellicule de matières.', typeId: 'moodboard', layoutId: 'filmstrip', supportId: 'desktop', fill: ['gh:UNIVERSALBRODERIE', 'gh:BRODEZ', 'm:aiguille', 'm:broderie-main', 'm:chas'] },
  { id: 'design-system', name: 'Design system', description: 'LE MONDE AIME® : navigation, fondations, ColorCard et composant code.', typeId: 'docs', layoutId: 'sidebar', supportId: 'desktop', fill: TYPE_FILL.docs },
  { id: 'pitch-event', name: 'Pitch · AIME EVENT', description: 'Six diapositives 16:9, de la couverture aux remerciements.', typeId: 'presentation', layoutId: 'slides', supportId: 'slide', fill: TYPE_FILL.presentation },
  { id: 'presse-a4', name: 'Dossier de presse A4', description: 'Le Monde Aime en A4 — iframe bloquée par CSP, donc aperçu statique.', typeId: 'press', layoutId: 'split', supportId: 'a4', fill: TYPE_FILL.press },
  { id: 'liens-mobile', name: 'Page de liens', description: 'Une colonne mobile 390 px avec tes sites en ligne.', typeId: 'linkinbio', layoutId: 'editorial', supportId: 'mobile', fill: TYPE_FILL.linkinbio },
  {
    id: 'grille-infinie',
    name: 'Grille infinie',
    description: 'Chaque case regroupe le statut, l’intégration, le moteur, les visuels et le design system d’un site.',
    typeId: 'archive',
    layoutId: 'infinite',
    supportId: 'desktop',
    fill: ['gh:POINTZERO', 'gh:byaime-one-page', 'gh:SILLAGE', 'gh:dispoo-app', 'gh:RELIA', 'gh:lemondeaimedesignsystem', 'gh:radiopink', 'gh:BRODEZ', 'gh:AIME-COMPOSER', 'gh:ColorCard', 'gh:MONMARIAGE', 'gh:AIMEPROJET'],
  },
];

export function makeTextFragment(text: TextContent): Fragment {
  return {
    id: uid('txt'),
    kind: 'text',
    name: text.title.length > 34 ? `${text.title.slice(0, 32)}…` : text.title,
    subtitle: `texte · ${text.eyebrow ?? 'bloc'}`,
    source: 'text',
    text,
  };
}

const monthLabel = () => new Date().toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

export interface CreateOptions {
  id?: string;
  name?: string;
  typeId: ProjectTypeId;
  layoutId?: LayoutId;
  supportId?: SupportId;
  fill?: 'github' | 'vide';
  selection?: string[];
  explicit?: string[];
  labels?: string[];
  theme?: Partial<ProjectTheme>;
  repos?: RepoSnapshot[];
}

export function createProject(o: CreateOptions): Project {
  const type = PROJECT_TYPE_MAP[o.typeId];
  const layoutId = o.layoutId ?? type.layout;
  const layout = LAYOUT_MAP[layoutId];
  const repos = o.repos ?? REPO_SNAPSHOT;
  const custom: Fragment[] = [];

  const resolve = (key: string): string | null => {
    if (key.startsWith('t:')) {
      const tpl = TEXT_TEMPLATES[key.slice(2)];
      if (!tpl) return null;
      const f = makeTextFragment(tpl);
      custom.push(f);
      return f.id;
    }
    if (key.startsWith('gh:')) return findRepo(repos, key.slice(3)) ? key : null;
    if (key.startsWith('m:')) return MEDIA_MAP.has(key) ? key : null;
    return key;
  };

  let keys: string[];
  if (o.explicit) keys = o.explicit;
  else if (o.fill === 'vide') keys = o.selection ?? [];
  else keys = Array.from(new Set([...(o.selection ?? []), ...TYPE_FILL[o.typeId]]));

  const ids = keys.map(resolve).filter((x): x is string => !!x);
  const infinite = layout.id === 'infinite';
  const flexible = layout.kind === 'slides' || layout.kind === 'timeline' || infinite;
  const capacity = infinite ? Math.max(8, ids.length || 12) : flexible ? Math.max(layout.slots.length, ids.length) : layout.slots.length;

  if (o.fill === 'github' && !o.explicit && ids.length < capacity) {
    const extra = repos
      .filter((r) => r.embed === 'live')
      .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))
      .map((r) => `gh:${r.name}`)
      .filter((id) => !ids.includes(id));
    ids.push(...extra.slice(0, capacity - ids.length));
  }

  const wanted = o.explicit ? ids.length : Math.max(capacity, o.selection?.length ?? 0);
  const count = Math.max(capacity, Math.min(ids.length, wanted));

  const kindOf = (id?: string): FragmentKind | undefined => {
    if (!id) return undefined;
    if (id.startsWith('gh:')) {
      const r = findRepo(repos, id.slice(3));
      return r ? repoToFragment(r).kind : undefined;
    }
    return MEDIA_MAP.get(id)?.kind ?? custom.find((f) => f.id === id)?.kind;
  };

  const now = Date.now();
  const cells = Array.from({ length: count }, (_, i) => ({
    id: uid('cell'),
    fragmentId: ids[i] ?? null,
    settings: { ...defaultSettings(kindOf(ids[i])), ...(layout.id === 'infinite' ? { preview: 'capture' as const } : {}) },
    label: o.labels?.[i],
    rect: layout.kind === 'free' ? layout.free?.[i] : undefined,
  }));

  return {
    id: o.id ?? uid('p'),
    name: o.name ?? `${type.name} — ${monthLabel()}`,
    typeId: o.typeId,
    layoutId,
    supportId: o.supportId ?? type.support,
    arrangement: 'grille',
    cells,
    customFragments: custom,
    theme: { ...DEFAULT_THEME, ...o.theme },
    createdAt: now,
    updatedAt: now,
  };
}

export function createFromPreset(p: PresetDef, repos?: RepoSnapshot[], id?: string): Project {
  return createProject({
    id,
    name: p.name,
    typeId: p.typeId,
    layoutId: p.layoutId,
    supportId: p.supportId,
    explicit: p.fill,
    labels: p.labels,
    theme: p.theme,
    repos,
  });
}

/** Projet d’origine « Mémoire active », tel que dans le design. */
export function seedMemoireActive(): Project {
  const p = createFromPreset(PRESETS[0], undefined, 'memoire-active');
  p.cells[0].settings.locks = { ...p.cells[0].settings.locks, position: true, crop: true };
  p.createdAt = Date.now() - 1000 * 60 * 60 * 26;
  p.updatedAt = Date.now() - 1000 * 60 * 2;
  return p;
}
