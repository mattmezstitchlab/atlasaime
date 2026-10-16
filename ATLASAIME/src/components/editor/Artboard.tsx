import { useState } from 'react';
import type { CSSProperties, DragEvent, PointerEvent as ReactPointerEvent } from 'react';
import { GripVertical, Plus } from 'lucide-react';
import type { AppViewMode, Cell, Fragment, Project } from '../../types';
import { computeGeometry, freeTransform, LAYOUT_MAP, SUPPORT_MAP } from '../../data/layouts';
import type { CellGeom, SupportDef } from '../../data/layouts';
import { formatDate } from '../../data/repos';
import { FragmentView } from './FragmentView';
import { featureGroupsForFragment } from '../../data/catalog';
import { FeatureGroups } from '../viewer/FeatureCell';
import { BlockMenu } from './BlockMenu';
import type { BlockAction } from './BlockMenu';
import { cn } from '../../utils/cn';

export const FRAG_MIME = 'application/x-atlas-fragment';
export const CELL_MIME = 'application/x-atlas-cell';

type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const HANDLES: { h: Handle; style: CSSProperties; cursor: string }[] = [
  { h: 'nw', style: { left: 0, top: 0 }, cursor: 'nwse-resize' },
  { h: 'n', style: { left: '50%', top: 0 }, cursor: 'ns-resize' },
  { h: 'ne', style: { left: '100%', top: 0 }, cursor: 'nesw-resize' },
  { h: 'e', style: { left: '100%', top: '50%' }, cursor: 'ew-resize' },
  { h: 'se', style: { left: '100%', top: '100%' }, cursor: 'nwse-resize' },
  { h: 's', style: { left: '50%', top: '100%' }, cursor: 'ns-resize' },
  { h: 'sw', style: { left: 0, top: '100%' }, cursor: 'nesw-resize' },
  { h: 'w', style: { left: 0, top: '50%' }, cursor: 'ew-resize' },
];

const BACKGROUNDS: Record<Project['theme']['background'], string> = {
  blanc: 'bg-white',
  papier: 'bg-[#f7f5f0]',
  points: 'bg-white bg-dots',
  noir: 'bg-[#0c0c0e]',
};

const SHADOWS = {
  aucune: 'none',
  douce: '0 1px 2px rgba(0,0,0,.05), 0 10px 28px -14px rgba(0,0,0,.22)',
  forte: '0 2px 4px rgba(0,0,0,.06), 0 28px 56px -16px rgba(0,0,0,.38)',
};

export interface ArtboardProps {
  project: Project;
  fragments: Map<string, Fragment>;
  support?: SupportDef;
  mode: AppViewMode;
  lite?: boolean;
  scale?: number;
  selectedCellId?: string | null;
  slideIndex?: number;
  replayKey?: number;
  playingAudio?: boolean;
  onToggleAudio?: () => void;
  onSelectCell?: (id: string | null) => void;
  onDropFragment?: (cellId: string, fragmentId: string) => void;
  onDropNew?: (fragmentId: string) => void;
  onSwapCells?: (from: string, to: string) => void;
  onUpdateCell?: (cellId: string, fn: (c: Cell) => Cell, key?: string) => void;
  onBlockAction?: (action: BlockAction, cellId: string) => void;
  remixAvailable?: boolean;
}

