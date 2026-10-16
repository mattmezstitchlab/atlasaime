import type { EmbedStatus } from './data/githubSnapshot';

export type ToolMode = 'select' | 'pan' | 'layout' | 'crop' | 'graph' | 'text';
export type AppViewMode = 'edit' | 'use' | 'present';
export type CanvasView = 'composition' | 'supports' | 'graph';

export type FragmentKind =
  | 'site'
  | 'repo'
  | 'audio'
  | 'video'
  | 'image'
  | 'svg'
  | 'model3d'
  | 'code'
  | 'pdf'
  | 'calendar'
  | 'timeline'
  | 'text';

export type CollectionId =
  | 'mariage'
  | 'aime'
  | 'broderie'
  | 'son'
  | 'editorial'
  | 'design'
  | 'outils'
  | 'experimental'
  | 'autres';

export interface TextContent {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: 'left' | 'center';
  tone?: 'clair' | 'sombre';
}

export interface Fragment {
  id: string;
  kind: FragmentKind;
  name: string;
  subtitle: string;
  source: 'github' | 'media' | 'url' | 'upload' | 'text';
  url?: string;
  repo?: string;
  embed?: EmbedStatus | 'unknown';
  language?: string | null;
  headline?: string;
  description?: string;
  pushedAt?: string;
  createdAt?: string;
  size?: number;
  collection?: CollectionId;
  poster?: string;
  fallbackPoster?: string;
  credit?: string;
  badge?: string;
  starred?: boolean;
  text?: TextContent;
}

export type LayoutId =
  | 'mosaic'
  | 'bento'
  | 'hero-grid'
  | 'split'
  | 'editorial'
  | 'grid3'
  | 'masonry'
  | 'timeline'
  | 'slides'
  | 'sidebar'
  | 'filmstrip'
  | 'infinite'
  | 'free';

export type LayoutKind = 'grid' | 'slides' | 'timeline' | 'free';
export type SupportId = 'desktop' | 'tablet' | 'mobile' | 'a4' | 'slide';
export type ProjectTypeId =
  | 'app'
  | 'portfolio'
  | 'landing'
  | 'case-study'
  | 'event'
  | 'moodboard'
  | 'presentation'
  | 'docs'
  | 'archive'
  | 'linkinbio'
  | 'press'
  | 'blank';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Viewport = 390 | 820 | 1440;

export interface CellLocks {
  position: boolean;
  size: boolean;
  content: boolean;
  crop: boolean;
  interaction: boolean;
}

export interface CellSettings {
  viewport: Viewport;
  crop: Rect | null;
  scale: number;
  fit: 'adapter' | 'remplir' | 'original';
  hideOverflow: boolean;
  preview: 'live' | 'capture';
  opacity: number;
  radius: number;
  border: boolean;
  shadow: 'aucune' | 'douce' | 'forte';
  animation: 'aucune' | 'fade' | 'slide' | 'zoom';
  hover: 'aucun' | 'zoom' | 'lift';
  designVariant?: 'original' | 'mono' | 'rose' | 'fuchsia' | 'editorial' | 'noir';
  duration: number;
  delay: number;
  locks: CellLocks;
  colSpan?: number;
  rowSpan?: number;
}

export interface Cell {
  id: string;
  fragmentId: string | null;
  settings: CellSettings;
  rect?: Rect;
  label?: string;
}

export interface ProjectTheme {
  background: 'blanc' | 'papier' | 'points' | 'noir';
  gap: number;
  padding: number;
  showLabels: boolean;
  reduceMotion: boolean;
}

export interface Project {
  id: string;
  name: string;
  typeId: ProjectTypeId;
  layoutId: LayoutId;
  supportId: SupportId;
  arrangement: 'grille' | 'libre';
  cells: Cell[];
  customFragments: Fragment[];
  theme: ProjectTheme;
  createdAt: number;
  updatedAt: number;
}
