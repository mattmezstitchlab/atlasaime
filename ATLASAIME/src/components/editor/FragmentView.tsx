import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Play, Pause, Lock, ShieldAlert, WifiOff, Loader2 } from 'lucide-react';
import type { CellSettings, Fragment } from '../../types';
import { useElementSize } from '../../hooks/useAtlas';
import { VIEWPORT_HEIGHT } from '../../data/layouts';
import { formatDate, formatSize, hostOf, LANG_SHORT, splitTitle } from '../../data/repos';
import { GithubMark } from '../ui/controls';
import { cn } from '../../utils/cn';

export interface FragmentViewProps {
  fragment: Fragment;
  settings: CellSettings;
  interactive: boolean;
  lite?: boolean;
  chips?: boolean;
  dark?: boolean;
  playing?: boolean;
  onTogglePlay?: () => void;
}

export function FragmentView(props: FragmentViewProps) {
  switch (props.fragment.kind) {
    case 'site':
      return <SiteView {...props} />;
    case 'repo':
      return <RepoView {...props} />;
    case 'audio':
      return <AudioView {...props} />;
    case 'video':
      return <VideoView {...props} />;
    case 'image':
      return <ImageView {...props} />;
    case 'svg':
      return <SvgView {...props} />;
    case 'model3d':
      return <ModelView {...props} />;
    case 'code':
      return <CodeView {...props} />;
    case 'pdf':
      return <PdfView {...props} />;
    case 'calendar':
      return <CalendarView {...props} />;
    case 'timeline':
      return <TimelineView {...props} />;
    case 'text':
      return <TextView {...props} />;
  }
}

function Chip({ children, tone = 'dark', className }: { children: ReactNode; tone?: 'dark' | 'light'; className?: string }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute left-2.5 top-2.5 z-[2] inline-flex max-w-[calc(100%-20px)] items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-tight shadow-sm',
        tone === 'dark' ? 'bg-black text-white' : 'bg-white/95 text-gray-800 ring-1 ring-black/5',
        className,
      )}
    >
      {children}
    </span>
  );
}

function Foot({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute bottom-2.5 left-2.5 z-[2] max-w-[calc(100%-20px)] truncate rounded px-1.5 py-0.5 font-mono text-[10px] tracking-tight',
        light ? 'bg-black/50 text-white/80 backdrop-blur-sm' : 'bg-white/90 text-gray-500 ring-1 ring-black/5',
      )}
    >
      {children}
    </span>
  );
}

const fitScale = (s: CellSettings, cw: number, ch: number, w: number, h: number) => {
  const base = s.fit === 'adapter' ? Math.min(cw / w, ch / h) : s.fit === 'remplir' ? Math.max(cw / w, ch / h) : 1;
  return base * (s.scale / 100);
};

/* ---------------- Site web (iframe live / capture réelle) ---------------- */

function Capture({ f, s, cw, ch }: { f: Fragment; s: CellSettings; cw: number; ch: number }) {
  const [src, setSrc] = useState(f.poster);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setSrc(f.poster);
    setReady(false);
  }, [f.poster]);

  let style: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' };
  if (s.crop && s.viewport === 1440 && cw > 0) {
    const k = fitScale(s, cw, ch, s.crop.w, s.crop.h);
    style = {
      position: 'absolute',
      width: 1440 * k,
      height: 900 * k,
      maxWidth: 'none',
      left: (cw - s.crop.w * k) / 2 - s.crop.x * k,
      top: (ch - s.crop.h * k) / 2 - s.crop.y * k,
    };
  }
  return (
    <>
      {!ready && <div className="skeleton absolute inset-0" />}
      {src && (
        <img
          src={src}
          alt={`Capture de ${f.url ? hostOf(f.url) : f.name}`}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setReady(true)}
          onError={() => {
            if (f.fallbackPoster && src !== f.fallbackPoster) setSrc(f.fallbackPoster);
            else setReady(true);
          }}
          style={style}
          className={cn('transition-opacity duration-700', ready ? 'opacity-100' : 'opacity-0')}
        />
      )}
    </>
  );
}