const hasAtlasData = (e: DragEvent) => e.dataTransfer.types.includes(FRAG_MIME) || e.dataTransfer.types.includes(CELL_MIME);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function Artboard(props: ArtboardProps) {
  const { project, fragments, mode, lite, scale = 1, selectedCellId, slideIndex = 0, replayKey = 0 } = props;
  const support = props.support ?? SUPPORT_MAP[project.supportId];
  const layout = LAYOUT_MAP[project.layoutId];
  const editing = mode === 'edit' && !lite;
  const dark = project.theme.background === 'noir';
  const isFree = project.arrangement === 'libre' || layout.kind === 'free';
  const [boardOver, setBoardOver] = useState(false);

  const geo = computeGeometry(project, support, {
    slideIndex,
    marker: (cell, i) => {
      if (cell.label) return cell.label;
      const f = cell.fragmentId ? fragments.get(cell.fragmentId) : undefined;
      return f?.pushedAt ? formatDate(f.pushedAt) : `Étape ${i + 1}`;
    },
  });
  const inv = 1 / (scale || 1);
  const cellById = new Map(project.cells.map((c) => [c.id, c]));

  const startDrag = (e: ReactPointerEvent, g: CellGeom, cell: Cell, handle: Handle | 'move') => {
    if (e.button !== 0) return;
    e.stopPropagation();
    props.onSelectCell?.(cell.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const { k, ox } = freeTransform(support);
    const base = { x: (g.rect.x - ox) / k, y: g.rect.y / k, w: g.rect.w / k, h: g.rect.h / k };
    const placed = geo.grid?.items.find((i) => i.cellId === cell.id);
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      moved = true;
      if (isFree) {
        const ddx = dx / k;
        const ddy = dy / k;
        let { x, y, w, h } = base;
        if (handle === 'move') {
          if (cell.settings.locks.position) return;
          x += ddx;
          y += ddy;
        } else {
          if (cell.settings.locks.size) return;
          if (handle.includes('e')) w = base.w + ddx;
          if (handle.includes('s')) h = base.h + ddy;
          if (handle.includes('w')) {
            w = base.w - ddx;
            x = base.x + ddx;
          }
          if (handle.includes('n')) {
            h = base.h - ddy;
            y = base.y + ddy;
          }
        }
        const snap = (v: number) => Math.round(v / 8) * 8;
        const rect = { x: snap(x), y: Math.max(0, snap(y)), w: Math.max(80, snap(w)), h: Math.max(60, snap(h)) };
        props.onUpdateCell?.(cell.id, (c) => ({ ...c, rect }), `rect:${cell.id}`);
      } else if (geo.grid && placed && handle !== 'move') {
        if (cell.settings.locks.size) return;
        const grid = geo.grid;
        const colW = (grid.contentWidth - (grid.cols - 1) * grid.gap) / grid.cols;
        const dc = handle.includes('e') ? dx : handle.includes('w') ? -dx : 0;
        const dr = handle.includes('s') ? dy : handle.includes('n') ? -dy : 0;
        const colSpan = clamp(placed.colSpan + Math.round(dc / (colW + grid.gap)), 1, grid.cols);
        const rowSpan = clamp(placed.rowSpan + Math.round(dr / (grid.rowHeight + grid.gap)), 1, 16);
        if (colSpan !== placed.colSpan || rowSpan !== placed.rowSpan || cell.settings.colSpan) {
          props.onUpdateCell?.(cell.id, (c) => ({ ...c, settings: { ...c.settings, colSpan, rowSpan } }), `span:${cell.id}`);
        }
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      className={cn('relative overflow-hidden', BACKGROUNDS[project.theme.background], !lite && 'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_20px_60px_-24px_rgba(0,0,0,0.25)]')}
      style={{ width: geo.width, height: geo.height }}
      onPointerDown={editing ? () => props.onSelectCell?.(null) : undefined}
      onDragOver={
        editing
          ? (e) => {
              if (e.dataTransfer.types.includes(FRAG_MIME)) {
                e.preventDefault();
                setBoardOver(true);
              }
            }
          : undefined
      }
      onDragLeave={() => setBoardOver(false)}
      onDrop={
        editing
          ? (e) => {
              setBoardOver(false);
              const fid = e.dataTransfer.getData(FRAG_MIME);
              if (fid) {
                e.preventDefault();
                props.onDropNew?.(fid);
              }
            }
          : undefined
      }
    >
      {/* Axes de frise */}
      {geo.axes.map((a, i) => (
        <div
          key={i}
          className={cn('pointer-events-none absolute', dark ? 'bg-white/25' : 'bg-gray-300')}
          style={{ left: a.x1, top: a.y1, width: Math.max(1, a.x2 - a.x1), height: Math.max(1, a.y2 - a.y1) }}
        />
      ))}
      {geo.cells.map((g) =>
        g.marker ? (
          <div key={`m-${g.cellId}`} className="pointer-events-none absolute" style={{ left: g.marker.x, top: g.marker.y }}>
            <span className={cn('absolute -left-[5px] -top-[5px] h-2.5 w-2.5 rounded-full ring-4', dark ? 'bg-white ring-[#0c0c0e]' : 'bg-black ring-white')} />
            <span
              className={cn(
                'absolute whitespace-nowrap font-mono text-[11px] tracking-tight',
                support.id === 'mobile' ? 'left-4 -top-[7px]' : 'left-0 -top-7',
                dark ? 'text-white/70' : 'text-gray-500',
              )}
            >
              {g.marker.text}
            </span>
          </div>
        ) : null,
      )}

      {geo.cells.map((g) => {
        const cell = cellById.get(g.cellId);
        if (!cell) return null;
        const fragment = cell.fragmentId ? fragments.get(cell.fragmentId) ?? null : null;
        if (!fragment && !editing) return null;
        return (
          <CellFrame
            key={cell.id}
            cell={cell}
            geom={g}
            fragment={fragment}
            props={props}
            editing={editing}
            dark={dark}
            inv={inv}
            selected={selectedCellId === cell.id}
            liftMenu={g.rect.y + g.rect.h > geo.height - 280}
            replayKey={replayKey}
            isFree={isFree}
            onStartDrag={(e, handle) => startDrag(e, g, cell, handle)}
          />
        );
      })}

      {boardOver && (
        <div className="pointer-events-none absolute inset-3 z-0 flex items-end justify-center rounded-xl border-2 border-dashed border-black/30 pb-6">
          <span className="rounded-full bg-black px-3 py-1 text-[11px] font-medium text-white" style={{ transform: `scale(${inv})` }}>
            Déposer pour ajouter une cellule
          </span>
        </div>
      )}
    </div>
  );
}

function CellFrame({
  cell,
  geom,
  fragment,
  props,
  editing,
  dark,
  inv,
  selected,
  replayKey,
  isFree,
  liftMenu,
  onStartDrag,
}: {
  cell: Cell;
  geom: CellGeom;
  fragment: Fragment | null;
  props: ArtboardProps;
  editing: boolean;
  dark: boolean;
  inv: number;
  selected: boolean;
  replayKey: number;
  isFree: boolean;
  liftMenu: boolean;
  onStartDrag: (e: ReactPointerEvent, handle: Handle | 'move') => void;
}) {
  const s = cell.settings;
  const { project, mode, lite } = props;
  const [over, setOver] = useState(false);
  const r = geom.rect;
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animated = !lite && mode !== 'edit' && s.animation !== 'aucune' && !(project.theme.reduceMotion && prefersReduced);
  const hover = !editing && !lite ? (s.hover === 'zoom' ? 'hover:scale-[1.025]' : s.hover === 'lift' ? 'hover:-translate-y-1.5 hover:shadow-2xl' : '') : '';
  const interactive = mode !== 'edit' && !lite && !s.locks.interaction;
  const isText = fragment?.kind === 'text';

  return (
    <div
      className={cn('group/cell absolute', editing && 'cursor-pointer')}
      style={{ left: r.x, top: r.y, width: r.w, height: r.h, zIndex: selected ? 5 : undefined }}
      onDragOver={
        editing
          ? (e) => {
              if (hasAtlasData(e) && !s.locks.content) {
                e.preventDefault();
                e.stopPropagation();
                setOver(true);
              }
            }
          : undefined
      }
      onDragLeave={() => setOver(false)}
      onDrop={
        editing
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              setOver(false);
              const fid = e.dataTransfer.getData(FRAG_MIME);
              const cid = e.dataTransfer.getData(CELL_MIME);
              if (fid) props.onDropFragment?.(cell.id, fid);
              else if (cid && cid !== cell.id) props.onSwapCells?.(cid, cell.id);
            }
          : undefined
      }
    >
      <div
        key={replayKey}
        className={cn('absolute inset-0', animated && `atlas-in-${s.animation}`)}
        style={animated ? { animationDuration: `${s.duration}ms`, animationDelay: `${s.delay + geom.index * 70}ms` } : undefined}
      >
        <div
          className={cn(
            '@container absolute inset-0 transition-[transform,box-shadow] duration-300 ease-out',
            (s.hideOverflow || !fragment) && 'overflow-hidden',
            `atlas-variant-${s.designVariant ?? 'original'}`,
            hover,
          )}
          style={{
            borderRadius: s.radius,
            opacity: s.opacity / 100,
            boxShadow: fragment && !isText ? SHADOWS[s.shadow] : 'none',
            outline: s.border && fragment && !isText ? '1px solid rgba(17,24,39,0.08)' : undefined,
            outlineOffset: -1,
            background: !fragment || isText ? 'transparent' : '#fff',
          }}
        >
          {fragment ? (
            project.layoutId === 'infinite' ? (
              <div className="absolute inset-0 flex flex-col bg-white">
                <div className="relative min-h-0 flex-[1.1]">
                  <FragmentView fragment={fragment} settings={s} interactive={interactive} lite={lite || s.preview !== 'live'} chips={false} dark={dark} playing={props.playingAudio} onTogglePlay={props.onToggleAudio} />
                </div>
                <div className="shrink-0 border-t border-gray-100 bg-white p-2.5">
                  <div className="mb-1.5 truncate text-[12px] font-semibold text-gray-900">{fragment.name}</div>
                  <FeatureGroups groups={featureGroupsForFragment(fragment)} dense />
                </div>
              </div>
            ) : (
              <FragmentView
                fragment={fragment}
                settings={s}
                interactive={interactive}
                lite={lite}
                chips={editing && project.theme.showLabels}
                dark={dark}
                playing={props.playingAudio}
                onTogglePlay={props.onToggleAudio}
              />
            )
          ) : (
            <div
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[inherit] border-[1.5px] border-dashed text-center transition-colors',
                dark ? 'border-white/20 text-white/50' : 'border-gray-300 bg-gray-50/60 text-gray-400',
                over && 'border-black bg-black/5 text-black',
              )}
            >
              <Plus className="h-5 w-5" />
              <span className="px-3 text-[12px] font-medium">Déposez un fragment</span>
              <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                {geom.label} · {geom.role}
              </span>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div
          className={cn(
            'absolute inset-0 z-10 rounded-[inherit]',
            isFree && !s.locks.position ? 'cursor-move' : 'cursor-pointer',
            !selected && 'group-hover/cell:ring-1 group-hover/cell:ring-black/40',
          )}
          style={{ borderRadius: s.radius }}
          onPointerDown={(e) => onStartDrag(e, 'move')}
        />
      )}

      {editing && <BlockMenu
        cell={cell}
        fragment={fragment}
        scale={1 / inv}
        lift={liftMenu}
        remixAvailable={!!props.remixAvailable}
        onOpenChange={() => props.onSelectCell?.(cell.id)}
        onAction={(action, id) => props.onBlockAction?.(action, id)}
      />}

      {editing && selected && (
        <>
          <div
            className="pointer-events-none absolute z-20"
            style={{ inset: -1 * inv, borderRadius: s.radius, boxShadow: `0 0 0 ${1.5 * inv}px #000` }}
          />
          <div
            className="absolute left-0 z-30 flex items-center gap-1"
            onPointerDown={(e) => e.stopPropagation()}
            style={{ bottom: '100%', transform: `translateY(${-6 * inv}px) scale(${inv})`, transformOrigin: 'bottom left' }}
          >
            {fragment && (
              <span
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(CELL_MIME, cell.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                title="Glisser sur une autre cellule pour échanger"
                className="flex cursor-grab items-center rounded bg-black p-0.5 text-white active:cursor-grabbing"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </span>
            )}
            <span className="whitespace-nowrap rounded bg-black px-2 py-0.5 font-mono text-[10px] font-medium text-white shadow-sm">
              {geom.label} · {fragment ? fragment.name : geom.role} · {Math.round(r.w)} × {Math.round(r.h)}
            </span>
          </div>
          {HANDLES.map(({ h, style, cursor }) => (
            <span
              key={h}
              onPointerDown={(e) => onStartDrag(e, h)}
              className="absolute z-30 border border-black bg-white"
              style={{
                ...style,
                width: 8 * inv,
                height: 8 * inv,
                borderWidth: inv,
                transform: 'translate(-50%, -50%)',
                cursor: s.locks.size ? 'not-allowed' : cursor,
              }}
            />
          ))}
        </>
      )}

      {over && fragment && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] border-2 border-dashed border-black bg-white/70 backdrop-blur-[2px]">
          <span className="rounded-full bg-black px-3 py-1 text-[11px] font-medium text-white" style={{ transform: `scale(${inv})` }}>
            Remplacer
          </span>
        </div>
      )}
    </div>
  );
}
