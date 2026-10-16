import { useMemo, useState } from 'react';
import { Search, Star, RefreshCw, Upload, Globe2, Check, Plus, ChevronDown } from 'lucide-react';
import type { CollectionId, Fragment } from '../../types';
import type { RepoSnapshot } from '../../data/repos';
import { COLLECTIONS, GITHUB_USER, collectionOf, repoStats, repoToFragment, timeAgo } from '../../data/repos';
import type { SyncStatus } from '../../hooks/useAtlas';
import { FRAG_MIME } from './Artboard';
import { GithubMark, KindIcon } from '../ui/controls';
import { cn } from '../../utils/cn';

type Filter = 'tous' | 'sites' | 'code' | 'medias' | 'star';

export interface LibraryProps {
  repos: RepoSnapshot[];
  syncStatus: SyncStatus;
  syncedAt: string;
  onSync: () => void;
  mediaFragments: Fragment[];
  customFragments: Fragment[];
  extraFragments?: Fragment[];
  usedIds: Set<string>;
  onPlace: (fragmentId: string) => void;
  onOpenAdd: (tab: 'url' | 'github' | 'upload' | 'text') => void;
  className?: string;
}

function Thumb({ f }: { f: Fragment }) {
  const [failed, setFailed] = useState(false);
  const src = f.kind === 'site' ? f.poster : f.kind === 'image' ? f.url : f.kind === 'video' ? f.poster : undefined;
  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-500 ring-1 ring-black/5 transition-colors group-hover:bg-gray-200/80">
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" draggable={false} onError={() => setFailed(true)} className="h-full w-full object-cover object-top" />
      ) : (
        <KindIcon kind={f.kind} className="h-4 w-4" />
      )}
      {f.kind === 'video' && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
          <KindIcon kind="video" className="h-3 w-3" />
        </span>
      )}
    </span>
  );
}

function Item({ f, used, onPlace }: { f: Fragment; used: boolean; onPlace: (id: string) => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(FRAG_MIME, f.id);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={() => onPlace(f.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlace(f.id);
        }
      }}
      title="Cliquer pour placer · glisser vers une cellule"
      className="group flex w-full cursor-grab items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-black active:cursor-grabbing active:bg-gray-100"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Thumb f={f} />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-medium text-gray-900">{f.name}</span>
            {f.badge && <span className="shrink-0 rounded bg-black px-1 py-px font-mono text-[9px] text-white">{f.badge}</span>}
            {f.embed === 'blocked' && <span className="shrink-0 rounded border border-gray-200 px-1 py-px font-mono text-[9px] text-gray-500">CSP</span>}
          </span>
          <span className="block truncate text-[11px] leading-tight text-gray-400">{f.subtitle}</span>
        </span>
      </span>
      <span
        className={cn('h-1.5 w-1.5 shrink-0 rounded-full transition-transform group-hover:scale-125', used ? 'bg-black' : 'bg-gray-300')}
        title={used ? 'Présent dans la composition' : 'Non utilisé'}
      />
    </div>
  );
}