function SiteView({ fragment: f, settings: s, interactive, lite, chips }: FragmentViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { width: cw, height: ch } = useElementSize(ref);
  const [loaded, setLoaded] = useState(false);
  const canLive = f.embed === 'live' || f.embed === 'unknown';
  const live = !lite && s.preview === 'live' && canLive && !!f.url;
  const host = f.url ? hostOf(f.url) : f.name;

  useEffect(() => setLoaded(false), [f.url, s.viewport, live]);

  let frame: ReactNode = null;
  if (live && cw > 0 && ch > 0) {
    const vp = s.viewport;
    const vpH = VIEWPORT_HEIGHT[vp] ?? 900;
    let scale: number;
    let h: number;
    let tx = 0;
    let ty = 0;
    let ox = 0;
    let oy = 0;
    if (s.crop) {
      scale = fitScale(s, cw, ch, s.crop.w, s.crop.h);
      h = vpH;
      tx = -s.crop.x;
      ty = -s.crop.y;
      ox = (cw - s.crop.w * scale) / 2;
      oy = (ch - s.crop.h * scale) / 2;
    } else {
      scale = (s.fit === 'original' ? 1 : cw / vp) * (s.scale / 100);
      h = Math.max(240, ch / scale);
    }
    frame = (
      <iframe
        src={f.url}
        title={f.headline ?? f.name}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        allow="autoplay; encrypted-media; fullscreen; clipboard-write"
        onLoad={() => setLoaded(true)}
        style={{
          position: 'absolute',
          left: ox,
          top: oy,
          width: vp,
          height: h,
          border: 0,
          background: '#fff',
          transform: `scale(${scale}) translate(${tx}px, ${ty}px)`,
          transformOrigin: '0 0',
          pointerEvents: interactive ? 'auto' : 'none',
        }}
      />
    );
  }

  return (
    <div ref={ref} className="absolute inset-0 bg-white">
      {live ? frame : <Capture f={f} s={s} cw={cw} ch={ch} />}
      {live && !loaded && (
        <div className="skeleton absolute inset-0 flex items-center justify-center">
          <span className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 font-mono text-[10px] text-gray-500 shadow-sm">
            <Loader2 className="h-3 w-3 animate-spin" /> {host}
          </span>
        </div>
      )}
      {chips && (
        <>
          {live ? (
            <Chip>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> interactif
            </Chip>
          ) : f.embed === 'blocked' ? (
            <Chip tone="light">
              <ShieldAlert className="h-3 w-3" /> CSP : iframe bloquée
            </Chip>
          ) : f.embed === 'offline' ? (
            <Chip tone="light">
              <WifiOff className="h-3 w-3" /> hors ligne
            </Chip>
          ) : (
            <Chip tone="light">aperçu statique</Chip>
          )}
          <Foot>
            {host}
            {s.crop ? ` · zone ${Math.round(s.crop.w)}×${Math.round(s.crop.h)}` : ` · ${s.viewport}`}
          </Foot>
        </>
      )}
    </div>
  );
}

/* ---------------- Dépôt de code ---------------- */

