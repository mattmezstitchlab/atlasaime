import type { Fragment, FragmentKind, Project } from '../../types';
import { computeGeometry, SUPPORT_MAP } from '../../data/layouts';
import type { SupportDef } from '../../data/layouts';
import { hostOf, LANG_SHORT } from '../../data/repos';
import { Artboard } from './Artboard';
import { KindIcon } from '../ui/controls';
import { cn } from '../../utils/cn';

/* ---------------- Supports : rendu réel multi-appareils ---------------- */

function DeviceScreen({ project, fragments, support, w, h }: { project: Project; fragments: Map<string, Fragment>; support: SupportDef; w: number; h: number }) {
  const k = w / support.width;
  const p = { ...project, supportId: support.id };
  const geoH = computeGeometry(p, support).height;
  return (
    <div className="no-scrollbar relative overflow-y-auto overflow-x-hidden bg-white" style={{ width: w, height: h }}>
      <div className="relative" style={{ width: w, height: geoH * k }}>
        <div className="absolute left-0 top-0" style={{ transform: `scale(${k})`, transformOrigin: '0 0' }}>
          <Artboard project={p} support={support} fragments={fragments} mode="present" lite />
        </div>
      </div>
    </div>
  );
}

export function SupportsView({ project, fragments }: { project: Project; fragments: Map<string, Fragment> }) {
  return (
    <div className="flex flex-col gap-6 p-8" style={{ width: 1640 }}>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-gray-400">Supports · viewports réels</span>
        <span className="font-mono text-[11px] text-gray-400">Faites défiler chaque écran · même composition, quatre lectures</span>
      </div>
      <div className="flex items-end justify-between gap-10">
        {/* iPhone 15 */}
        <figure className="flex flex-col items-center gap-3">
          <div className="relative rounded-[46px] border-[7px] border-gray-900 bg-gray-900 p-[3px] shadow-2xl">
            <div className="absolute left-1/2 top-3 z-10 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-black" />
            <div className="overflow-hidden rounded-[38px]">
              <DeviceScreen project={project} fragments={fragments} support={SUPPORT_MAP.mobile} w={250} h={541} />
            </div>
            <div className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-black/70" />
          </div>
          <figcaption className="text-[12px] text-gray-500">iPhone 15 · 390 × 844 · interactif</figcaption>
        </figure>

        {/* iPad */}
        <figure className="flex flex-col items-center gap-3">
          <div className="relative rounded-[30px] border-[11px] border-gray-900 bg-gray-900 shadow-2xl">
            <div className="absolute -top-[7px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gray-700" />
            <div className="overflow-hidden rounded-[18px]">
              <DeviceScreen project={project} fragments={fragments} support={SUPPORT_MAP.tablet} w={380} h={547} />
            </div>
          </div>
          <figcaption className="text-[12px] text-gray-500">iPad · 820 × 1180 · aperçu statique</figcaption>
        </figure>

        {/* MacBook */}
        <figure className="flex flex-col items-center gap-0">
          <div className="relative rounded-t-[18px] border-[11px] border-b-[18px] border-gray-900 bg-gray-900 shadow-2xl">
            <div className="absolute -top-[8px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gray-700" />
            <div className="overflow-hidden rounded-[4px]">
              <DeviceScreen project={project} fragments={fragments} support={SUPPORT_MAP.desktop} w={600} h={375} />
            </div>
          </div>
          <div className="relative h-4 w-[700px] rounded-b-[14px] bg-gradient-to-b from-gray-300 to-gray-400 shadow-md">
            <div className="absolute left-1/2 top-0 h-1.5 w-28 -translate-x-1/2 rounded-b-md bg-gray-500/60" />
          </div>
          <figcaption className="mt-3 text-[12px] text-gray-500">MacBook · 1440 × 900 · cadrage actif</figcaption>
        </figure>

        {/* A4 */}
        <figure className="flex flex-col items-center gap-3">
          <div className="rounded-[2px] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.08),0_24px_48px_-20px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
            <DeviceScreen project={project} fragments={fragments} support={SUPPORT_MAP.a4} w={280} h={396} />
          </div>
          <figcaption className="text-[12px] text-gray-500">A4 · 210 × 297 · impression</figcaption>
        </figure>
      </div>
    </div>
  );
}

/* ---------------- Graphe de composants ---------------- */

