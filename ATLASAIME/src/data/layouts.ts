import { Monitor, Tablet, Smartphone, FileText, Presentation } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Cell, LayoutId, LayoutKind, Project, ProjectTheme, Rect, SupportId } from '../types';

export interface LayoutSlotDef {
  label: string;
  role: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

export interface LayoutDef {
  id: LayoutId;
  name: string;
  description: string;
  kind: LayoutKind;
  cols: number;
  rowHeight: number;
  maxWidth?: number;
  slots: LayoutSlotDef[];
  free?: Rect[];
}

const S = (label: string, role: string, col: number, row: number, colSpan = 1, rowSpan = 1): LayoutSlotDef => ({
  label,
  role,
  col,
  row,
  colSpan,
  rowSpan,
});

export const LAYOUTS: LayoutDef[] = [
  {
    id: 'mosaic', name: 'Mosaïque 2 × 2', description: 'Quatre cellules égales, fusionnables.', kind: 'grid', cols: 2, rowHeight: 320,
    slots: [S('A', 'Cellule', 0, 0), S('B', 'Cellule', 1, 0), S('C', 'Cellule', 0, 1), S('D', 'Cellule', 1, 1)],
  },
  {
    id: 'bento', name: 'Bento', description: 'Une vedette et ses satellites, asymétrique.', kind: 'grid', cols: 4, rowHeight: 210,
    slots: [S('A', 'Vedette', 0, 0, 2, 2), S('B', 'Large', 2, 0, 2, 1), S('C', 'Carré', 2, 1), S('D', 'Haute', 3, 1, 1, 2), S('E', 'Carré', 0, 2), S('F', 'Large', 1, 2, 2, 1)],
  },
  {
    id: 'hero-grid', name: 'Hero + grille', description: 'Un hero plein cadre, trois preuves, un bandeau.', kind: 'grid', cols: 3, rowHeight: 230,
    slots: [S('A', 'Hero', 0, 0, 3, 2), S('B', 'Preuve', 0, 2), S('C', 'Preuve', 1, 2), S('D', 'Preuve', 2, 2), S('E', 'Bandeau', 0, 3, 3, 1)],
  },
  {
    id: 'split', name: 'Split 50 / 50', description: 'Deux moitiés qui dialoguent.', kind: 'grid', cols: 2, rowHeight: 600,
    slots: [S('A', 'Gauche', 0, 0), S('B', 'Droite', 1, 0)],
  },
  {
    id: 'editorial', name: 'Colonne éditoriale', description: 'Une lecture verticale et rythmée.', kind: 'grid', cols: 1, rowHeight: 120, maxWidth: 820,
    slots: [S('A', 'Titre', 0, 0, 1, 2), S('B', 'Média', 0, 2, 1, 4), S('C', 'Texte', 0, 6, 1, 2), S('D', 'Média', 0, 8, 1, 4), S('E', 'Conclusion', 0, 12, 1, 2)],
  },
  {
    id: 'grid3', name: 'Grille 3 colonnes', description: 'Six cartes égales, idéal pour archiver.', kind: 'grid', cols: 3, rowHeight: 270,
    slots: [S('A', 'Carte', 0, 0), S('B', 'Carte', 1, 0), S('C', 'Carte', 2, 0), S('D', 'Carte', 0, 1), S('E', 'Carte', 1, 1), S('F', 'Carte', 2, 1)],
  },
  {
    id: 'masonry', name: 'Mur masonry', description: 'Hauteurs variables, rythme organique.', kind: 'grid', cols: 3, rowHeight: 92,
    slots: [S('A', 'Haute', 0, 0, 1, 3), S('B', 'Très haute', 1, 0, 1, 4), S('C', 'Basse', 2, 0, 1, 2), S('D', 'Très haute', 2, 2, 1, 4), S('E', 'Très haute', 0, 3, 1, 5), S('F', 'Haute', 1, 4, 1, 4), S('G', 'Basse', 2, 6, 1, 2)],
  },
  {
    id: 'timeline', name: 'Frise chronologique', description: 'Des étapes datées sur un axe.', kind: 'timeline', cols: 5, rowHeight: 300,
    slots: [S('1', 'Étape', 0, 0), S('2', 'Étape', 1, 0), S('3', 'Étape', 2, 0), S('4', 'Étape', 3, 0), S('5', 'Étape', 4, 0)],
  },
  {
    id: 'slides', name: 'Diaporama', description: 'Une cellule par diapositive, plein écran.', kind: 'slides', cols: 1, rowHeight: 0,
    slots: [S('1', 'Diapo', 0, 0), S('2', 'Diapo', 0, 0), S('3', 'Diapo', 0, 0), S('4', 'Diapo', 0, 0), S('5', 'Diapo', 0, 0)],
  },
  {
    id: 'sidebar', name: 'Barre latérale', description: 'Navigation fixe et contenu principal.', kind: 'grid', cols: 4, rowHeight: 200,
    slots: [S('A', 'Navigation', 0, 0, 1, 4), S('B', 'Principal', 1, 0, 3, 2), S('C', 'Section', 1, 2, 2, 2), S('D', 'Encart', 3, 2, 1, 2)],
  },
  {
    id: 'filmstrip', name: 'Vedette + bande', description: 'Une image forte et sa pellicule.', kind: 'grid', cols: 4, rowHeight: 170,
    slots: [S('A', 'Vedette', 0, 0, 4, 3), S('B', 'Vignette', 0, 3), S('C', 'Vignette', 1, 3), S('D', 'Vignette', 2, 3), S('E', 'Vignette', 3, 3)],
  },
  {
    id: 'infinite', name: 'Grille infinie', description: 'Grandit sans limite. Chaque case regroupe toutes les fonctionnalités.', kind: 'grid', cols: 3, rowHeight: 460,
    slots: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => S(String(i + 1), 'Fonctions', i % 3, Math.floor(i / 3))),
  },
  {
    id: 'free', name: 'Libre', description: 'Placement au pixel, sans grille.', kind: 'free', cols: 12, rowHeight: 0,
    slots: [S('A', 'Libre', 0, 0), S('B', 'Libre', 0, 0), S('C', 'Libre', 0, 0), S('D', 'Libre', 0, 0)],
    free: [
      { x: 56, y: 56, w: 660, h: 440 },
      { x: 760, y: 120, w: 520, h: 320 },
      { x: 200, y: 540, w: 420, h: 280 },
      { x: 680, y: 480, w: 600, h: 360 },
    ],
  },
];