function RepoView({ fragment: f, chips }: FragmentViewProps) {
  const lang = LANG_SHORT[f.language ?? ''] ?? f.language ?? '—';
  const fallback =
    f.embed === 'offline' && f.url
      ? `Site ${hostOf(f.url)} hors ligne — le dépôt reste consultable.`
      : 'Dépôt de code — aucun site publié pour l’instant.';
  return (
    <div className="absolute inset-0 flex flex-col justify-between bg-[#f5f5f3] p-[clamp(12px,5cqw,28px)] text-gray-900">
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 truncate font-mono text-[10px] uppercase tracking-wider text-gray-400">
          <GithubMark className="h-3 w-3 shrink-0" /> mattmezstitchlab
        </span>
        <span className="shrink-0 rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-[9px] text-gray-600">{lang}</span>
      </div>
      <div className="min-h-0">
        <div className="break-words text-[clamp(15px,7cqw,40px)] font-semibold leading-[1.02] tracking-tight">{f.name}</div>
        <p className="mt-2 line-clamp-3 text-[clamp(10px,2.6cqw,13px)] leading-snug text-gray-500">{f.description || fallback}</p>
      </div>
      <div className="space-y-2">
        <div className="hidden space-y-1 opacity-70 @[220px]:block" aria-hidden="true">
          {[72, 48, 86, 38].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-3 text-right font-mono text-[8px] text-gray-300">{i + 1}</span>
              <span className="h-1 rounded-full bg-gray-300/80" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
        {f.pushedAt && (
          <div className="truncate font-mono text-[10px] text-gray-400">
            poussé le {formatDate(f.pushedAt)} · {formatSize(f.size ?? 0)}
          </div>
        )}
      </div>
      {chips && <Chip className="left-auto right-2.5 top-auto bottom-2.5 hidden">CODE</Chip>}
    </div>
  );
}

/* ---------------- Lecteur audio ---------------- */

const BARS = [4, 8, 12, 6, 14, 10, 16, 8, 12, 15, 7, 11, 14, 9, 5, 12, 8, 13, 6, 10, 4, 9, 13, 7];

function AudioView({ fragment: f, interactive, playing, onTogglePlay, chips }: FragmentViewProps) {
  const { title, tagline } = splitTitle(f.headline ?? '', f.name);
  return (
    <div className="absolute inset-0 flex flex-col justify-between bg-gray-100/80 p-[clamp(12px,4.5cqw,24px)]">
      {chips && (
        <>
          <Chip>
            <span className={cn('h-1.5 w-1.5 rounded-full bg-emerald-400', playing && 'animate-pulse')} /> interactif
          </Chip>
          <Lock className="absolute right-3 top-3 h-3.5 w-3.5 text-gray-400" />
        </>
      )}
      <div />
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!interactive}
            onClick={onTogglePlay}
            aria-label={playing ? 'Mettre en pause' : 'Écouter'}
            className={cn(
              'flex h-[clamp(32px,10cqw,52px)] w-[clamp(32px,10cqw,52px)] shrink-0 items-center justify-center rounded-full transition-colors',
              playing ? 'bg-black text-white' : 'bg-gray-300 text-gray-700',
              interactive && 'hover:bg-black hover:text-white',
            )}
          >
            {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
          </button>
          <div className="min-w-0">
            <div className="truncate text-[clamp(12px,3.6cqw,18px)] font-semibold text-gray-900">{title}</div>
            <div className="truncate text-[clamp(10px,2.6cqw,13px)] text-gray-500">{tagline || f.subtitle}</div>
          </div>
        </div>
        <div className="flex h-[clamp(16px,6cqw,40px)] items-end gap-[2px]">
          {BARS.map((h, i) => (
            <span
              key={i}
              className={cn('flex-1 rounded-full transition-all duration-300', playing ? 'bg-black' : 'bg-gray-300')}
              style={{
                height: `${(playing ? Math.min(16, h * (1 + ((i + Math.round(Date.now() / 400)) % 3) * 0.25)) : h) * 6.25}%`,
                animation: playing ? `atlas-eq ${0.6 + (i % 5) * 0.12}s ease-in-out ${i * 0.04}s infinite alternate` : undefined,
              }}
            />
          ))}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-gray-200">
          <div className={cn('h-full rounded-full bg-black transition-all duration-[1500ms]', playing ? 'w-3/5' : 'w-1/3')} />
        </div>
      </div>
      {chips ? <Foot>{f.url ? hostOf(f.url) : 'soundcloud'} · zone 342×186</Foot> : <div />}
    </div>
  );
}

/* ---------------- Vidéo ---------------- */

function VideoView({ fragment: f, interactive, lite, chips }: FragmentViewProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0.38);
  const yt = f.url?.match(/(?:embed\/|watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/)?.[1];
  if (yt) {
    return (
      <div className="absolute inset-0 bg-black">
        {lite ? (
          <img src={f.poster || `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt={f.name} className="h-full w-full object-cover" draggable={false} />
        ) : (
          <iframe
            title={f.name}
            src={`https://www.youtube-nocookie.com/embed/${yt}`}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ pointerEvents: interactive ? 'auto' : 'none' }}
          />
        )}
        {chips && <Chip tone="light" className="bg-black/70 text-white ring-white/10">YOUTUBE</Chip>}
      </div>
    );
  }
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };
  return (
    <div className="group/video absolute inset-0 bg-[#16171b]">
      {lite || !f.url ? (
        <img src={f.poster} alt="" className="h-full w-full object-cover opacity-80" draggable={false} />
      ) : (
        <video
          ref={ref}
          src={f.url}
          poster={f.poster}
          muted
          loop
          playsInline
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration) setProgress(v.currentTime / v.duration);
          }}
          className="h-full w-full object-cover"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
      {chips && (
        <Chip tone="light" className="bg-black/60 text-white ring-white/10">
          VIDÉO
        </Chip>
      )}
      <button
        type="button"
        disabled={!interactive || lite}
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Lecture'}
        className={cn(
          'absolute left-1/2 top-1/2 flex h-[clamp(36px,12cqw,64px)] w-[clamp(36px,12cqw,64px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-black/30 text-white shadow-lg backdrop-blur-sm transition-all',
          interactive && 'hover:scale-105 hover:border-white hover:bg-black/50',
          playing && 'opacity-0 group-hover/video:opacity-100',
        )}
      >
        {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
      </button>
      <div className="pointer-events-none absolute inset-x-[clamp(10px,4cqw,20px)] bottom-[clamp(10px,4cqw,18px)] h-[3px] overflow-hidden rounded-full bg-white/25">
        <div className="h-full rounded-full bg-white transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
      </div>
      {f.credit && (
        <span className="pointer-events-none absolute right-2.5 top-2.5 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-white/70 opacity-0 transition-opacity group-hover/video:opacity-100">
          © {f.credit}
        </span>
      )}
    </div>
  );
}

/* ---------------- Image ---------------- */

function ImageView({ fragment: f, chips }: FragmentViewProps) {
  const [ready, setReady] = useState(false);
  return (
    <div className="group/img absolute inset-0 bg-gray-100">
      {!ready && <div className="skeleton absolute inset-0" />}
      <img
        src={f.url}
        alt={f.name}
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={() => setReady(true)}
        className={cn('h-full w-full object-cover transition-all duration-700', ready ? 'opacity-100' : 'opacity-0')}
      />
      {chips && <Chip tone="light">IMAGE</Chip>}
      {f.credit && (
        <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded bg-black/45 px-1.5 py-0.5 font-mono text-[9px] text-white/80 opacity-0 backdrop-blur-sm transition-opacity group-hover/img:opacity-100">
          © {f.credit}
        </span>
      )}
    </div>
  );
}

/* ---------------- SVG ---------------- */

function SvgView({ chips }: FragmentViewProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80">
      {chips && <Chip tone="light">SVG</Chip>}
      <svg viewBox="0 0 220 120" className="h-[62%] w-[78%]" aria-label="Hero.svg">
        <circle cx="62" cy="58" r="44" fill="#d4d4d8" />
        <polygon points="152,14 206,106 98,106" fill="#c4c4c9" />
        <rect x="18" y="104" width="64" height="8" rx="4" fill="#d4d4d8" />
      </svg>
      {chips && <Foot>Hero.svg · vectoriel</Foot>}
    </div>
  );
}

