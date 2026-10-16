import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  Globe2,
  FolderGit2,
  Volume2,
  Play,
  Image as ImageIcon,
  Shapes,
  Box,
  Code2,
  FileText,
  Calendar,
  SlidersHorizontal,
  Type,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { FragmentKind } from '../../types';

/* Apparition au défilement (IntersectionObserver, respecte prefers-reduced-motion) */
export function Reveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn('reveal', visible && 'is-visible', className)} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
        checked ? 'bg-black' : 'bg-gray-200',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn('grid gap-0.5 rounded-lg border border-gray-200/80 bg-gray-100/80 p-0.5', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex items-center justify-center gap-1 truncate rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors',
            o.value === value ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:bg-white/80 hover:text-black',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const fill = `${((value - min) / (max - min)) * 100}%`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-gray-500">{label}</span>
        <span className="font-mono text-gray-800">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ '--fill': fill } as CSSProperties}
      />
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  disabled,
  title,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <label
      title={title}
      className={cn(
        'flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50/40 px-2.5 py-1.5 transition-colors focus-within:border-black focus-within:bg-white hover:bg-white',
        disabled && 'opacity-50',
      )}
    >
      <span className="shrink-0 font-mono text-[11px] text-gray-400">{label}</span>
      <input
        type="number"
        value={Math.round(value)}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full min-w-0 bg-transparent text-right font-mono text-xs text-gray-800 outline-none"
      />
    </label>
  );
}

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">{children}</span>
      {action}
    </div>
  );
}

export function GithubMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function AtlasLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[11px] font-bold tracking-tighter text-white">A</span>
      {!compact && <span className="text-xs font-bold tracking-[0.2em] text-black">ATLAS</span>}
    </span>
  );
}

const KIND_ICONS: Record<FragmentKind, typeof Globe2> = {
  site: Globe2,
  repo: FolderGit2,
  audio: Volume2,
  video: Play,
  image: ImageIcon,
  svg: Shapes,
  model3d: Box,
  code: Code2,
  pdf: FileText,
  calendar: Calendar,
  timeline: SlidersHorizontal,
  text: Type,
};

export function KindIcon({ kind, className = 'h-4 w-4' }: { kind: FragmentKind; className?: string }) {
  const Icon = KIND_ICONS[kind];
  return <Icon className={cn(className, kind === 'video' && 'fill-current')} />;
}

export const KIND_LABEL: Record<FragmentKind, string> = {
  site: 'Site',
  repo: 'Code',
  audio: 'Audio',
  video: 'Vidéo',
  image: 'Image',
  svg: 'SVG',
  model3d: '3D',
  code: 'Code',
  pdf: 'PDF',
  calendar: 'Calendrier',
  timeline: 'Timeline',
  text: 'Texte',
};