export const LAYOUT_MAP = Object.fromEntries(LAYOUTS.map((l) => [l.id, l])) as Record<LayoutId, LayoutDef>;

export interface SupportDef {
  id: SupportId;
  name: string;
  detail: string;
  width: number;
  height: number | null;
  device: string;
  icon: LucideIcon;
  factor: number;
}

export const SUPPORTS: SupportDef[] = [
  { id: 'desktop', name: 'Desktop', detail: '1440 × 900', width: 1440, height: null, device: 'MacBook', icon: Monitor, factor: 1 },
  { id: 'tablet', name: 'Tablette', detail: '820 × 1180', width: 820, height: null, device: 'iPad', icon: Tablet, factor: 0.8 },
  { id: 'mobile', name: 'Mobile', detail: '390 × 844', width: 390, height: null, device: 'iPhone 15', icon: Smartphone, factor: 0.55 },
  { id: 'a4', name: 'A4', detail: '210 × 297 mm', width: 794, height: 1123, device: 'Impression', icon: FileText, factor: 0.62 },
  { id: 'slide', name: '16:9', detail: '1920 × 1080', width: 1920, height: 1080, device: 'Écran', icon: Presentation, factor: 1.2 },
];

export const SUPPORT_MAP = Object.fromEntries(SUPPORTS.map((s) => [s.id, s])) as Record<SupportId, SupportDef>;

export const VIEWPORT_HEIGHT: Record<number, number> = { 390: 844, 820: 1180, 1440: 900 };

export function spacing(support: SupportDef, theme: ProjectTheme) {
  const f = support.factor;
  return {
    gap: Math.max(6, Math.round(theme.gap * Math.max(0.6, Math.min(f, 1.2)))),
    padding: Math.max(14, Math.round(theme.padding * f)),
  };
}