export function Library(p: LibraryProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('tous');
  const [collection, setCollection] = useState<CollectionId | null>(null);
  const [showEmpty, setShowEmpty] = useState(false);
  const [repoLimit, setRepoLimit] = useState(24);

  const stats = useMemo(() => repoStats(p.repos), [p.repos]);
  const repoFragments = useMemo(
    () => [...p.repos].sort((a, b) => b.pushedAt.localeCompare(a.pushedAt)).map((r) => ({ r, f: repoToFragment(r) })),
    [p.repos],
  );
  const counts = useMemo(() => {
    const c: Partial<Record<CollectionId, number>> = {};
    p.repos.forEach((r) => {
      if (r.size === 0) return;
      const id = collectionOf(r);
      c[id] = (c[id] ?? 0) + 1;
    });
    return c;
  }, [p.repos]);

  const q = query.trim().toLowerCase();
  const match = (f: Fragment) =>
    !q || [f.name, f.subtitle, f.headline, f.description].some((s) => s && s.toLowerCase().includes(q));
  const byFilter = (f: Fragment) => {
    if (filter === 'tous') return true;
    if (filter === 'sites') return f.kind === 'site';
    if (filter === 'code') return f.kind === 'repo' || f.kind === 'code';
    if (filter === 'medias') return ['image', 'video', 'audio', 'svg', 'model3d', 'pdf'].includes(f.kind);
    return !!f.starred || p.usedIds.has(f.id);
  };

  const media = p.mediaFragments.filter((f) => match(f) && byFilter(f) && !collection);
  const custom = [...(p.extraFragments ?? []), ...p.customFragments].filter((f, i, arr) => arr.findIndex((x) => x.id === f.id) === i).filter((f) => match(f) && byFilter(f) && !collection);
  const repoList = repoFragments.filter(
    ({ r, f }) => (showEmpty || r.size > 0) && match(f) && byFilter(f) && (!collection || collectionOf(r) === collection),
  );
  const total = p.repos.length + p.mediaFragments.length + p.customFragments.length;

  return (
    <aside className={cn('flex h-full w-[280px] shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white text-xs', p.className)}>
      <div className="border-b border-gray-100 p-3 pb-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-gray-500">BIBLIOTHÈQUE</span>
          <span className="font-mono text-[11px] text-gray-400">{total}</span>
        </div>
        <div className="relative mb-2.5">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer · nom, tag, source…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2 text-xs text-gray-800 placeholder-gray-400 transition-colors hover:bg-gray-100/70 focus:border-gray-400 focus:bg-white focus:outline-none"
          />
        </div>
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
          {(
            [
              ['tous', 'Tous'],
              ['sites', 'Sites'],
              ['code', 'Code'],
              ['medias', 'Médias'],
              ['star', ''],
            ] as [Filter, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              aria-label={id === 'star' ? 'Favoris et utilisés' : label}
              className={cn(
                'whitespace-nowrap rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors',
                filter === id ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
              )}
            >
              {id === 'star' ? <Star className="h-3 w-3 fill-current" /> : label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-2">
        {media.length > 0 && (
          <section>
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Fragments</div>
            {media.map((f) => (
              <Item key={f.id} f={f} used={p.usedIds.has(f.id)} onPlace={p.onPlace} />
            ))}
          </section>
        )}

        {custom.length > 0 && (
          <section>
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Importés & projet</div>
            {custom.map((f) => (
              <Item key={f.id} f={f} used={p.usedIds.has(f.id)} onPlace={p.onPlace} />
            ))}
          </section>
        )}

        <section>
          <div className="flex items-center justify-between px-2 py-1">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              <GithubMark className="h-3 w-3" /> GitHub · {repoList.length}
            </span>
            <button
              type="button"
              onClick={p.onSync}
              title="Synchroniser avec l’API GitHub"
              className="flex items-center gap-1 rounded px-1 py-0.5 font-mono text-[10px] text-gray-400 hover:bg-gray-100 hover:text-black"
            >
              <RefreshCw className={cn('h-3 w-3', p.syncStatus === 'loading' && 'animate-spin')} />
              {p.syncStatus === 'live' ? `il y a ${timeAgo(p.syncedAt)}` : p.syncStatus === 'error' ? 'hors ligne' : p.syncStatus === 'loading' ? 'sync…' : 'instantané'}
            </button>
          </div>
          {repoList.slice(0, repoLimit).map(({ f }) => (
            <Item key={f.id} f={f} used={p.usedIds.has(f.id)} onPlace={p.onPlace} />
          ))}
          {repoList.length > repoLimit && (
            <button
              type="button"
              onClick={() => setRepoLimit((n) => n + 30)}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-200 py-1.5 text-[11px] text-gray-500 hover:border-gray-300 hover:text-black"
            >
              <ChevronDown className="h-3 w-3" /> Afficher plus ({repoList.length - repoLimit})
            </button>
          )}
          {stats.empty > 0 && (
            <button type="button" onClick={() => setShowEmpty((v) => !v)} className="mt-1 w-full px-2 text-left font-mono text-[10px] text-gray-400 hover:text-black">
              {showEmpty ? 'Masquer' : 'Afficher'} les dépôts vides ({stats.empty})
            </button>
          )}
        </section>

        <section>
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Sources</div>
          <div className="space-y-1.5">
            <a
              href={GITHUB_USER.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <img src={GITHUB_USER.avatarUrl} alt="" className="h-7 w-7 rounded-full ring-1 ring-black/5" />
                <span className="min-w-0">
                  <span className="block text-[12px] font-medium text-gray-900">GitHub</span>
                  <span className="block truncate text-[10px] text-gray-400">@{GITHUB_USER.login} · lecture seule</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-600">
                <Check className="h-3 w-3" /> Connecté
              </span>
            </a>
            <button
              type="button"
              onClick={() => p.onOpenAdd('upload')}
              className="flex w-full items-center gap-2.5 rounded-lg border border-gray-200 p-2 text-left transition-colors hover:bg-gray-50"
            >
              <Upload className="h-4 w-4 shrink-0 text-gray-700" />
              <span className="min-w-0">
                <span className="block text-[12px] font-medium text-gray-900">Imports locaux</span>
                <span className="block truncate text-[10px] text-gray-400">images · vidéo · SVG · PDF</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => p.onOpenAdd('url')}
              className="flex w-full items-center gap-2.5 rounded-lg border border-gray-200 p-2 text-left transition-colors hover:bg-gray-50"
            >
              <Globe2 className="h-4 w-4 shrink-0 text-gray-700" />
              <span className="min-w-0">
                <span className="block text-[12px] font-medium text-gray-900">URLs & iframes</span>
                <span className="block truncate text-[10px] text-gray-400">
                  {stats.live} en ligne · {stats.blocked} CSP · {stats.offline} hors ligne
                </span>
              </span>
            </button>
          </div>
        </section>

        <section className="pb-2">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Collections</div>
          <div className="mt-1 flex flex-wrap gap-1.5 px-1">
            {COLLECTIONS.filter((c) => counts[c.id]).map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.hint}
                onClick={() => setCollection(collection === c.id ? null : c.id)}
                className={cn(
                  'rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
                  collection === c.id ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                )}
              >
                {c.label} <span className="font-mono text-[10px] opacity-60">{counts[c.id]}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => p.onOpenAdd('text')}
              className="flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-2 py-1 text-[11px] text-gray-500 hover:border-gray-400 hover:text-black"
            >
              <Plus className="h-3 w-3" /> Créer
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