/* ---------------- 3D ---------------- */

function ModelView({ chips }: FragmentViewProps) {
  const faces = ['rotateY(0deg)', 'rotateY(90deg)', 'rotateY(180deg)', 'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)'];
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200/70" style={{ perspective: 700 }}>
      {chips && <Chip tone="light">3D · glTF</Chip>}
      <div className="atlas-spin relative h-[clamp(48px,26cqw,140px)] w-[clamp(48px,26cqw,140px)]" style={{ transformStyle: 'preserve-3d' }}>
        {faces.map((t) => (
          <div
            key={t}
            className="absolute inset-0 border border-gray-500/70 bg-white/40"
            style={{ transform: `${t} translateZ(calc(clamp(48px,26cqw,140px) / 2))` }}
          />
        ))}
      </div>
      <div className="absolute bottom-[14%] h-3 w-1/3 rounded-[50%] bg-black/10 blur-sm" />
      {chips && <Foot>Scene.glb · 3 objets</Foot>}
    </div>
  );
}

/* ---------------- Code ---------------- */

const CODE = [
  ['k', 'export function '],
  ['f', 'AudioPlayer'],
  ['p', '({ trackId, autoplay, loop }) {'],
  ['k', '  const '],
  ['p', '[playing, setPlaying] = useState(autoplay);'],
  ['k', '  useMoment'],
  ['p', '((m) => play(m.trackId));'],
  ['k', '  return '],
  ['p', '<Player track={trackId} loop={loop} />;'],
  ['p', '}'],
];

