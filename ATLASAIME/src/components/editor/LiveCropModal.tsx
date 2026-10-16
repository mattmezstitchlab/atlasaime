import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { X, Crop, Check, Loader2, Lock } from 'lucide-react';
import type { CellSettings, Fragment, Rect, Viewport } from '../../types';
import { VIEWPORT_HEIGHT } from '../../data/layouts';
import { hostOf } from '../../data/repos';
import { useElementSize } from '../../hooks/useAtlas';
import { Toggle } from '../ui/controls';
import { cn } from '../../utils/cn';

type Handle = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const HANDLES: Exclude<Handle, 'move'>[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const HANDLE_POS: Record<Exclude<Handle, 'move'>, [string, string, string]> = {
  nw: ['0%', '0%', 'nwse-resize'],
  n: ['50%', '0%', 'ns-resize'],
  ne: ['100%', '0%', 'nesw-resize'],
  e: ['100%', '50%', 'ew-resize'],
  se: ['100%', '100%', 'nwse-resize'],
  s: ['50%', '100%', 'ns-resize'],
  sw: ['0%', '100%', 'nesw-resize'],
  w: ['0%', '50%', 'ew-resize'],
};

const centered = (vp: number, vpH: number, aspect: number): Rect => {
  let w = Math.round(vp * 0.6);
  let h = Math.round(w / aspect);
  if (h > vpH * 0.8) {
    h = Math.round(vpH * 0.8);
    w = Math.round(h * aspect);
  }
  return { x: Math.round((vp - w) / 2), y: Math.round((vpH - h) / 3), w, h };
};

export function LiveCropModal({
  fragment,
  settings,
  cellAspect,
  onApply,
  onClose,
}: {
  fragment: Fragment;
  settings: CellSettings;
  cellAspect: number;
  onApply: (crop: Rect | null, viewport: Viewport) => void;
  onClose: () => void;
}) {
  const live = fragment.embed === 'live' || fragment.embed === 'unknown';
  const [vp, setVp] = useState<Viewport>(live ? settings.viewport : 1440);
  const vpH = VIEWPORT_HEIGHT[vp] ?? 900;
  const [crop, setCrop] = useState<Rect>(() => settings.crop ?? centered(live ? settings.viewport : 1440, VIEWPORT_HEIGHT[live ? settings.viewport : 1440], cellAspect));
  const [lockRatio, setLockRatio] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const { width: avail } = useElementSize(wrapRef);
  const ps = avail ? Math.min(avail / vp, 380 / vpH) : 0.3;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const changeVp = (v: Viewport) => {
    setVp(v);
    setLoaded(false);
    setCrop(centered(v, VIEWPORT_HEIGHT[v], cellAspect));
  };

  const startModalDrag = (e: ReactPointerEvent) => {
    const sx = e.clientX - off.x;
    const sy = e.clientY - off.y;
    const move = (ev: PointerEvent) => setOff({ x: ev.clientX - sx, y: ev.clientY - sy });
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startCropDrag = (e: ReactPointerEvent, h: Handle) => {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    const base = { ...crop };
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - sx) / ps;
      const dy = (ev.clientY - sy) / ps;
      let { x, y, w, h: hh } = base;
      if (h === 'move') {
        x = Math.min(Math.max(0, base.x + dx), vp - base.w);
        y = Math.min(Math.max(0, base.y + dy), vpH - base.h);
      } else {
        if (h.includes('e')) w = base.w + dx;
        if (h.includes('s')) hh = base.h + dy;
        if (h.includes('w')) {
          w = base.w - dx;
          x = base.x + dx;
        }
        if (h.includes('n')) {
          hh = base.h - dy;
          y = base.y + dy;
        }
        if (lockRatio) hh = w / cellAspect;
        w = Math.max(40, w);
        hh = Math.max(40, hh);
        x = Math.max(0, x);
        y = Math.max(0, y);
        w = Math.min(w, vp - x);
        hh = Math.min(hh, vpH - y);
      }
      setCrop({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(hh) });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onPointerDown={onClose}>
      <div
        role="dialog"
        aria-label="Recadrage vivant"
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute left-1/2 top-1/2 max-h-[calc(100vh-24px)] w-[min(640px,calc(100vw-24px))] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl"
        style={{ transform: `translate(calc(-50% + ${off.x}px), calc(-50% + ${off.y}px))` }}
      >
        <div
          onPointerDown={startModalDrag}
          className="flex cursor-grab items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-2.5 active:cursor-grabbing"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Crop className="h-3.5 w-3.5 shrink-0 text-gray-700" />
            <span className="shrink-0 text-xs font-semibold text-gray-900">Recadrage vivant</span>
            <span className="truncate font-mono text-[10px] text-gray-400">{fragment.url}</span>
          </div>
          <button type="button" aria-label="Fermer" onPointerDown={(e) => e.stopPropagation()} onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-black">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Viewport source</span>
          <div className="flex items-center gap-1">
            {([390, 820, 1440] as Viewport[]).map((v) => (
              <button
                key={v}
                type="button"
                disabled={!live && v !== 1440}
                onClick={() => changeVp(v)}
                className={cn(
                  'rounded-md border px-3 py-1 font-mono text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  vp === v ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-black',
                )}
              >
                {v}
              </button>
            ))}
            <span className="ml-1 rounded-md border border-dashed border-gray-200 px-2.5 py-1 font-mono text-[11px] text-gray-400">{vp} × {vpH}</span>
          </div>
        </div>

        <div ref={wrapRef} className="bg-[#a1a1aa]/30 px-4 py-4">
          <div className="relative mx-auto overflow-hidden rounded-md bg-white ring-1 ring-black/10" style={{ width: vp * ps, height: vpH * ps }}>
            {live ? (
              <iframe
                src={fragment.url}
                title={`Recadrage de ${fragment.name}`}
                sandbox="allow-scripts allow-same-origin"
                onLoad={() => setLoaded(true)}
                className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
                style={{ width: vp, height: vpH, transform: `scale(${ps})` }}
              />
            ) : (
              <img src={fragment.poster} alt="" className="absolute inset-0 h-full w-full object-cover object-top" draggable={false} onLoad={() => setLoaded(true)} />
            )}
            {!loaded && (
              <div className="skeleton absolute inset-0 flex items-center justify-center">
                <span className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 font-mono text-[10px] text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> {fragment.url ? hostOf(fragment.url) : fragment.name}
                </span>
              </div>
            )}
            <div
              onPointerDown={(e) => startCropDrag(e, 'move')}
              className="absolute cursor-move border-[1.5px] border-dashed border-white"
              style={{ left: crop.x * ps, top: crop.y * ps, width: crop.w * ps, height: crop.h * ps, boxShadow: '0 0 0 9999px rgba(17,24,39,0.5)' }}
            >
              <span className="pointer-events-none absolute -top-6 left-0 whitespace-nowrap rounded bg-black px-1.5 py-0.5 font-mono text-[9px] text-white">
                zone {crop.w} × {crop.h}
              </span>
              {HANDLES.map((h) => (
                <span
                  key={h}
                  onPointerDown={(e) => startCropDrag(e, h)}
                  className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 border border-gray-700 bg-white shadow-sm"
                  style={{ left: HANDLE_POS[h][0], top: HANDLE_POS[h][1], cursor: HANDLE_POS[h][2] }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4 py-3">
          <div className="truncate font-mono text-[10px] tracking-tight text-gray-500">
            X {crop.x} · Y {crop.y} · L {crop.w} · H {crop.h} · échelle {settings.scale} % · {lockRatio ? 'ratio de la cellule' : 'ratio libre'} · débordement{' '}
            {settings.hideOverflow ? 'masqué' : 'visible'}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[11px] text-gray-600">
              <Toggle checked={lockRatio} onChange={setLockRatio} label="Verrouiller le ratio" />
              <Lock className="h-3 w-3" /> Ratio de la cellule
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => onApply(null, vp)} className="rounded-md px-2.5 py-1.5 text-[11px] text-gray-500 hover:bg-gray-100 hover:text-black">
                Sans recadrage
              </button>
              <button type="button" onClick={onClose} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setCrop(centered(vp, vpH, cellAspect))}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Ajuster
              </button>
              <button
                type="button"
                onClick={() => onApply(crop, vp)}
                className="flex items-center gap-1.5 rounded-md bg-black px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-gray-800"
              >
                <Check className="h-3.5 w-3.5" /> Utiliser cette zone
              </button>
            </div>
          </div>
          {live && (
            <p className="text-[10px] leading-relaxed text-gray-400">
              Le contenu d’une iframe tierce ne peut pas être défilé à distance : en mode UTILISER, faites défiler la page dans la cellule pour amener le contenu dans la zone.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
