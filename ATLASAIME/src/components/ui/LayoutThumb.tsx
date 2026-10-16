import { useId, useMemo } from 'react';
import type { LayoutId, Project } from '../../types';
import { computeGeometry, LAYOUT_MAP, SUPPORT_MAP } from '../../data/layouts';
import { defaultSettings } from '../../data/templates';
import { cn } from '../../utils/cn';

function dummyProject(layoutId: LayoutId): Project {
  const layout = LAYOUT_MAP[layoutId];
  return {
    id: `thumb-${layoutId}`,
    name: '',
    typeId: 'blank',
    layoutId,
    supportId: 'desktop',
    arrangement: 'grille',
    cells: layout.slots.map((_, i) => ({ id: `t${i}`, fragmentId: null, settings: defaultSettings(), rect: layout.free?.[i] })),
    customFragments: [],
    theme: { background: 'blanc', gap: 28, padding: 56, showLabels: false, reduceMotion: true },
    createdAt: 0,
    updatedAt: 0,
  };
}

/** Vignette générée depuis la définition réelle du gabarit (même moteur que le canevas). */
export function LayoutThumb({
  layoutId,
  posters,
  className,
  active,
}: {
  layoutId: LayoutId;
  posters?: (string | undefined)[];
  className?: string;
  active?: boolean;
}) {
  const uid = useId().replace(/:/g, '');
  const geo = useMemo(() => computeGeometry(dummyProject(layoutId), SUPPORT_MAP.desktop), [layoutId]);
  const layout = LAYOUT_MAP[layoutId];
  const W = geo.width;
  const H = geo.height;

  return (
    <div className={cn('relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-white', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {geo.axes.map((a, i) => (
          <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="#a1a1aa" strokeWidth={4} />
        ))}
        {geo.cells.map((c, i) => {
          const poster = posters?.[c.index];
          const r = c.rect;
          return (
            <g key={c.cellId}>
              {c.marker && <circle cx={c.marker.x} cy={c.marker.y} r={12} fill={active ? '#000' : '#71717a'} />}
              {poster ? (
                <>
                  <clipPath id={`${uid}-${i}`}>
                    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={22} />
                  </clipPath>
                  <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={22} fill="#f4f4f5" />
                  <image
                    href={poster}
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    preserveAspectRatio="xMidYMin slice"
                    clipPath={`url(#${uid}-${i})`}
                  />
                  <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={22} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={4} />
                </>
              ) : (
                <rect
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  rx={22}
                  fill={i === 0 ? (active ? '#18181b' : '#d4d4d8') : active ? '#d4d4d8' : '#ececee'}
                  className="transition-colors duration-300"
                />
              )}
            </g>
          );
        })}
        {layout.kind === 'slides' &&
          [0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={W / 2 - 80 + i * 40} cy={H - 26} r={9} fill={i === 0 ? '#000' : '#d4d4d8'} />
          ))}
      </svg>
    </div>
  );
}
