import { useMemo, useState } from 'react';
import { ArrowLeft, Check, ExternalLink, LayoutGrid, Library, Plus, Search, X } from 'lucide-react';
import type { Project } from '../../types';
import type { RepoSnapshot } from '../../data/repos';
import { hostOf } from '../../data/repos';
import {
  BASE44_SITE,
  buildCatalog,
  classifyHost,
  featureGroups,
  fragmentFromItem,
  isInLibrary,
  loadExtras,
  loadSavedUrls,
  saveExtra,
  saveUrl,
  SIGNAL_LABEL,
  SOURCE_LABEL,
  youtubeIdFromUrl,
} from '../../data/catalog';
import type { CatalogItem, CatalogSource, Signal } from '../../data/catalog';
import { YOUTUBE_CHANNEL, youtubeEmbed } from '../../data/youtube';
import { systemForRepo } from '../../data/designSystems';
import { AtlasLogo } from '../ui/controls';
import { FeatureCell, FeatureGroups } from './FeatureCell';
import { cn } from '../../utils/cn';
import { WorkspaceNav } from '../ui/WorkspaceNav';

type SourceFilter = 'tout' | CatalogSource;
type SignalFilter = 'tout' | Signal;

const SOURCES: SourceFilter[] = ['tout', 'github', 'youtube', 'base44', 'figma', 'lovable', 'replit', 'url'];
const FILTERS: { id: SignalFilter; label: string }[] = [
  { id: 'tout', label: 'Tout' },
  { id: 'fonctionnel', label: 'Fonctionnel' },
  { id: 'hors-bibliotheque', label: 'Pas dans la bibliothèque' },
  { id: 'moteur', label: 'Moteurs' },
  { id: 'visuel', label: 'Visuels' },
  { id: 'design-system', label: 'Design systems' },
  { id: 'hors-ligne', label: 'Hors ligne' },
  { id: 'non-place', label: 'Non placés' },
];