const PORTS: Record<FragmentKind, { in: string[]; out: string[] }> = {
  site: { in: [], out: [] },
  repo: { in: ['props', 'refresh()'], out: ['onChange(value)', 'onReady()'] },
  audio: { in: ['play(trackId)', 'seek(ms)'], out: ['onEnded()', 'onProgress(ms)'] },
  video: { in: ['play()', 'seek(t)'], out: ['onTimeUpdate(t)', 'onEnded()'] },
  image: { in: ['show()'], out: ['onClick()'] },
  svg: { in: ['morph(shape)'], out: ['onClick()'] },
  model3d: { in: ['rotate(deg)'], out: ['onPick(mesh)'] },
  code: { in: ['play(trackId)', 'seek(ms)'], out: ['onPlay()', 'onPause()'] },
  pdf: { in: ['goto(page)'], out: ['onPage(n)'] },
  calendar: { in: ['highlight(date)'], out: ['onSlot(date)', 'onVote(id)'] },
  timeline: { in: ['seek(year)'], out: ['onSelect(moment)', 'onRangeChange(a,b)'] },
  text: { in: ['setContent(text)'], out: [] },
};

const NW = 300;
const NH = 236;
const GX = 120;
const GY = 64;
const PAD = 40;
const HEAD = 44 + 24;
const ROW = 28;
const LABEL = 18;
const inY = (i: number) => HEAD + LABEL + ROW * i + ROW / 2;
const outY = (i: number) => HEAD + LABEL + ROW * 2 + LABEL + ROW * i + ROW / 2;