function CodeView({ fragment: f }: FragmentViewProps) {
  const lines: [string, string][][] = [[CODE[0] as [string, string], CODE[1] as [string, string], CODE[2] as [string, string]], [CODE[3] as [string, string], CODE[4] as [string, string]], [CODE[5] as [string, string], CODE[6] as [string, string]], [CODE[7] as [string, string], CODE[8] as [string, string]], [CODE[9] as [string, string]]];
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <span className="truncate font-mono text-[11px] font-medium text-gray-800">{f.name}</span>
        <span className="rounded bg-black px-1.5 py-0.5 font-mono text-[9px] text-white">CODE</span>
      </div>
      <pre className="min-h-0 flex-1 overflow-hidden px-3 py-2.5 font-mono text-[clamp(9px,2.3cqw,12px)] leading-[1.75] text-gray-700">
        {lines.map((parts, i) => (
          <div key={i} className="flex gap-3 whitespace-pre">
            <span className="w-3 select-none text-right text-gray-300">{i + 1}</span>
            <span className="truncate">
              {parts.map(([t, s], j) => (
                <span key={j} className={t === 'k' ? 'text-gray-400' : t === 'f' ? 'font-semibold text-black' : ''}>
                  {s}
                </span>
              ))}
            </span>
          </div>
        ))}
      </pre>
      <div className="border-t border-gray-100 px-3 py-1.5 font-mono text-[10px] text-gray-400">props : trackId · autoplay · loop</div>
    </div>
  );
}

/* ---------------- PDF ---------------- */