export interface PlacedItem {
  cellId: string;
  index: number;
  slot: LayoutSlotDef | null;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

export interface GridResult {
  cols: number;
  rows: number;
  rowHeight: number;
  gap: number;
  padding: number;
  contentWidth: number;
  offsetX: number;
  height: number;
  items: PlacedItem[];
}

/** Empaquetage dense (équivalent grid-auto-flow: dense) avec positions explicites du gabarit. */
export function computeGrid(layout: LayoutDef, cells: Cell[], support: SupportDef, theme: ProjectTheme): GridResult {
  const { gap, padding } = spacing(support, theme);
  const overrides = cells.some((c) => c.settings.colSpan || c.settings.rowSpan);
  let cols = layout.cols;
  let rowHeight = layout.rowHeight;
  let explicit = !overrides;
  if (layout.id === 'infinite') explicit = false;
  if (support.id === 'tablet' && layout.cols > 2) {
    cols = 2;
    rowHeight = Math.round(layout.rowHeight * 0.9);
    explicit = false;
  }
  if (support.id === 'mobile') {
    if (layout.cols > 1) explicit = false;
    cols = 1;
    rowHeight = Math.round(layout.rowHeight * 0.8);
  }
  const maxRowsMobile = Math.max(1, Math.ceil(420 / Math.max(rowHeight, 1)));

  const sized = cells.map((cell, index) => {
    const slot = layout.slots[index] ?? null;
    let colSpan = Math.min(cell.settings.colSpan ?? slot?.colSpan ?? 1, cols);
    let rowSpan = cell.settings.rowSpan ?? slot?.rowSpan ?? 1;
    if (support.id === 'mobile') rowSpan = Math.min(rowSpan, maxRowsMobile);
    if (support.id === 'tablet' && (slot?.colSpan ?? 1) >= 2 && !cell.settings.colSpan) colSpan = cols;
    return { cell, index, slot, colSpan, rowSpan };
  });

  const occ: boolean[][] = [];
  const isFree = (r: number, c: number, w: number, h: number) => {
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (occ[y]?.[x]) return false;
    return true;
  };
  const mark = (r: number, c: number, w: number, h: number) => {
    for (let y = r; y < r + h; y++) {
      occ[y] = occ[y] ?? [];
      for (let x = c; x < c + w; x++) occ[y][x] = true;
    }
  };

  const items: PlacedItem[] = [];
  for (const s of sized) {
    if (!explicit || !s.slot) continue;
    mark(s.slot.row, s.slot.col, s.colSpan, s.rowSpan);
    items.push({ cellId: s.cell.id, index: s.index, slot: s.slot, col: s.slot.col, row: s.slot.row, colSpan: s.colSpan, rowSpan: s.rowSpan });
  }
  for (const s of sized) {
    if (explicit && s.slot) continue;
    let placed = false;
    for (let r = 0; !placed && r < 400; r++) {
      for (let c = 0; c + s.colSpan <= cols; c++) {
        if (isFree(r, c, s.colSpan, s.rowSpan)) {
          mark(r, c, s.colSpan, s.rowSpan);
          items.push({ cellId: s.cell.id, index: s.index, slot: s.slot, col: c, row: r, colSpan: s.colSpan, rowSpan: s.rowSpan });
          placed = true;
          break;
        }
      }
    }
  }
  items.sort((a, b) => a.index - b.index);

  const rows = Math.max(1, ...items.map((i) => i.row + i.rowSpan));
  const inner = support.width - padding * 2;
  const contentWidth = layout.maxWidth ? Math.min(inner, Math.round(layout.maxWidth * Math.max(1, support.width / 1440))) : inner;
  if (support.height) rowHeight = Math.max(28, (support.height - padding * 2 - gap * (rows - 1)) / rows);
  const height = support.height ?? padding * 2 + rows * rowHeight + (rows - 1) * gap;
  return { cols, rows, rowHeight, gap, padding, contentWidth, offsetX: (support.width - contentWidth) / 2, height, items };
}

export function placementRect(g: GridResult, item: PlacedItem): Rect {
  const colW = (g.contentWidth - (g.cols - 1) * g.gap) / g.cols;
  return {
    x: g.offsetX + item.col * (colW + g.gap),
    y: g.padding + item.row * (g.rowHeight + g.gap),
    w: item.colSpan * colW + (item.colSpan - 1) * g.gap,
    h: item.rowSpan * g.rowHeight + (item.rowSpan - 1) * g.gap,
  };
}

export interface CellGeom {
  cellId: string;
  index: number;
  rect: Rect;
  label: string;
  role: string;
  marker?: { x: number; y: number; text: string };
}

export interface Geometry {
  kind: LayoutKind;
  width: number;
  height: number;
  cells: CellGeom[];
  axes: { x1: number; y1: number; x2: number; y2: number }[];
  grid?: GridResult;
}

const slotLabel = (layout: LayoutDef, i: number) => ({
  label: layout.slots[i]?.label ?? (layout.kind === 'grid' ? String.fromCharCode(65 + (i % 26)) : String(i + 1)),
  role: layout.slots[i]?.role ?? 'Cellule',
});

export const cascadeRect = (i: number): Rect => ({ x: 96 + (i % 6) * 48, y: 96 + (i % 6) * 48, w: 420, h: 300 });

/** Échelle uniforme du repère libre (1440 × 1080) vers un support, centrée si la hauteur est contrainte. */
export function freeTransform(support: SupportDef) {
  const k = support.height ? Math.min(support.width / 1440, support.height / 1080) : support.width / 1440;
  return { k, ox: (support.width - 1440 * k) / 2 };
}

export function computeGeometry(
  project: Project,
  support: SupportDef,
  opts: { slideIndex?: number; marker?: (cell: Cell, index: number) => string } = {},
): Geometry {
  const layout = LAYOUT_MAP[project.layoutId];
  const { padding, gap } = spacing(support, project.theme);
  const width = support.width;

  // Libre — coordonnées de référence 1440 × 1080, mises à l'échelle du support
  if (project.arrangement === 'libre' || layout.kind === 'free') {
    const { k, ox } = freeTransform(support);
    const cells = project.cells.map((cell, index) => {
      const base = cell.rect ?? layout.free?.[index] ?? cascadeRect(index);
      return { cellId: cell.id, index, rect: { x: ox + base.x * k, y: base.y * k, w: base.w * k, h: base.h * k }, ...slotLabel(layout, index) };
    });
    const bottom = Math.max(0, ...cells.map((c) => c.rect.y + c.rect.h));
    const height = support.height ?? Math.max(Math.round(width * 0.62), bottom + padding);
    return { kind: 'free', width, height, cells, axes: [] };
  }

  if (layout.kind === 'slides') {
    const height = support.height ?? (support.id === 'mobile' ? 844 : Math.round((width * 9) / 16));
    const idx = Math.min(Math.max(0, opts.slideIndex ?? 0), Math.max(0, project.cells.length - 1));
    const cell = project.cells[idx];
    const cells = cell
      ? [{ cellId: cell.id, index: idx, rect: { x: padding, y: padding, w: width - padding * 2, h: height - padding * 2 }, ...slotLabel(layout, idx) }]
      : [];
    return { kind: 'slides', width, height, cells, axes: [] };
  }

  if (layout.kind === 'timeline') {
    const n = project.cells.length;
    const cells: CellGeom[] = [];
    const axes: Geometry['axes'] = [];
    const marker = (cell: Cell, i: number) => opts.marker?.(cell, i) ?? `Étape ${i + 1}`;
    if (support.id === 'mobile') {
      const axisX = padding + 8;
      let y = padding;
      project.cells.forEach((cell, i) => {
        const h = 250;
        cells.push({ cellId: cell.id, index: i, rect: { x: padding + 30, y: y + 26, w: width - padding * 2 - 30, h }, marker: { x: axisX, y: y + 10, text: marker(cell, i) }, ...slotLabel(layout, i) });
        y += h + 26 + gap + 8;
      });
      axes.push({ x1: axisX, y1: padding, x2: axisX, y2: y - gap });
      return { kind: 'timeline', width, height: support.height ?? y + padding, cells, axes };
    }
    const perRow = support.id === 'tablet' || support.id === 'a4' ? 3 : 5;
    const inner = width - padding * 2;
    const cardW = (inner - gap * (perRow - 1)) / perRow;
    const rowsCount = Math.max(1, Math.ceil(n / perRow));
    const stagger = Math.round(36 * support.factor);
    const head = Math.round(64 * Math.max(0.8, support.factor));
    let cardH = Math.round(layout.rowHeight * Math.max(0.75, support.factor));
    if (support.height) cardH = Math.max(120, (support.height - padding * 2 - rowsCount * (head + stagger) - (rowsCount - 1) * gap) / rowsCount);
    let y = padding;
    for (let r = 0; r < rowsCount; r++) {
      const axisY = y + head * 0.55;
      axes.push({ x1: padding, y1: axisY, x2: width - padding, y2: axisY });
      for (let c = 0; c < perRow; c++) {
        const i = r * perRow + c;
        const cell = project.cells[i];
        if (!cell) break;
        const x = padding + c * (cardW + gap);
        cells.push({
          cellId: cell.id,
          index: i,
          rect: { x, y: y + head + (i % 2) * stagger, w: cardW, h: cardH },
          marker: { x: x + 14, y: axisY, text: marker(cell, i) },
          ...slotLabel(layout, i),
        });
      }
      y += head + stagger + cardH + gap;
    }
    return { kind: 'timeline', width, height: support.height ?? y - gap + padding, cells, axes };
  }

  const grid = computeGrid(layout, project.cells, support, project.theme);
  const cells = grid.items.map((item) => ({
    cellId: item.cellId,
    index: item.index,
    rect: placementRect(grid, item),
    ...slotLabel(layout, item.index),
  }));
  return { kind: 'grid', width, height: grid.height, cells, axes: [], grid };
}

/** Convertit la grille courante en rectangles libres (référence desktop 1440). */
export function gridToFreeRects(project: Project): Record<string, Rect> {
  const geo = computeGeometry({ ...project, arrangement: 'grille' }, SUPPORT_MAP.desktop);
  const out: Record<string, Rect> = {};
  geo.cells.forEach((c) => {
    out[c.cellId] = { x: Math.round(c.rect.x), y: Math.round(c.rect.y), w: Math.round(c.rect.w), h: Math.round(c.rect.h) };
  });
  project.cells.forEach((cell, i) => {
    if (!out[cell.id]) out[cell.id] = cascadeRect(i);
  });
  return out;
}
