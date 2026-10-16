import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Search, X, ArrowRight, Globe, Upload, Type, Copy, Check, Download, Lock, Eye, CornerDownLeft } from 'lucide-react';
import type { Fragment, Project } from '../../types';
import type { RepoSnapshot } from '../../data/repos';
import { repoToFragment, screenshotUrl, hostOf } from '../../data/repos';
import { makeTextFragment, uid } from '../../data/templates';
import { readOnlyUrl } from '../../hooks/useAtlas';
import { GithubMark, KindIcon } from '../ui/controls';
import { cn } from '../../utils/cn';

function Shell({ onClose, children, className, label }: { onClose: () => void; children: ReactNode; className?: string; label: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[10vh] backdrop-blur-[2px]" onMouseDown={onClose}>
      <div role="dialog" aria-label={label} onMouseDown={(e) => e.stopPropagation()} className={cn('animate-pop w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl', className)}>
        {children}
      </div>
    </div>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
      <span className="text-sm font-semibold text-gray-900">{title}</span>
      <button type="button" aria-label="Fermer" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-black">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ---------------- Recherche ⌘K ---------------- */

export interface SearchAction {
  id: string;
  label: string;
  hint: string;
  run: () => void;
}

export function SearchModal({
  onClose,
  fragments,
  actions,
  onPick,
  title = 'Rechercher un fragment, une URL, un tag…',
}: {
  onClose: () => void;
  fragments: Fragment[];
  actions: SearchAction[];
  onPick: (f: Fragment) => void;
  title?: string;
}) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const query = q.trim().toLowerCase();
  const acts = actions.filter((a) => !query || `${a.label} ${a.hint}`.toLowerCase().includes(query)).slice(0, query ? 6 : 4);
  const frags = fragments
    .filter((f) => !query || [f.name, f.subtitle, f.headline, f.description, f.collection].some((s) => s && s.toLowerCase().includes(query)))
    .slice(0, 40);
  const items: ({ type: 'action'; a: SearchAction } | { type: 'frag'; f: Fragment })[] = [
    ...acts.map((a) => ({ type: 'action' as const, a })),
    ...frags.map((f) => ({ type: 'frag' as const, f })),
  ];
  const run = (i: number) => {
    const it = items[i];
    if (!it) return;
    if (it.type === 'action') it.a.run();
    else onPick(it.f);
    onClose();
  };
  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <Shell onClose={onClose} label="Recherche" className="max-w-xl">
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((i) => Math.min(items.length - 1, i + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              run(active);
            }
          }}
          placeholder={title}
          className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
        />
        <kbd className="rounded border border-gray-200 px-1.5 py-0.5 font-mono text-[10px] text-gray-400">Échap</kbd>
      </div>
      <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
        {items.length === 0 && <div className="p-8 text-center text-xs text-gray-400">Aucun résultat pour « {q} »</div>}
        {acts.length > 0 && <div className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Actions</div>}
        {items.map((it, i) => {
          const header = it.type === 'frag' && i === acts.length;
          return (
            <div key={it.type === 'action' ? it.a.id : it.f.id}>
              {header && <div className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Fragments · {frags.length}</div>}
              <button
                type="button"
                data-i={i}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(i)}
                className={cn('flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors', active === i ? 'bg-gray-100' : 'hover:bg-gray-50')}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-600 ring-1 ring-black/5">
                    {it.type === 'action' ? (
                      <ArrowRight className="h-3.5 w-3.5" />
                    ) : it.f.kind === 'site' && it.f.poster ? (
                      <img src={it.f.poster} alt="" className="h-full w-full object-cover object-top" loading="lazy" />
                    ) : (
                      <KindIcon kind={it.f.kind} className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-gray-900">{it.type === 'action' ? it.a.label : it.f.name}</span>
                    <span className="block truncate text-[11px] text-gray-400">{it.type === 'action' ? it.a.hint : it.f.headline ?? it.f.subtitle}</span>
                  </span>
                </span>
                {active === i && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2 font-mono text-[10px] text-gray-400">
        <span>↑ ↓ naviguer</span>
        <span>↵ placer dans la cellule</span>
        <span>Échap fermer</span>
      </div>
    </Shell>
  );
}

/* ---------------- Ajouter un fragment ---------------- */

export type AddTab = 'url' | 'github' | 'upload' | 'text';

export function AddModal({
  initialTab = 'url',
  repos,
  onClose,
  onAdd,
  onPlaceExisting,
}: {
  initialTab?: AddTab;
  repos: RepoSnapshot[];
  onClose: () => void;
  onAdd: (f: Fragment) => void;
  onPlaceExisting: (id: string) => void;
}) {
  const [tab, setTab] = useState<AddTab>(initialTab);
  const [url, setUrl] = useState('https://');
  const [name, setName] = useState('');
  const [q, setQ] = useState('');
  const [text, setText] = useState({ eyebrow: 'Note', title: '', body: '' });
  const [error, setError] = useState('');
  const repoFrags = useMemo(
    () => repos.filter((r) => r.size > 0).sort((a, b) => b.pushedAt.localeCompare(a.pushedAt)).map(repoToFragment),
    [repos],
  );
  const shown = repoFrags.filter((f) => !q || `${f.name} ${f.headline ?? ''} ${f.description ?? ''}`.toLowerCase().includes(q.toLowerCase()));

  const addUrl = () => {
    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) throw new Error();
      const host = hostOf(u.href);
      onAdd({
        id: uid('url'),
        kind: 'site',
        name: name.trim() || host,
        subtitle: `${host} · iframe · URL externe`,
        source: 'url',
        url: u.href,
        embed: 'unknown',
        poster: screenshotUrl(u.href),
      });
      onClose();
    } catch {
      setError('URL invalide — elle doit commencer par https://');
    }
  };

  const onFile = (file: File) => {
    const kind = file.type.startsWith('image/') ? (file.type.includes('svg') ? 'svg' : 'image') : file.type.startsWith('video/') ? 'video' : file.type === 'application/pdf' ? 'pdf' : null;
    if (!kind) {
      setError('Format non pris en charge (images, vidéos, SVG, PDF).');
      return;
    }
    const finish = (src: string) => {
      onAdd({
        id: uid('up'),
        kind: kind === 'svg' ? 'image' : kind,
        name: file.name,
        subtitle: `upload · ${(file.size / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`,
        source: 'upload',
        url: src,
        poster: kind === 'video' ? undefined : src,
      });
      onClose();
    };
    if ((kind === 'image' || kind === 'svg') && file.size < 2.5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => finish(String(reader.result));
      reader.readAsDataURL(file);
    } else finish(URL.createObjectURL(file));
  };

  const tabs: [AddTab, string, ReactNode][] = [
    ['url', 'URL / iframe', <Globe key="u" className="h-3.5 w-3.5" />],
    ['github', 'GitHub', <GithubMark key="g" className="h-3.5 w-3.5" />],
    ['upload', 'Fichier', <Upload key="f" className="h-3.5 w-3.5" />],
    ['text', 'Texte', <Type key="t" className="h-3.5 w-3.5" />],
  ];

  return (
    <Shell onClose={onClose} label="Ajouter un fragment" className="max-w-lg">
      <Header title="Ajouter un fragment" onClose={onClose} />
      <div className="no-scrollbar flex gap-4 overflow-x-auto border-b border-gray-100 px-5 pt-2 text-xs font-medium">
        {tabs.map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setError('');
            }}
            className={cn('flex items-center gap-1.5 whitespace-nowrap border-b-2 pb-2.5 transition-colors', tab === id ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700')}
          >
            {icon} {label}
          </button>
        ))}
      </div>
      <div className="space-y-3 p-5 text-xs">
        {tab === 'url' && (
          <>
            <label className="block">
              <span className="mb-1.5 block font-medium text-gray-500">URL de la page</span>
              <input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addUrl()} className="w-full rounded-lg border border-gray-200 p-2.5 font-mono text-xs outline-none focus:border-black" />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-medium text-gray-500">Nom (facultatif)</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. Portfolio Behance" className="w-full rounded-lg border border-gray-200 p-2.5 text-xs outline-none focus:border-black" />
            </label>
            <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-[11px] leading-relaxed text-gray-500">
              La page est chargée en iframe vivante, recadrable au pixel. Si le site interdit l’intégration (X-Frame-Options / CSP), basculez la cellule en « Capture ».
            </p>
          </>
        )}
        {tab === 'github' && (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer tes dépôts…" className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-2 text-xs outline-none focus:border-black" />
            </div>
            <div className="max-h-72 space-y-0.5 overflow-y-auto">
              {shown.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    onPlaceExisting(f.id);
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-gray-50"
                >
                  <span className="flex h-8 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100 ring-1 ring-black/5">
                    {f.kind === 'site' ? <img src={f.poster} alt="" className="h-full w-full object-cover object-top" loading="lazy" /> : <KindIcon kind={f.kind} className="h-3.5 w-3.5 text-gray-500" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-gray-900">{f.name}</span>
                    <span className="block truncate text-[11px] text-gray-400">{f.headline ?? f.subtitle}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        {tab === 'upload' && (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-10 text-center transition-colors hover:border-gray-400 hover:bg-gray-50">
            <Upload className="h-6 w-6 text-gray-400" />
            <span className="font-medium text-gray-700">Choisir ou glisser un fichier</span>
            <span className="font-mono text-[10px] text-gray-400">PNG · JPG · SVG · MP4 · PDF</span>
            <input type="file" accept="image/*,video/*,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
        )}
        {tab === 'text' && (
          <>
            <input value={text.eyebrow} onChange={(e) => setText({ ...text, eyebrow: e.target.value })} placeholder="Surtitre" className="w-full rounded-lg border border-gray-200 p-2.5 font-mono text-[11px] uppercase outline-none focus:border-black" />
            <textarea autoFocus rows={2} value={text.title} onChange={(e) => setText({ ...text, title: e.target.value })} placeholder="Titre" className="font-display w-full resize-none rounded-lg border border-gray-200 p-2.5 text-xl leading-tight outline-none focus:border-black" />
            <textarea rows={3} value={text.body} onChange={(e) => setText({ ...text, body: e.target.value })} placeholder="Texte" className="w-full resize-none rounded-lg border border-gray-200 p-2.5 text-xs outline-none focus:border-black" />
          </>
        )}
        {error && <p className="text-[11px] text-red-600">{error}</p>}
      </div>
      {(tab === 'url' || tab === 'text') && (
        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200/60">
            Annuler
          </button>
          <button
            type="button"
            disabled={tab === 'text' && !text.title.trim()}
            onClick={() => {
              if (tab === 'url') addUrl();
              else {
                onAdd(makeTextFragment({ eyebrow: text.eyebrow, title: text.title.trim(), body: text.body.trim() }));
                onClose();
              }
            }}
            className="rounded-lg bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-40"
          >
            Placer dans la composition
          </button>
        </div>
      )}
    </Shell>
  );
}

/* ---------------- Partage ---------------- */

export function ShareModal({ project, onClose, onCopied }: { project: Project; onClose: () => void; onCopied: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = useMemo(() => readOnlyUrl(project), [project]);
  const copy = () => {
    void navigator.clipboard?.writeText(link);
    setCopied(true);
    onCopied();
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <Shell onClose={onClose} label="Partager" className="max-w-md">
      <Header title={`Partager « ${project.name} »`} onClose={onClose} />
      <div className="space-y-4 p-5 text-xs">
        <div>
          <span className="mb-1.5 block font-medium text-gray-500">Lien de lecture seule (mode Présenter)</span>
          <div className="flex gap-2">
            <input readOnly value={link} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 p-2.5 font-mono text-[11px] text-gray-700" />
            <button type="button" onClick={copy} className="flex items-center gap-1.5 rounded-lg bg-black px-3 text-white hover:bg-gray-800">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-gray-400">La composition entière est encodée dans le lien — aucun serveur nécessaire.</p>
        </div>
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/60 p-2.5">
            <span className="flex items-center gap-2.5">
              <Eye className="h-4 w-4 text-gray-700" />
              <span>
                <span className="block font-medium text-gray-900">Toute personne avec le lien</span>
                <span className="block text-[10px] text-gray-400">Lecture et interaction dans les cellules</span>
              </span>
            </span>
            <span className="font-medium text-gray-700">Lecture</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-2.5">
            <span className="flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-gray-700" />
              <span>
                <span className="block font-medium text-gray-900">Vous · @mattmezstitchlab</span>
                <span className="block text-[10px] text-gray-400">Édition, recadrages et graphe</span>
              </span>
            </span>
            <span className="font-semibold text-black">Éditeur</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
        <a href={link} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">
          Ouvrir l’aperçu
        </a>
        <button type="button" onClick={onClose} className="rounded-lg bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800">
          Fermer
        </button>
      </div>
    </Shell>
  );
}

/* ---------------- Export JSON ---------------- */

export function ExportModal({ project, fragments, onClose }: { project: Project; fragments: Map<string, Fragment>; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const json = useMemo(() => {
    const payload = {
      format: 'atlas.composition',
      version: 2,
      exportedAt: new Date().toISOString(),
      project: { id: project.id, name: project.name, type: project.typeId, layout: project.layoutId, support: project.supportId, arrangement: project.arrangement, theme: project.theme },
      cells: project.cells.map((c, i) => {
        const f = c.fragmentId ? fragments.get(c.fragmentId) : undefined;
        return {
          index: i,
          label: c.label,
          rect: c.rect,
          settings: c.settings,
          fragment: f ? { id: f.id, kind: f.kind, name: f.name, url: f.url?.startsWith('data:') ? '(fichier importé)' : f.url, repo: f.repo, embed: f.embed, text: f.text } : null,
        };
      }),
    };
    return JSON.stringify(payload, null, 2);
  }, [project, fragments]);
  const download = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `atlas-${project.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <Shell onClose={onClose} label="Export JSON" className="max-w-2xl">
      <Header title="Export de la composition (JSON)" onClose={onClose} />
      <pre className="max-h-[55vh] overflow-auto bg-[#0f0f11] p-4 font-mono text-[11px] leading-relaxed text-gray-200">{json}</pre>
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-5 py-3">
        <span className="font-mono text-[10px] text-gray-500">{project.cells.length} conteneurs sérialisés</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(json);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copié' : 'Copier'}
          </button>
          <button type="button" onClick={download} className="flex items-center gap-1.5 rounded-lg bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800">
            <Download className="h-3.5 w-3.5" /> Télécharger .json
          </button>
        </div>
      </div>
    </Shell>
  );
}
