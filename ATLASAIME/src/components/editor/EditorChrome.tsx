import { useState } from 'react';
import {
  Search,
  Undo2,
  Redo2,
  Minus,
  Plus,
  Share,
  ChevronDown,
  PanelLeft,
  PanelRight,
  Maximize2,
  Download,
  Link2,
  Home,
  Copy,
} from 'lucide-react';
import type { AppViewMode, Project } from '../../types';
import { GITHUB_USER, timeAgo } from '../../data/repos';
import { useNow } from '../../hooks/useAtlas';
import { AtlasLogo } from '../ui/controls';
import { cn } from '../../utils/cn';

function ZoomControl({ zoom, onIn, onOut, onFit }: { zoom: number; onIn: () => void; onOut: () => void; onFit: () => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1 py-0.5 text-gray-700">
      <button type="button" aria-label="Zoom arrière" onClick={onOut} className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-black">
        <Minus className="h-3 w-3" />
      </button>
      <button type="button" title="Ajuster à l’écran (⌘0)" onClick={onFit} className="min-w-[44px] px-1 text-center font-mono text-[11px] hover:text-black">
        {zoom} %
      </button>
      <button type="button" aria-label="Zoom avant" onClick={onIn} className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-black">
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

export interface TopBarProps {
  project: Project;
  projectsCount: number;
  fragmentsCount: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onHome: () => void;
  onDuplicate: () => void;
  onOpenSearch: () => void;
  onOpenAdd: () => void;
  onOpenShare: () => void;
  leftOpen: boolean;
  rightOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onFocus: () => void;
  onOpenViewer?: () => void;
  onOpenDesk?: () => void;
  onOpenSystems?: () => void;
}

export function TopBar(p: TopBarProps) {
  const [menu, setMenu] = useState(false);
  return (
    <header className="z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-2.5 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={p.onHome} title="Accueil · choisir un projet" className="rounded-md p-1 transition-opacity hover:opacity-70">
          <AtlasLogo />
        </button>
        <div className="hidden h-5 w-px bg-gray-200 sm:block" />
        <div className="relative min-w-0">
          <button type="button" onClick={() => setMenu((v) => !v)} className="group flex min-w-0 items-center gap-2 rounded-md px-1 py-0.5 text-left hover:bg-gray-50">
            <span className="min-w-0">
              <span className="block max-w-[120px] truncate text-[13px] font-semibold text-gray-900 sm:max-w-[220px]">{p.project.name}</span>
              <span className="hidden truncate text-[10px] text-gray-400 sm:block">
                Workspace · {p.projectsCount} compositions · {p.fragmentsCount} fragments
              </span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-gray-700" />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
              <div className="animate-pop absolute left-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
                <button type="button" onClick={() => { setMenu(false); p.onHome(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-gray-700 hover:bg-gray-50">
                  <Home className="h-3.5 w-3.5" /> Accueil · tous les projets
                </button>
                <button type="button" onClick={() => { setMenu(false); p.onDuplicate(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-gray-700 hover:bg-gray-50">
                  <Copy className="h-3.5 w-3.5" /> Dupliquer ce projet
                </button>
                {p.onOpenDesk && <button type="button" onClick={() => { setMenu(false); p.onOpenDesk?.(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-gray-700 hover:bg-gray-50">Bureau · manifestes & audits</button>}
                {p.onOpenViewer && <button type="button" onClick={() => { setMenu(false); p.onOpenViewer?.(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-gray-700 hover:bg-gray-50">Visionneuse · sources</button>}
                {p.onOpenSystems && <button type="button" onClick={() => { setMenu(false); p.onOpenSystems?.(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-gray-700 hover:bg-gray-50">Design systems</button>}
              </div>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={p.onOpenSearch}
        className="group mx-2 hidden max-w-md flex-1 items-center justify-between rounded-lg border border-gray-200/80 bg-gray-50 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-100/80 md:flex"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Search className="h-3.5 w-3.5 shrink-0 group-hover:text-gray-600" />
          <span className="truncate group-hover:text-gray-600">Rechercher un fragment, une URL, un tag…</span>
        </span>
        <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-gray-400">⌘K</kbd>
      </button>

      <div className="flex items-center gap-1.5 lg:gap-2">
        {p.onOpenViewer && (
          <button type="button" onClick={p.onOpenViewer} className="hidden rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 lg:block">
            Visionneuse
          </button>
        )}
        {p.onOpenDesk && (
          <button type="button" onClick={p.onOpenDesk} className="hidden rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 lg:block">
            Bureau
          </button>
        )}
        {p.onOpenSystems && (
          <button type="button" onClick={p.onOpenSystems} className="hidden rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 xl:block">
            Design systems
          </button>
        )}
        <button type="button" onClick={p.onOpenSearch} aria-label="Rechercher" className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 md:hidden">
          <Search className="h-4 w-4" />
        </button>
        <div className="hidden items-center lg:flex">
          <button type="button" disabled={!p.canUndo} onClick={p.onUndo} title="Annuler (⌘Z)" className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30">
            <Undo2 className="h-4 w-4" />
          </button>
          <button type="button" disabled={!p.canRedo} onClick={p.onRedo} title="Rétablir (⌘⇧Z)" className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30">
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
        <div className="hidden xl:block">
          <ZoomControl zoom={p.zoom} onIn={p.onZoomIn} onOut={p.onZoomOut} onFit={p.onFit} />
        </div>
        <button type="button" onClick={p.onOpenAdd} className="flex items-center gap-1 rounded-lg bg-black px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-gray-800 sm:px-3">
          <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Ajouter</span>
        </button>
        <button type="button" onClick={p.onOpenShare} className="hidden items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:flex">
          <Share className="h-3.5 w-3.5 text-gray-500" /> Partager
        </button>
        <div className="flex items-center rounded-lg border border-gray-200 p-0.5 text-gray-400">
          <button type="button" onClick={p.onToggleLeft} title="Bibliothèque" aria-pressed={p.leftOpen} className={cn('rounded-md p-1 transition-colors', p.leftOpen ? 'bg-gray-100 text-black' : 'hover:text-black')}>
            <PanelLeft className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={p.onFocus} title="Mode focus (masquer les panneaux)" className="hidden rounded-md p-1 transition-colors hover:text-black sm:block">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={p.onToggleRight} title="Inspecteur" aria-pressed={p.rightOpen} className={cn('rounded-md p-1 transition-colors', p.rightOpen ? 'bg-gray-100 text-black' : 'hover:text-black')}>
            <PanelRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <a href={GITHUB_USER.htmlUrl} target="_blank" rel="noreferrer" title={`@${GITHUB_USER.login}`} className="hidden shrink-0 sm:block">
          <img src={GITHUB_USER.avatarUrl} alt={`Avatar de ${GITHUB_USER.login}`} className="h-7 w-7 rounded-full border border-gray-200 transition-opacity hover:opacity-80" />
        </a>
      </div>
    </header>
  );
}

export interface BottomBarProps {
  project: Project;
  mode: AppViewMode;
  onMode: (m: AppViewMode) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onExport: () => void;
  onCopyLink: () => void;
  lastSavedAt: number;
  historyCount: number;
}

export function BottomBar(p: BottomBarProps) {
  useNow(1000);
  const filled = p.project.cells.filter((c) => c.fragmentId).length;
  return (
    <footer className="z-30 flex h-12 shrink-0 items-center justify-between gap-2 border-t border-gray-200 bg-white px-2.5 text-xs sm:px-4">
      <div className="flex min-w-0 items-center gap-3 text-gray-500">
        <span className="flex shrink-0 items-center gap-2">
          <span className="animate-pulse-subtle h-2 w-2 rounded-full bg-black" />
          <span className="hidden font-medium text-gray-700 sm:inline">Sauvegarde automatique</span>
          <span className="hidden text-gray-400 sm:inline">· il y a {timeAgo(p.lastSavedAt)}</span>
        </span>
        <span className="hidden items-center gap-3 text-gray-400 xl:flex">
          <span className="h-4 w-px bg-gray-200" />
          <span>Historique · {p.historyCount} états</span>
          <span className="h-4 w-px bg-gray-200" />
          <span className="truncate">
            Composition « {p.project.name} » · {filled} conteneurs
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {(
            [
              ['edit', 'ÉDITER'],
              ['use', 'UTILISER'],
              ['present', 'PRÉSENTER'],
            ] as [AppViewMode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => p.onMode(m)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] transition-all sm:px-4',
                p.mode === m ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="hidden font-mono text-[10px] tracking-widest text-gray-400 md:inline">E · U · P</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:block">
          <ZoomControl zoom={p.zoom} onIn={p.onZoomIn} onOut={p.onZoomOut} onFit={p.onFit} />
        </div>
        <button type="button" onClick={p.onExport} className="hidden items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 lg:flex">
          <Download className="h-3.5 w-3.5 text-gray-500" /> Export JSON
        </button>
        <button type="button" onClick={p.onCopyLink} className="hidden items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 md:flex">
          <Link2 className="h-3.5 w-3.5 text-gray-500" /> Lien lecture seule
        </button>
      </div>
    </footer>
  );
}