function PdfView({ chips }: FragmentViewProps) {
  const Page = ({ className }: { className?: string }) => (
    <div className={cn('absolute aspect-[210/297] h-[78%] rounded-sm bg-white p-[6%] shadow-md ring-1 ring-black/5', className)}>
      <div className="h-[5%] w-2/3 rounded-sm bg-gray-400" />
      <div className="mt-[6%] space-y-[5%]">
        {[100, 92, 96, 70, 100, 84].map((w, i) => (
          <div key={i} className="h-[2.2%] min-h-[2px] rounded-full bg-gray-200" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="mt-[8%] h-[26%] rounded-sm bg-gray-100" />
    </div>
  );
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80">
      {chips && <Chip tone="light">PDF · 12 pages</Chip>}
      <div className="relative h-full w-full">
        <Page className="left-1/2 top-[13%] -translate-x-[38%] rotate-3 opacity-80" />
        <Page className="left-1/2 top-[11%] -translate-x-[62%] -rotate-2" />
      </div>
      {chips && <Foot>Dossier.pdf · A4</Foot>}
    </div>
  );
}

/* ---------------- Calendrier ---------------- */

function CalendarView({ chips }: FragmentViewProps) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const votes = new Set([now.getDate() + 3, now.getDate() + 4, now.getDate() + 10, now.getDate() + 11]);
  return (
    <div className="absolute inset-0 flex flex-col bg-white p-[clamp(10px,4cqw,20px)]">
      {chips && <Chip tone="light">Calendrier</Chip>}
      <div className="mb-2 mt-6 flex items-baseline justify-between">
        <span className="text-[clamp(12px,3.4cqw,16px)] font-semibold capitalize text-gray-900">
          {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </span>
        <span className="font-mono text-[10px] text-gray-400">dispoo · créneaux</span>
      </div>
      <div className="grid flex-1 grid-cols-7 gap-[3px] text-center font-mono text-[clamp(8px,2.2cqw,11px)]">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <span key={i} className="text-gray-400">
            {d}
          </span>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`o${i}`} />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const today = d === now.getDate();
          return (
            <span
              key={d}
              className={cn(
                'flex items-center justify-center rounded',
                today ? 'bg-black text-white' : votes.has(d) ? 'bg-gray-200 text-gray-900' : 'text-gray-500',
              )}
            >
              {d}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Timeline ---------------- */

function TimelineView({ chips }: FragmentViewProps) {
  const years = [1972, 1980, 1990, 2000, 2010, 2020, 2026];
  return (
    <div className="absolute inset-0 flex flex-col justify-center bg-gray-100/80 px-[clamp(12px,5cqw,28px)]">
      {chips && <Chip tone="light">Timeline</Chip>}
      <div className="text-[clamp(12px,3.4cqw,18px)] font-semibold text-gray-900">Timeline 1972</div>
      <div className="mb-4 font-mono text-[10px] text-gray-400">1972 — 2026 · 54 ans</div>
      <div className="relative h-10">
        <div className="absolute inset-x-0 top-1/2 h-px bg-gray-400" />
        {Array.from({ length: 28 }).map((_, i) => (
          <span key={i} className="absolute top-1/2 w-px -translate-y-1/2 bg-gray-400" style={{ left: `${(i / 27) * 100}%`, height: i % 4 === 0 ? 14 : 6 }} />
        ))}
        <span className="absolute left-[38%] right-[30%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-black" />
        <span className="absolute left-[38%] top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-white" />
        <span className="absolute left-[70%] top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-white" />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[clamp(8px,2cqw,10px)] text-gray-400">
        {years.map((y) => (
          <span key={y}>{y}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Texte ---------------- */

function TextView({ fragment: f, dark }: FragmentViewProps) {
  const t = f.text ?? { title: f.name };
  const sombre = t.tone === 'sombre';
  const onDark = sombre || dark;
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col justify-center overflow-hidden p-[clamp(16px,6cqw,56px)]',
        sombre ? 'bg-[#0d0d0f] text-white' : onDark ? 'text-white' : 'text-gray-950',
        t.align === 'center' && 'items-center text-center',
      )}
    >
      {t.eyebrow && (
        <div className={cn('mb-[clamp(6px,2cqw,16px)] font-mono text-[clamp(9px,1.7cqw,12px)] uppercase tracking-[0.18em]', onDark ? 'text-white/50' : 'text-gray-400')}>
          {t.eyebrow}
        </div>
      )}
      <h3 className="font-display text-[clamp(22px,7.6cqw,104px)] leading-[0.98] tracking-[-0.01em]">{t.title}</h3>
      {t.body && (
        <p className={cn('mt-[clamp(8px,2.4cqw,20px)] max-w-[60ch] text-[clamp(11px,2.1cqw,17px)] leading-relaxed', onDark ? 'text-white/60' : 'text-gray-500')}>
          {t.body}
        </p>
      )}
    </div>
  );
}
