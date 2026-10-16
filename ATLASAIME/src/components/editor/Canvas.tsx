import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { MousePointer2, Hand, LayoutGrid, Crop, Smartphone, Spline, Type, ChevronDown, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { AppViewMode, CanvasView, Cell, Fragment, LayoutId, Project, SupportId, ToolMode } from '../../types';
import { LAYOUTS, LAYOUT_MAP, SUPPORTS, SUPPORT_MAP } from '../../data/layouts';
import { Artboard } from './Artboard';
import type { BlockAction } from './BlockMenu';
import { CanvasAgent } from './CanvasAgent';
import type { AgentReply } from './CanvasAgent';
import { SupportsView, GraphView } from './CanvasViews';
import { LayoutThumb } from '../ui/LayoutThumb';
import { Segmented } from '../ui/controls';
import { useElementSize } from '../../hooks/useAtlas';
import { cn } from '../../utils/cn';

export interface CanvasProps {
  project: Project;
  fragments: Map<string, Fragment>;
  mode: AppViewMode;
  view: CanvasView;
  onViewChange: (v: CanvasView) => void;
  tool: ToolMode;
  onToolChange: (t: ToolMode) => void;
  zoom: number;
  onFitChange: (pct: number) => void;
  onZoomBy: (delta: number) => void;
  selectedCellId: string | null;
  onSelectCell: (id: string | null) => void;
  slideIndex: number;
  onSlideChange: (i: number) => void;
  replayKey: number;
  playingAudio: boolean;
  onToggleAudio: () => void;
  onDropFragment: (cellId: string, fragmentId: string) => void;
  onDropNew: (fragmentId: string) => void;
  onSwapCells: (a: string, b: string) => void;
  onUpdateCell: (cellId: string, fn: (c: Cell) => Cell, key?: string) => void;
  onBlockAction: (action: BlockAction, cellId: string) => void;
  remixAvailable: boolean;
  onAgentCommand: (command: string) => Promise<AgentReply>;
  onUndo: () => void;
  canUndo: boolean;
  onSetLayout: (id: LayoutId) => void;
  onSetSupport: (id: SupportId) => void;
  onSetArrangement: (a: 'grille' | 'libre') => void;
  onOpenCrop: () => void;
  onAddText: () => void;
  onAddCell: () => void;
  layoutPickerOpen: boolean;
  onLayoutPicker: (open: boolean) => void;
}

const isTyping = () => {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
};

function Stage({ width, scale, children }: { width: number; scale: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { height } = useElementSize(ref);
  return (
    <div className="relative shrink-0" style={{ width: width * scale, height: height * scale }}>
      <div ref={ref} className="absolute left-0 top-0" style={{ width, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        {children}
      </div>
    </div>
  );
}

export function Canvas(p: CanvasProps) {
  const { project, view, zoom } = p;
  const scrollRef = useRef<HTMLDivElement>(null);
  const size = useElementSize(scrollRef);
  const support = SUPPORT_MAP[project.supportId];
  const layout = LAYOUT_MAP[project.layoutId];
  const scale = zoom / 100;
  const [space, setSpace] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const zoomRef = useRef(p.onZoomBy);
  const fitRef = useRef(p.onFitChange);

  useEffect(() => {
    zoomRef.current = p.onZoomBy;
    fitRef.current = p.onFitChange;
  });

  const contentW = view === 'composition' ? support.width : view === 'supports' ? 1640 : 1220;
  const contentH = view === 'composition' && support.height ? support.height : null;

  useEffect(() => {
    if (!size.width) return;
    const pad = size.width < 640 ? 32 : 120;
    let fit = (size.width - pad) / contentW;
    if (contentH) fit = Math.min(fit, (size.height - (layout.kind === 'slides' ? 230 : 110)) / contentH);
    fitRef.current(Math.max(8, Math.min(100, Math.floor(fit * 100))));
  }, [size.width, size.height, contentW, contentH, layout.kind]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomRef.current(e.deltaY < 0 ? 5 : -5);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping()) {
        e.preventDefault();
        setSpace(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpace(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const panning = p.tool === 'pan' || space;
  const onPanStart = (e: ReactPointerEvent) => {
    const el = scrollRef.current;
    if (!panning || !el) return;
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    const sl = el.scrollLeft;
    const st = el.scrollTop;
    setGrabbing(true);
    const move = (ev: PointerEvent) => {
      el.scrollLeft = sl - (ev.clientX - sx);
      el.scrollTop = st - (ev.clientY - sy);
    };
    const upFn = () => {
      setGrabbing(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', upFn);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', upFn);
  };

  const tools: { id: ToolMode; label: string; key: string; icon: ReactNode; action: () => void }[] = [
    { id: 'select', label: 'Sélection', key: 'V', icon: <MousePointer2 className="h-4 w-4 fill-current" />, action: () => p.onToolChange('select') },
    { id: 'pan', label: 'Main · déplacer la vue', key: 'H', icon: <Hand className="h-4 w-4" />, action: () => p.onToolChange('pan') },
    { id: 'layout', label: 'Changer de composition', key: 'L', icon: <LayoutGrid className="h-4 w-4" />, action: () => p.onLayoutPicker(!p.layoutPickerOpen) },
    { id: 'crop', label: 'Recadrage vivant', key: 'C', icon: <Crop className="h-4 w-4" />, action: p.onOpenCrop },
    { id: 'text', label: 'Ajouter un texte', key: 'T', icon: <Type className="h-4 w-4" />, action: p.onAddText },
  ];

  return (
    <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-canvas-dots">
      {/* En-tête du canevas */}
      <div className="z-20 flex h-11 shrink-0 items-center justify-between gap-2 border-b border-gray-200/80 bg-white/85 px-2 backdrop-blur sm:px-3">
        <div className="hidden min-w-0 items-center gap-2 lg:flex">
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-gray-400">
            Composition · {layout.name}
          </span>
          <span className="font-mono text-[10px] text-gray-300">·</span>
          <span className="truncate font-mono text-[10px] text-gray-400">{project.cells.length} cellules</span>
        </div>
        <Segmented
          value={view}
          onChange={p.onViewChange}
          className="w-[196px] shrink-0 sm:w-[270px]"
          options={[
            { value: 'composition', label: 'Composition' },
            { value: 'supports', label: <><Smartphone className="h-3 w-3" /> Supports</> },
            { value: 'graph', label: <><Spline className="h-3 w-3" /> Graphe</> },
          ]}
        />
        <div className={cn('flex items-center gap-1.5', view !== 'composition' && 'invisible')}>
          <Segmented
            value={project.arrangement === 'libre' || layout.kind === 'free' ? 'libre' : 'grille'}
            onChange={p.onSetArrangement}
            className="hidden w-[118px] md:grid"
            options={[
              { value: 'grille', label: 'Grille' },
              { value: 'libre', label: 'Libre' },
            ]}
          />
          <button
            type="button"
            onClick={() => p.onLayoutPicker(!p.layoutPickerOpen)}
            className="hidden items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:flex"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> <span className="max-w-[110px] truncate">{layout.name}</span> <ChevronDown className="h-3 w-3 text-gray-400" />
          </button>
          <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
            {SUPPORTS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  title={`${s.name} · ${s.detail}`}
                  aria-label={s.name}
                  onClick={() => p.onSetSupport(s.id)}
                  className={cn(
                    'rounded-md p-1 transition-colors',
                    project.supportId === s.id ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-black',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Zone défilable */}
      <div
        ref={scrollRef}
        className={cn('relative flex-1 overflow-auto', panning && (grabbing ? 'cursor-grabbing' : 'cursor-grab'))}
        onPointerDownCapture={onPanStart}
      >
        <div className="flex min-h-full min-w-full w-max flex-col items-center px-4 pb-16 pt-10 sm:px-[60px]">
          {view === 'composition' && (
            <>
              <div className="mb-2.5 flex items-center justify-between gap-4 font-mono text-[11px] text-gray-400" style={{ width: Math.max(200, support.width * scale) }}>
                <span className="truncate">
                  {support.name} · {support.detail}
                </span>
                <span className="truncate">{project.name}</span>
              </div>
              <Stage width={support.width} scale={scale}>
                <Artboard
                  project={project}
                  fragments={p.fragments}
                  mode={p.mode}
                  scale={scale}
                  selectedCellId={p.selectedCellId}
                  slideIndex={p.slideIndex}
                  replayKey={p.replayKey}
                  playingAudio={p.playingAudio}
                  onToggleAudio={p.onToggleAudio}
                  onSelectCell={p.onSelectCell}
                  onDropFragment={p.onDropFragment}
                  onDropNew={p.onDropNew}
                  onSwapCells={p.onSwapCells}
                  onUpdateCell={p.onUpdateCell}
                  onBlockAction={p.onBlockAction}
                  remixAvailable={p.remixAvailable}
                />
              </Stage>
              {layout.kind === 'slides' && project.arrangement === 'grille' && (
                <div className="mt-6 flex max-w-full items-center gap-3">
                  <button
                    type="button"
                    aria-label="Diapositive précédente"
                    onClick={() => p.onSlideChange(Math.max(0, p.slideIndex - 1))}
                    className="rounded-full border border-gray-200 bg-white p-1.5 text-gray-600 shadow-sm hover:text-black"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="no-scrollbar flex gap-2.5 overflow-x-auto p-1">
                    {project.cells.map((c, i) => {
                      const k = 150 / support.width;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            p.onSlideChange(i);
                            p.onSelectCell(c.id);
                          }}
                          className={cn(
                            'relative shrink-0 overflow-hidden rounded-md bg-white ring-1 transition-all hover:-translate-y-0.5',
                            i === p.slideIndex ? 'ring-2 ring-black' : 'ring-gray-200',
                          )}
                          style={{ width: 150, height: (support.height ?? (support.width * 9) / 16) * k }}
                        >
                          <div className="pointer-events-none absolute left-0 top-0" style={{ transform: `scale(${k})`, transformOrigin: '0 0' }}>
                            <Artboard project={project} fragments={p.fragments} mode="present" lite slideIndex={i} />
                          </div>
                          <span className="absolute bottom-1 left-1 rounded bg-black px-1 font-mono text-[9px] text-white">{i + 1}</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={p.onAddCell}
                      className="flex w-[110px] shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 text-[11px] text-gray-500 hover:border-gray-400 hover:text-black"
                    >
                      <Plus className="h-4 w-4" /> Diapositive
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Diapositive suivante"
                    onClick={() => p.onSlideChange(Math.min(project.cells.length - 1, p.slideIndex + 1))}
                    className="rounded-full border border-gray-200 bg-white p-1.5 text-gray-600 shadow-sm hover:text-black"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
          {view === 'supports' && (
            <Stage width={1640} scale={scale}>
              <SupportsView project={project} fragments={p.fragments} />
            </Stage>
          )}
          {view === 'graph' && (
            <Stage width={1220} scale={scale}>
              <GraphView project={project} fragments={p.fragments} selectedCellId={p.selectedCellId} onSelectCell={(id) => p.onSelectCell(id)} />
            </Stage>
          )}
        </div>
      </div>

      {/* Barre d'outils flottante */}
      {p.mode === 'edit' && (
        <div className="absolute left-3 top-[60px] z-20 hidden flex-col items-center rounded-2xl border border-gray-200/90 bg-white/95 p-1 shadow-lg shadow-gray-300/40 backdrop-blur sm:flex">
          {tools.map((t) => {
            const active = (t.id === 'layout' && p.layoutPickerOpen) || (p.tool === t.id && (t.id === 'select' || t.id === 'pan'));
            return (
              <button
                key={t.id}
                type="button"
                onClick={t.action}
                title={`${t.label} (${t.key})`}
                aria-label={t.label}
                className={cn(
                  'my-0.5 flex h-9 w-9 items-center justify-center rounded-xl transition-all',
                  active ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-black',
                )}
              >
                {t.icon}
              </button>
            );
          })}
        </div>
      )}

      {/* Sélecteur de composition */}
      {p.layoutPickerOpen && (
        <>
          <div className="absolute inset-0 z-30" onClick={() => p.onLayoutPicker(false)} />
          <div className="animate-pop absolute left-1/2 top-14 z-40 w-[min(760px,calc(100%-24px))] -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Changer de composition · le contenu est conservé</span>
              <button type="button" aria-label="Fermer" onClick={() => p.onLayoutPicker(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-black">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4">
              {LAYOUTS.map((l) => {
                const active = l.id === project.layoutId;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      p.onSetLayout(l.id);
                      p.onLayoutPicker(false);
                    }}
                    className={cn(
                      'group rounded-xl border p-1.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
                      active ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300',
                    )}
                  >
                    <LayoutThumb layoutId={l.id} active={active} className="bg-gray-50 ring-1 ring-black/5" />
                    <div className="px-1 pt-1.5 text-[11px] font-semibold text-gray-900">{l.name}</div>
                    <div className="truncate px-1 pb-0.5 text-[10px] text-gray-400">{l.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      {p.mode !== 'present' && <CanvasAgent onCommand={p.onAgentCommand} onUndo={p.onUndo} canUndo={p.canUndo} />}
    </main>
  );
}