export function GraphView({
  project,
  fragments,
  selectedCellId,
  onSelectCell,
}: {
  project: Project;
  fragments: Map<string, Fragment>;
  selectedCellId: string | null;
  onSelectCell: (id: string) => void;
}) {
  const nodes = project.cells
    .map((cell, index) => ({ cell, index, f: cell.fragmentId ? fragments.get(cell.fragmentId) : undefined }))
    .filter((n): n is { cell: typeof n.cell; index: number; f: Fragment } => !!n.f)
    .map((n, i) => ({ ...n, x: PAD + (i % 3) * (NW + GX), y: PAD + 30 + Math.floor(i / 3) * (NH + GY) }));
  const connectable = nodes.filter((n) => n.f.kind !== 'site');
  const edges = connectable.slice(1).map((to, i) => {
    const from = connectable[i];
    const fromPorts = PORTS[from.f.kind];
    return {
      key: `${from.cell.id}-${to.cell.id}`,
      x1: from.x + NW,
      y1: from.y + (fromPorts.out.length ? outY(0) : inY(0)),
      x2: to.x,
      y2: to.y + inY(0),
    };
  });
  const rows = Math.max(1, Math.ceil(nodes.length / 3));
  const height = PAD * 2 + 30 + rows * NH + (rows - 1) * GY;

  return (
    <div className="relative" style={{ width: 1220, height }}>
      <div className="absolute left-10 top-8 flex w-[1140px] items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-gray-400">Mode activer · graphe de composants (préparé, non livré)</span>
        <span className="flex items-center gap-4 font-mono text-[10px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-black" /> connectable
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-gray-400" /> iframe tierce
          </span>
        </span>
      </div>
      <svg className="pointer-events-none absolute inset-0 overflow-visible" width={1220} height={height}>
        {edges.map((e) => (
          <path
            key={e.key}
            d={`M ${e.x1} ${e.y1} C ${e.x1 + 70} ${e.y1}, ${e.x2 - 70} ${e.y2}, ${e.x2} ${e.y2}`}
            fill="none"
            stroke="#111827"
            strokeWidth={1.5}
            markerEnd="url(#atlas-arrow)"
          />
        ))}
        <defs>
          <marker id="atlas-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#111827" />
          </marker>
        </defs>
      </svg>
      {edges.map((e) => (
        <span
          key={`l-${e.key}`}
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-black px-2 py-0.5 font-mono text-[9px] text-white shadow-sm"
          style={{ left: (e.x1 + e.x2) / 2, top: (e.y1 + e.y2) / 2 }}
        >
          événement → action
        </span>
      ))}
      {nodes.map((n) => {
        const external = n.f.kind === 'site';
        const ports = PORTS[n.f.kind];
        const selected = selectedCellId === n.cell.id;
        const badge = external ? 'IFRAME' : n.f.kind === 'repo' || n.f.kind === 'code' ? 'CODE' : 'INTÉGRÉ';
        const meta = external
          ? `${n.f.url ? hostOf(n.f.url) : n.f.name} — origine tierce`
          : n.f.kind === 'repo'
            ? `github/mattmezstitchlab · ${LANG_SHORT[n.f.language ?? ''] ?? n.f.language ?? '—'}`
            : n.f.subtitle;
        return (
          <button
            type="button"
            key={n.cell.id}
            onClick={() => onSelectCell(n.cell.id)}
            className={cn(
              'absolute flex flex-col rounded-xl border bg-white text-left transition-all hover:-translate-y-0.5 hover:shadow-lg',
              external ? 'border-dashed border-gray-300 bg-gray-50/80' : 'border-gray-200 shadow-sm',
              selected && 'border-black ring-1 ring-black',
            )}
            style={{ left: n.x, top: n.y, width: NW, height: NH }}
          >
            <div className="flex h-11 items-center justify-between gap-2 border-b border-gray-100 px-3.5">
              <span className={cn('flex min-w-0 items-center gap-2', external && 'text-gray-500')}>
                <KindIcon kind={n.f.kind} className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate text-[13px] font-semibold">{n.f.name}</span>
              </span>
              <span className={cn('shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px]', external ? 'bg-gray-200/70 text-gray-500' : badge === 'INTÉGRÉ' ? 'bg-black text-white' : 'border border-gray-200 bg-gray-100 text-gray-700')}>
                {n.index + 1} · {badge}
              </span>
            </div>
            <div className="h-6 truncate px-3.5 pt-1.5 font-mono text-[10px] text-gray-400">{meta}</div>
            {external ? (
              <div className="space-y-2 px-3.5 pt-3 text-[11px] text-gray-500">
                <div className="rounded border border-gray-200/70 bg-white/80 px-2 py-1.5 font-mono text-[10px] text-gray-600">
                  {n.f.embed === 'blocked' ? 'CSP : frame-ancestors ’self’ — iframe bloquée' : 'DOM cross-origin : inspection interdite'}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] italic text-gray-400">
                  <span className="flex h-3 w-3 items-center justify-center rounded-full border border-gray-400 text-[8px] not-italic">×</span>
                  non connectable — lien ou capture uniquement
                </div>
              </div>
            ) : (
              <div className="relative flex-1">
                <div className="px-3.5 font-mono text-[9px] uppercase tracking-[0.14em] text-gray-400" style={{ height: LABEL, lineHeight: `${LABEL}px` }}>
                  Entrées
                </div>
                {[0, 1].map((i) => (
                  <div key={`i${i}`} className="relative flex items-center px-3.5 font-mono text-[12px] text-gray-800" style={{ height: ROW }}>
                    {ports.in[i] && (
                      <>
                        <span className={cn('absolute -left-[6px] h-2.5 w-2.5 rounded-full border-2', i === 0 ? 'border-black bg-black' : 'border-gray-400 bg-white')} />
                        <span className={i === 0 ? '' : 'text-gray-500'}>{ports.in[i]}</span>
                      </>
                    )}
                  </div>
                ))}
                <div className="px-3.5 font-mono text-[9px] uppercase tracking-[0.14em] text-gray-400" style={{ height: LABEL, lineHeight: `${LABEL}px` }}>
                  Sorties
                </div>
                {[0, 1].map((i) => (
                  <div key={`o${i}`} className="relative flex items-center px-3.5 font-mono text-[12px] text-gray-800" style={{ height: ROW }}>
                    {ports.out[i] ? (
                      <>
                        <span className={i === 0 ? '' : 'text-gray-500'}>{ports.out[i]}</span>
                        <span className={cn('absolute -right-[6px] h-2.5 w-2.5 rounded-full border-2 bg-white', i === 0 ? 'border-black' : 'border-gray-400')} />
                      </>
                    ) : (
                      i === 0 && <span className="text-[11px] text-gray-300">—</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </button>
        );
      })}
      {nodes.length === 0 && (
        <div className="absolute inset-x-10 top-24 rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400">
          Placez des fragments dans la composition pour générer le graphe.
        </div>
      )}
    </div>
  );
}