export function Visionneuse({
  repos,
  projects,
  onBack,
  onOpenSystems,
  onOpenDesk,
  onCompose,
}: {
  repos: RepoSnapshot[];
  projects: Project[];
  onBack: () => void;
  onOpenSystems: (id?: string) => void;
  onOpenDesk: () => void;
  onCompose: (ids: string[]) => void;
}) {
  const [extras, setExtras] = useState(() => loadExtras());
  const [urls, setUrls] = useState(() => loadSavedUrls());
  const [source, setSource] = useState<SourceFilter>('tout');
  const [signal, setSignal] = useState<SignalFilter>('tout');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [limit, setLimit] = useState(24);

  const items = useMemo(() => buildCatalog(repos, projects, extras, urls), [repos, projects, extras, urls]);
  const counts = useMemo(() => {
    const c: Partial<Record<CatalogSource, number>> = {};
    items.forEach((i) => {
      c[i.source] = (c[i.source] ?? 0) + 1;
    });
    return c;
  }, [items]);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((i) => {
      if (source !== 'tout' && i.source !== source) return false;
      if (signal !== 'tout' && !i.signals.includes(signal)) return false;
      if (query && !`${i.name} ${i.title} ${i.description} ${i.repo ?? ''}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [items, source, signal, q]);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const stats = {
    total: items.length,
    live: items.filter((i) => i.signals.includes('fonctionnel')).length,
    missing: items.filter((i) => i.signals.includes('hors-bibliotheque')).length,
    engines: items.filter((i) => i.signals.includes('moteur')).length,
    systems: items.filter((i) => i.signals.includes('design-system')).length,
  };

  const flash = (m: string) => {
    setNotice(m);
    window.setTimeout(() => setNotice(null), 2400);
  };

  const addUrl = () => {
    const raw = draft.trim();
    if (!raw) return;
    let url = raw;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
      const u = new URL(url);
      const entry = { url: u.href, name: hostOf(u.href), addedAt: Date.now() };
      setUrls(saveUrl(entry));
      setDraft('');
      setSource(classifyHost(u.href));
      setSelectedId(`url:${encodeURIComponent(u.href)}`);
      flash(`« ${hostOf(u.href)} » ajouté · classé ${SOURCE_LABEL[classifyHost(u.href)]}`);
    } catch {
      flash('Adresse invalide');
    }
  };

  const importItem = (item: CatalogItem) => {
    const f = fragmentFromItem(item);
    if (item.source === 'url' || item.id.startsWith('url:')) f.id = item.fragmentId;
    setExtras(saveExtra(f));
    flash(`« ${item.name} » ajouté à la bibliothèque`);
  };

  const togglePick = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f5f7] text-gray-900">
      <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onBack} className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-black" aria-label="Retour">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <AtlasLogo compact />
          <div className="min-w-0">
            <div className="hidden text-[13px] font-semibold sm:block">Visionneuse</div>
            <div className="hidden truncate font-mono text-[10px] text-gray-400 sm:block">
              GitHub · YouTube · Base44 · Figma · Lovable · Replit
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block"><WorkspaceNav active="viewer" onNavigate={(page) => {
            if (page === 'home') onBack();
            else if (page === 'systems') onOpenSystems();
            else if (page === 'desk') onOpenDesk();
          }} /></div>
          <div className="md:hidden"><WorkspaceNav compact active="viewer" onNavigate={(page) => {
            if (page === 'home') onBack();
            else if (page === 'systems') onOpenSystems();
            else if (page === 'desk') onOpenDesk();
          }} /></div>
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={() => onCompose(picked.map((id) => items.find((i) => i.id === id)?.fragmentId ?? id))}
            className="flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-[12px] font-medium text-white hover:bg-gray-800 disabled:opacity-40"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Grille infinie{picked.length ? ` · ${picked.length}` : ''}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-wrap gap-6">
              {[
                [stats.total, 'éléments vus'],
                [stats.live, 'fonctionnels'],
                [stats.missing, 'hors bibliothèque'],
                [stats.engines, 'moteurs'],
                [stats.systems, 'design systems'],
              ].map(([n, l]) => (
                <div key={String(l)}>
                  <div className="font-display text-3xl leading-none">{n}</div>
                  <div className="mt-1 text-[11px] text-gray-500">{l}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 max-w-3xl text-[12px] leading-relaxed text-gray-500">
              GitHub est synchronisé ({repos.length} dépôts). YouTube : les {YOUTUBE_CHANNEL.note.toLowerCase()} Base44 : {BASE44_SITE.url.replace('https://', '')} répond, iframe refusée. Figma, Lovable et Replit : aucun projet public trouvé — collez une adresse pour les ajouter.
            </p>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addUrl();
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Coller une URL · site, Figma, Lovable, Replit, Base44, YouTube…"
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-black focus:bg-white"
              />
              <button type="submit" className="flex items-center gap-1 rounded-xl bg-black px-3.5 py-2 text-[12px] font-medium text-white hover:bg-gray-800">
                <Plus className="h-3.5 w-3.5" /> Voir
              </button>
            </form>
          </div>

          <div className="sticky top-0 z-10 border-b border-gray-200/80 bg-[#f5f5f7]/90 px-4 py-2.5 backdrop-blur sm:px-6">
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-2">
              {SOURCES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSource(s);
                    setLimit(24);
                  }}
                  className={cn('whitespace-nowrap rounded-full border px-3 py-1 text-[12px] font-medium', source === s ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300')}
                >
                  {s === 'tout' ? 'Toutes les sources' : SOURCE_LABEL[s]}
                  {s !== 'tout' && <span className="ml-1 font-mono text-[10px] opacity-60">{counts[s] ?? 0}</span>}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSignal(f.id)}
                  className={cn('rounded-md px-2 py-1 text-[11px] font-medium', signal === f.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-white hover:text-black')}
                >
                  {f.label}
                </button>
              ))}
              <div className="relative ml-auto min-w-[160px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer…" className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-2 text-[12px] outline-none focus:border-black" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3 2xl:grid-cols-4">
            {shown.slice(0, limit).map((item) => (
              <div key={item.id} className="relative">
                <FeatureCell item={item} groups={featureGroups(item)} selected={selectedId === item.id || picked.includes(item.id)} onSelect={() => setSelectedId(item.id)} />
                <button
                  type="button"
                  aria-label={picked.includes(item.id) ? 'Retirer de la grille' : 'Ajouter à la grille infinie'}
                  onClick={() => togglePick(item.id)}
                  className={cn(
                    'absolute right-3 top-[42%] z-10 flex h-6 w-6 items-center justify-center rounded-md border shadow-sm',
                    picked.includes(item.id) ? 'border-black bg-black text-white' : 'border-gray-300 bg-white text-transparent hover:text-gray-400',
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          {shown.length === 0 && <p className="px-6 pb-16 text-sm text-gray-400">Rien dans ce filtre. Collez une URL pour élargir la visionneuse.</p>}
          {shown.length > limit && (
            <div className="flex justify-center pb-16">
              <button type="button" onClick={() => setLimit((n) => n + 24)} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium hover:border-gray-300">
                Afficher la suite · {shown.length - limit}
              </button>
            </div>
          )}
        </div>

        {selected && (
          <aside className="hidden w-[380px] shrink-0 flex-col overflow-y-auto border-l border-gray-200 bg-white lg:flex">
            <Detail
              item={selected}
              inLibrary={isInLibrary(selected.fragmentId, extras)}
              onClose={() => setSelectedId(null)}
              onImport={() => importItem(selected)}
              onCompose={() => onCompose([selected.fragmentId])}
              onSystems={() => selected.repo && systemForRepo(selected.repo) && onOpenSystems(systemForRepo(selected.repo)!.id)}
            />
          </aside>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/30 lg:hidden" onClick={() => setSelectedId(null)}>
          <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white" onClick={(e) => e.stopPropagation()}>
            <Detail
              item={selected}
              inLibrary={isInLibrary(selected.fragmentId, extras)}
              onClose={() => setSelectedId(null)}
              onImport={() => importItem(selected)}
              onCompose={() => onCompose([selected.fragmentId])}
              onSystems={() => selected.repo && systemForRepo(selected.repo) && onOpenSystems(systemForRepo(selected.repo)!.id)}
            />
          </div>
        </div>
      )}

      {notice && <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-xs text-white shadow-lg">{notice}</div>}
    </div>
  );
}

function Detail({
  item,
  inLibrary,
  onClose,
  onImport,
  onCompose,
  onSystems,
}: {
  item: CatalogItem;
  inLibrary: boolean;
  onClose: () => void;
  onImport: () => void;
  onCompose: () => void;
  onSystems: () => void;
}) {
  const yt = item.source === 'youtube' ? item.id.replace('yt:', '') : youtubeIdFromUrl(item.url);
  const canIframe = item.embed === 'live' || item.embed === 'unknown';
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-400">{SOURCE_LABEL[item.source]}</span>
        <button type="button" aria-label="Fermer" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-black">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="relative aspect-video bg-gray-100">
        {yt ? (
          <iframe title={item.name} src={youtubeEmbed(yt)} className="absolute inset-0 h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : canIframe && item.url ? (
          <iframe title={item.name} src={item.url} className="absolute inset-0 h-full w-full border-0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        ) : item.poster ? (
          <img src={item.poster} alt="" className="h-full w-full object-cover object-top" />
        ) : null}
      </div>
      <div className="space-y-4 p-4">
        <div>
          <h2 className="text-lg font-semibold leading-tight">{item.name}</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{item.description}</p>
        </div>
        {item.embed === 'blocked' && (
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] leading-relaxed text-gray-600">
            Le site est en ligne, mais il interdit l’iframe. Vous voyez la capture. Ouvrez-le dans un onglet pour l’utiliser.
          </p>
        )}
        {item.embed === 'unknown' && (
          <p className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-[11px] text-gray-500">Aperçu tenté. Si la zone reste vide, le site bloque l’intégration.</p>
        )}
        <FeatureGroups groups={featureGroups(item)} />
        <div className="flex flex-wrap gap-1.5">
          {item.signals.map((s) => (
            <span key={s} className="rounded-md border border-gray-200 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">
              {SIGNAL_LABEL[s]}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={inLibrary} onClick={onImport} className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium hover:bg-gray-50 disabled:opacity-40">
            <Library className="h-3.5 w-3.5" /> {inLibrary ? 'Déjà en bibliothèque' : 'Bibliothèque'}
          </button>
          <button type="button" onClick={onCompose} className="flex items-center justify-center gap-1.5 rounded-lg bg-black px-3 py-2 text-[12px] font-medium text-white hover:bg-gray-800">
            <LayoutGrid className="h-3.5 w-3.5" /> Grille infinie
          </button>
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium hover:bg-gray-50">
              <ExternalLink className="h-3.5 w-3.5" /> Ouvrir
            </a>
          )}
          {item.repo && systemForRepo(item.repo) && (
            <button type="button" onClick={onSystems} className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium hover:bg-gray-50">
              Design system
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
