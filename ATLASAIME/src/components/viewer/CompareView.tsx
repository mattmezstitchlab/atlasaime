import { useLayoutEffect, useRef, useState } from 'react';
import { ExternalLink, Link2, X } from 'lucide-react';
import type { CatalogItem } from '../../data/catalog';
import { SOURCE_LABEL } from '../../data/catalog';
import { cn } from '../../utils/cn';

type Mode = 'side' | 'slider';
type Cols = 'auto' | 2 | 3 | 4;

function PanelBody({ item, scrollRef, onScroll, widthPx }: {
  item: CatalogItem;
  scrollRef?: (el: HTMLDivElement | null) => void;
  onScroll?: () => void;
  widthPx?: number;
}) {
  const canIframe = item.embed === 'live';
  return (
    <div className="relative min-h-0 flex-1 bg-gray-100">
      {canIframe && item.url ? (
        <iframe
          title={item.name}
          src={item.url}
          className="absolute inset-0 h-full w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      ) : item.poster ? (
        <div ref={scrollRef} onScroll={onScroll} className="absolute inset-0 overflow-auto" style={widthPx ? { width: widthPx } : undefined}>
          <img src={item.poster} alt={item.name} className="block w-full object-cover object-top" />
          {item.embed !== 'live' && (
            <div className="pointer-events-none sticky bottom-0 bg-black/65 px-3 py-1.5 text-[10px] text-white">
              {item.previewLabel ?? (item.embed === 'blocked' ? 'Iframe bloquée · capture statique' : item.embed === 'unknown' ? 'Aperçu statique' : 'Aperçu non interactif')}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-[12px] text-gray-400">Aucun aperçu disponible</div>
      )}
    </div>
  );
}

function Panel({ item, scrollRef, onScroll, widthPx }: {
  item: CatalogItem;
  scrollRef?: (el: HTMLDivElement | null) => void;
  onScroll?: () => void;
  widthPx?: number;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col border-gray-200 lg:border-r last:border-r-0">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-white px-3 py-2">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-gray-900">{item.name}</div>
          <div className="truncate text-[10px] text-gray-400">{item.title}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded bg-black px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">{SOURCE_LABEL[item.source]}</span>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              title="Ouvrir dans un onglet"
              className="rounded-md border border-gray-200 p-1 text-gray-500 transition-colors hover:bg-gray-50 hover:text-black"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
      <PanelBody item={item} scrollRef={scrollRef} onScroll={onScroll} widthPx={widthPx} />
    </div>
  );
}

export function CompareView({ items, onClose }: { items: CatalogItem[]; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('side');
  const [cols, setCols] = useState<Cols>('auto');
  const [sync, setSync] = useState(false);
  const [pos, setPos] = useState(50);
  const canSlider = items.length === 2;

  const bodies = useRef<(HTMLDivElement | null)[]>([]);
  const lock = useRef(false);
  const handleScroll = (idx: number) => {
    if (!sync || lock.current) return;
    const el = bodies.current[idx];
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return;
    const ratio = el.scrollTop / max;
    lock.current = true;
    bodies.current.forEach((other, i) => {
      if (i === idx || !other) return;
      const omax = other.scrollHeight - other.clientHeight;
      if (omax > 0) other.scrollTop = ratio * omax;
    });
    requestAnimationFrame(() => {
      lock.current = false;
    });
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [widthPx, setWidthPx] = useState(0);
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidthPx(el.clientWidth));
    ro.observe(el);
    setWidthPx(el.clientWidth);
    return () => ro.disconnect();
  }, [items.length, mode]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f5f5f7]">
      <header className="flex h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-gray-900">
            {items.length > 1 ? `Comparaison · ${items.length} sites` : 'Aperçu en plein écran'}
          </div>
          <div className="text-[10px] text-gray-400">Sites complets · défilement indépendant</div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {canSlider && (
            <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5">
              <button
                type="button"
                onClick={() => setMode('side')}
                className={cn('rounded-md px-2 py-1 text-[11px] font-medium transition-colors', mode === 'side' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100')}
              >
                Côte à côte
              </button>
              <button
                type="button"
                onClick={() => setMode('slider')}
                className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors', mode === 'slider' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100')}
              >
                <Link2 className="h-3 w-3" /> Avant / Après
              </button>
            </div>
          )}
          {mode === 'side' && (
            <>
              <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5">
                {(['auto', 2, 3, 4] as Cols[]).map((c) => (
                  <button
                    key={String(c)}
                    type="button"
                    onClick={() => setCols(c)}
                    className={cn('rounded-md px-2 py-1 text-[11px] font-medium transition-colors', cols === c ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100')}
                  >
                    {c === 'auto' ? 'Auto' : `${c}`}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSync((v) => !v)}
                title="Synchroniser le défilement entre les panneaux"
                className={cn('rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors', sync ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100')}
              >
                Sync
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <X className="h-3.5 w-3.5" /> Fermer
          </button>
        </div>
      </header>

      {mode === 'slider' && canSlider ? (
        <div ref={containerRef} className="relative min-h-0 flex-1 select-none overflow-hidden bg-gray-900">
          {/* Couche arrière : site B (après) */}
          <div className="absolute inset-0 flex">
            <Panel item={items[1]} widthPx={widthPx} />
          </div>
          {/* Couche avant : site A (avant), recadrée à `pos` % */}
          <div className="absolute inset-y-0 left-0 flex overflow-hidden" style={{ width: `${pos}%` }}>
            <div className="flex h-full" style={{ width: widthPx || '100%' }}>
              <Panel item={items[0]} widthPx={widthPx} />
            </div>
          </div>
          {/* Poignée */}
          <div
            className="absolute inset-y-0 z-10 flex w-1 -translate-x-1/2 cursor-ew-resize items-center justify-center bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"
            style={{ left: `${pos}%` }}
            onPointerDown={(e) => {
              e.preventDefault();
              const move = (ev: PointerEvent) => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                const p = ((ev.clientX - rect.left) / rect.width) * 100;
                setPos(Math.max(0, Math.min(100, p)));
              };
              const up = () => {
                window.removeEventListener('pointermove', move);
                window.removeEventListener('pointerup', up);
              };
              window.addEventListener('pointermove', move);
              window.addEventListener('pointerup', up);
            }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow">
              <Link2 className="h-4 w-4" />
            </span>
          </div>
          <span className="pointer-events-none absolute left-3 top-3 z-10 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">{items[0].name}</span>
          <span className="pointer-events-none absolute right-3 top-3 z-10 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">{items[1].name}</span>
        </div>
      ) : (
        <div
          className={cn(
            'min-h-0 flex-1',
            cols === 'auto' ? 'flex flex-col lg:flex-row' : 'grid grid-cols-1',
            cols === 2 && 'lg:grid-cols-2',
            cols === 3 && 'lg:grid-cols-3',
            cols === 4 && 'lg:grid-cols-4',
          )}
        >
          {items.map((item, i) => (
            <Panel
              key={item.id}
              item={item}
              scrollRef={(el) => {
                bodies.current[i] = el;
              }}
              onScroll={() => handleScroll(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
