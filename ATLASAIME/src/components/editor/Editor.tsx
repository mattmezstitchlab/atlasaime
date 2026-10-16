import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, X, Copy } from 'lucide-react';
import type { AppViewMode, CanvasView, Cell, CellSettings, Fragment, FragmentKind, LayoutId, Project, Rect, SupportId, ToolMode, Viewport } from '../../types';
import { MEDIA_FRAGMENTS } from '../../data/media';
import { repoToFragment } from '../../data/repos';
import { LAYOUTS, LAYOUT_MAP, SUPPORTS, SUPPORT_MAP, cascadeRect, computeGeometry, gridToFreeRects } from '../../data/layouts';
import { defaultSettings, makeTextFragment, TEXT_TEMPLATES, uid } from '../../data/templates';
import { readOnlyUrl, saveProject, useMediaQuery, useProjectHistory } from '../../hooks/useAtlas';
import type { GithubState } from '../../hooks/useAtlas';
import { TopBar, BottomBar } from './EditorChrome';
import { Library } from './Library';
import { Inspector } from './Inspector';
import { Canvas } from './Canvas';
import { Artboard } from './Artboard';
import { LiveCropModal } from './LiveCropModal';
import { SearchModal, AddModal, ShareModal, ExportModal } from '../modals/Modals';
import type { AddTab, SearchAction } from '../modals/Modals';
import { Toast } from '../Toast';
import { playTone, stopTone } from '../../utils/audioPlayer';
import { allKnownFragments, loadExtras } from '../../data/catalog';
import { analyzeBrief } from '../../data/agents';
import type { AgentProfile } from '../../data/agents';
import { generateSiteFromBrief } from '../../data/siteGenerator';
import type { AgentReply } from './CanvasAgent';
import { loadProjects } from '../../hooks/useAtlas';
import { githubRepoUrl } from '../../data/repos';
import { BlockDialogs } from './BlockDialogs';
import type { BlockAction } from './BlockMenu';
import { cn } from '../../utils/cn';

export interface EditorProps {
  initialProject: Project;
  github: GithubState;
  projectsCount: number;
  readOnly?: boolean;
  onExit: () => void;
  onSaved: (p: Project) => void;
  onDuplicate: (p: Project) => void;
  onOpenViewer?: () => void;
  onOpenDesk?: () => void;
  onOpenSystems?: () => void;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const isTyping = () => {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
};

const settingsFor = (prev: CellSettings, kind?: FragmentKind): CellSettings => ({
  ...defaultSettings(kind),
  radius: prev.radius,
  animation: prev.animation,
  duration: prev.duration,
  delay: prev.delay,
  locks: prev.locks,
  colSpan: prev.colSpan,
  rowSpan: prev.rowSpan,
});

function Drawer({ side, onClose, children }: { side: 'left' | 'right'; onClose: () => void; children: ReactNode }) {
  return (
    <>
      <div className="absolute inset-0 z-30 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className={cn('absolute inset-y-0 z-40 shadow-2xl', side === 'left' ? 'left-0 animate-in-left' : 'right-0 animate-in-right')}>{children}</div>
    </>
  );
}

function PresentOverlay({
  project,
  fragments,
  slideIndex,
  onSlide,
  onExit,
  readOnly,
  onDuplicate,
  replayKey,
  playing,
  onToggleAudio,
}: {
  project: Project;
  fragments: Map<string, Fragment>;
  slideIndex: number;
  onSlide: (i: number) => void;
  onExit: () => void;
  readOnly?: boolean;
  onDuplicate: () => void;
  replayKey: number;
  playing: boolean;
  onToggleAudio: () => void;
}) {
  const [vw, setVw] = useState(() => window.innerWidth);
  const [vh, setVh] = useState(() => window.innerHeight);
  const [hud, setHud] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const poke = useCallback(() => {
    setHud(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setHud(false), 2600);
  }, []);
  useEffect(() => {
    poke();
    return () => window.clearTimeout(timer.current);
  }, [poke]);

  const support = SUPPORT_MAP[project.supportId];
  const geo = computeGeometry(project, support, { slideIndex });
  const pad = vw < 640 ? 12 : 40;
  let s = Math.min(1.25, (vw - pad * 2) / geo.width);
  if (support.height || LAYOUT_MAP[project.layoutId].kind === 'slides') s = Math.min(s, (vh - pad * 2) / geo.height);
  const slides = LAYOUT_MAP[project.layoutId].kind === 'slides' && project.arrangement === 'grille';
  const dark = project.theme.background === 'noir';

  return (
    <div className={cn('fixed inset-0 z-[60] overflow-auto', dark ? 'bg-[#050506]' : 'bg-[#efeff1]')} onMouseMove={poke}>
      <div className="flex min-h-full items-center justify-center" style={{ padding: pad }}>
        <div className="relative shrink-0" style={{ width: geo.width * s, height: geo.height * s }}>
          <div className="absolute left-0 top-0" style={{ transform: `scale(${s})`, transformOrigin: '0 0' }}>
            <Artboard project={project} fragments={fragments} mode="present" slideIndex={slideIndex} replayKey={replayKey + slideIndex} playingAudio={playing} onToggleAudio={onToggleAudio} />
          </div>
        </div>
      </div>
      <div
        className={cn(
          'fixed left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/85 px-4 py-2 text-xs text-white shadow-xl backdrop-blur transition-all duration-500',
          hud ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0',
        )}
      >
        <span className="max-w-[40vw] truncate font-medium">{project.name}</span>
        <span className="hidden text-white/50 sm:inline">{readOnly ? 'Lecture seule' : 'Échap pour quitter'}</span>
        {readOnly && (
          <button type="button" onClick={onDuplicate} className="flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-black hover:bg-gray-200">
            <Copy className="h-3 w-3" /> Dupliquer dans mes projets
          </button>
        )}
        {!readOnly && (
          <button type="button" aria-label="Quitter la présentation" onClick={onExit} className="rounded-full bg-white/15 p-1 hover:bg-white/25">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {slides && (
        <div className={cn('fixed bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/85 px-2 py-1.5 text-white shadow-xl transition-opacity duration-500', hud ? 'opacity-100' : 'opacity-0')}>
          <button type="button" aria-label="Précédente" onClick={() => onSlide(Math.max(0, slideIndex - 1))} className="rounded-full p-1 hover:bg-white/15">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[52px] text-center font-mono text-[11px]">
            {slideIndex + 1} / {project.cells.length}
          </span>
          <button type="button" aria-label="Suivante" onClick={() => onSlide(Math.min(project.cells.length - 1, slideIndex + 1))} className="rounded-full p-1 hover:bg-white/15">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function Editor({ initialProject, github, projectsCount, readOnly, onExit, onSaved, onDuplicate, onOpenViewer, onOpenDesk, onOpenSystems }: EditorProps) {
  const { project, update, undo, redo, canUndo, canRedo, historyCount } = useProjectHistory(initialProject);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [mode, setModeRaw] = useState<AppViewMode>(readOnly ? 'present' : 'edit');
  const [view, setView] = useState<CanvasView>('composition');
  const [tool, setTool] = useState<ToolMode>('select');
  const [zoomMode, setZoomMode] = useState<'fit' | 'manual'>('fit');
  const [fitPct, setFitPct] = useState(60);
  const [manualPct, setManualPct] = useState(100);
  const isLg = useMediaQuery('(min-width: 1024px)');
  const isXl = useMediaQuery('(min-width: 1280px)');
  const [leftOpen, setLeftOpen] = useState(isLg);
  const [rightOpen, setRightOpen] = useState(isXl);
  const [modal, setModal] = useState<null | 'search' | 'replace' | 'add' | 'share' | 'export' | 'crop'>(null);
  const [addTab, setAddTab] = useState<AddTab>('url');
  const [toast, setToast] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [layoutPicker, setLayoutPicker] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(() => Date.now());
  const [blockDialog, setBlockDialog] = useState<{ mode: 'remix' | 'design'; cellId: string } | null>(null);
  const [contentFocusKey, setContentFocusKey] = useState(0);
  const toastTimer = useRef<number | undefined>(undefined);
  const savedRef = useRef(onSaved);
  const zoom = zoomMode === 'fit' ? fitPct : manualPct;
  const layout = LAYOUT_MAP[project.layoutId];
  const support = SUPPORT_MAP[project.supportId];
  const otherProjects = useMemo(() => loadProjects().filter((p) => p.id !== initialProject.id && p.cells.some((c) => !!c.fragmentId)), [initialProject.id]);

  useEffect(() => {
    savedRef.current = onSaved;
  });
  useEffect(() => setLeftOpen(isLg), [isLg]);
  useEffect(() => setRightOpen(isXl), [isXl]);
  useEffect(() => () => stopTone(), []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    if (readOnly) return;
    const t = window.setTimeout(() => {
      saveProject(project);
      setLastSavedAt(Date.now());
      savedRef.current(project);
    }, 500);
    return () => window.clearTimeout(t);
  }, [project, readOnly]);

  const repoFragments = useMemo(() => github.repos.map(repoToFragment), [github.repos]);
  const fragments = useMemo(() => {
    const m = new Map<string, Fragment>();
    MEDIA_FRAGMENTS.forEach((f) => m.set(f.id, f));
    repoFragments.forEach((f) => m.set(f.id, f));
    allKnownFragments().forEach((f) => m.set(f.id, f));
    project.customFragments.forEach((f) => m.set(f.id, f));
    return m;
  }, [repoFragments, project.customFragments]);
  const searchable = useMemo(
    () => [...project.customFragments, ...MEDIA_FRAGMENTS, ...repoFragments.filter((f) => (f.size ?? 1) > 0)],
    [project.customFragments, repoFragments],
  );
  const usedIds = useMemo(() => new Set(project.cells.map((c) => c.fragmentId).filter((x): x is string => !!x)), [project.cells]);

  const geo = useMemo(() => computeGeometry(project, support, { slideIndex }), [project, support, slideIndex]);
  const selectedCell = project.cells.find((c) => c.id === selectedCellId) ?? null;
  const selectedFragment = selectedCell?.fragmentId ? fragments.get(selectedCell.fragmentId) ?? null : null;
  const selectedGeom = geo.cells.find((g) => g.cellId === selectedCellId);

  const setMode = useCallback((m: AppViewMode) => {
    setModeRaw(m);
    if (m !== 'edit') setReplayKey((k) => k + 1);
    if (m === 'present') setLayoutPicker(false);
  }, []);

  /* ---------- actions ---------- */

  const updateCell = useCallback(
    (cellId: string, fn: (c: Cell) => Cell, key?: string) => update((p) => ({ ...p, cells: p.cells.map((c) => (c.id === cellId ? fn(c) : c)) }), key),
    [update],
  );

  const assign = (cellId: string, fragmentId: string, key?: string) => {
    const f = fragments.get(fragmentId);
    update((p) => ({ ...p, cells: p.cells.map((c) => (c.id === cellId ? { ...c, fragmentId, settings: settingsFor(c.settings, f?.kind) } : c)) }), key);
    setSelectedCellId(cellId);
  };

  const freeMode = (p: Project) => p.arrangement === 'libre' || LAYOUT_MAP[p.layoutId].kind === 'free';

  const appendCell = (fragmentId: string | null) => {
    const id = uid('cell');
    const kind = fragmentId ? fragments.get(fragmentId)?.kind : undefined;
    update((p) => ({ ...p, cells: [...p.cells, { id, fragmentId, settings: defaultSettings(kind), rect: freeMode(p) ? cascadeRect(p.cells.length) : undefined }] }));
    setSelectedCellId(id);
    if (layout.kind === 'slides') setSlideIndex(project.cells.length);
  };

  const placeFragment = (fragmentId: string) => {
    const f = fragments.get(fragmentId);
    const sel = selectedCell && !selectedCell.settings.locks.content ? selectedCell : null;
    const target = sel ?? project.cells.find((c) => !c.fragmentId);
    if (target) {
      assign(target.id, fragmentId);
      const g = geo.cells.find((x) => x.cellId === target.id);
      showToast(`« ${f?.name ?? 'Fragment'} » placé${g ? ` dans ${g.label}` : ''}`);
    } else {
      appendCell(fragmentId);
      showToast(`« ${f?.name ?? 'Fragment'} » ajouté dans une nouvelle cellule`);
    }
  };

  const addAndPlace = (f: Fragment) => {
    update((p) => {
      const sel = p.cells.find((c) => c.id === selectedCellId && !c.settings.locks.content);
      const target = sel ?? p.cells.find((c) => !c.fragmentId);
      const customFragments = [...p.customFragments, f];
      if (target) return { ...p, customFragments, cells: p.cells.map((c) => (c.id === target.id ? { ...c, fragmentId: f.id, settings: settingsFor(c.settings, f.kind) } : c)) };
      return { ...p, customFragments, cells: [...p.cells, { id: uid('cell'), fragmentId: f.id, settings: defaultSettings(f.kind), rect: freeMode(p) ? cascadeRect(p.cells.length) : undefined }] };
    });
    showToast(`« ${f.name} » ajouté à la composition`);
  };

  const swapCells = (a: string, b: string) => {
    update((p) => {
      const A = p.cells.find((c) => c.id === a);
      const B = p.cells.find((c) => c.id === b);
      if (!A || !B) return p;
      return {
        ...p,
        cells: p.cells.map((c) =>
          c.id === a
            ? { ...c, fragmentId: B.fragmentId, settings: { ...B.settings, colSpan: c.settings.colSpan, rowSpan: c.settings.rowSpan } }
            : c.id === b
              ? { ...c, fragmentId: A.fragmentId, settings: { ...A.settings, colSpan: c.settings.colSpan, rowSpan: c.settings.rowSpan } }
              : c,
        ),
      };
    });
    setSelectedCellId(b);
    showToast('Cellules échangées');
  };

  const setLayout = (id: LayoutId, key?: string) => {
    const next = LAYOUT_MAP[id];
    update((p) => {
      const cells = [...p.cells];
      while (cells.length < next.slots.length) cells.push({ id: uid('cell'), fragmentId: null, settings: defaultSettings() });
      return {
        ...p,
        layoutId: id,
        arrangement: 'grille',
        cells: cells.map((c, i) => ({
          ...c,
          settings: { ...c.settings, colSpan: undefined, rowSpan: undefined },
          rect: id === 'free' ? c.rect ?? next.free?.[i] ?? cascadeRect(i) : c.rect,
        })),
      };
    }, key);
    setSlideIndex(0);
    setZoomMode('fit');
    showToast(`Composition : ${next.name}`);
  };

  const setSupport = (id: SupportId, key?: string) => {
    update((p) => ({ ...p, supportId: id }), key);
    setZoomMode('fit');
  };

  const setArrangement = (a: 'grille' | 'libre') => {
    if (a === 'libre' && !freeMode(project)) {
      const rects = gridToFreeRects(project);
      update((p) => ({ ...p, arrangement: 'libre', cells: p.cells.map((c) => ({ ...c, rect: rects[c.id] ?? c.rect })) }));
      showToast('Mode libre · glissez les cellules, redimensionnez par les poignées');
    } else if (a === 'grille' && freeMode(project)) {
      if (layout.kind === 'free') setLayout('bento');
      else update((p) => ({ ...p, arrangement: 'grille' }));
    }
  };

  const autoFill = () => {
    const pool = github.repos
      .filter((r) => r.embed === 'live')
      .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))
      .map((r) => `gh:${r.name}`)
      .filter((id) => !usedIds.has(id));
    const empty = project.cells.filter((c) => !c.fragmentId).length;
    if (!empty) return showToast('Aucune cellule vide à remplir');
    update((p) => {
      let i = 0;
      return { ...p, cells: p.cells.map((c) => (c.fragmentId || !pool[i] ? c : { ...c, fragmentId: pool[i++], settings: settingsFor(c.settings, 'site') })) };
    });
    showToast(`${Math.min(empty, pool.length)} cellule(s) remplie(s) avec tes sites GitHub`);
  };

  const clearCell = (id: string) => updateCell(id, (c) => ({ ...c, fragmentId: null }));
  const removeCell = (id: string) => {
    update((p) => ({ ...p, cells: p.cells.filter((c) => c.id !== id) }));
    setSelectedCellId(null);
    setSlideIndex((i) => Math.max(0, Math.min(i, project.cells.length - 2)));
  };

  const remixWith = (sourceProject: Project, source: Fragment, targetId: string) => {
    const target = project.cells.find((c) => c.id === targetId);
    if (!target || target.settings.locks.content) return;
    const newId = uid('cell');
    update((p) => {
      // A custom source from another project is copied; public GitHub/media IDs remain references.
      const imported = sourceProject.customFragments.some((f) => f.id === source.id)
        ? { ...structuredClone(source), id: uid('remix') }
        : null;
      const id = imported?.id ?? source.id;
      return {
        ...p,
        customFragments: imported ? [...p.customFragments, imported] : p.customFragments,
        cells: [...p.cells, { id: newId, fragmentId: id, settings: { ...structuredClone(target.settings), locks: { ...target.settings.locks, content: false, position: false } }, label: `Remix · ${source.name}`, rect: p.arrangement === 'libre' ? cascadeRect(p.cells.length) : undefined }],
      };
    });
    setSelectedCellId(newId);
    setBlockDialog(null);
    showToast(`Remix créé avec ${sourceProject.name} · sources inchangées`);
  };

  const metamorphose = (id: string) => {
    const cell = project.cells.find((c) => c.id === id);
    if (!cell?.fragmentId || cell.settings.locks.content) return;
    const newId = uid('cell');
    update((p) => {
      const source = p.customFragments.find((f) => f.id === cell.fragmentId);
      const customCopy = source ? { ...structuredClone(source), id: uid('meta') } : null;
      return {
        ...p,
        customFragments: customCopy ? [...p.customFragments, customCopy] : p.customFragments,
        cells: [...p.cells, {
          ...structuredClone(cell), id: newId,
          fragmentId: customCopy?.id ?? cell.fragmentId,
          label: `Métamorphose · ${fragments.get(cell.fragmentId!)?.name ?? 'fragment'}`,
          rect: p.arrangement === 'libre' ? cascadeRect(p.cells.length) : undefined,
          settings: { ...structuredClone(cell.settings), designVariant: 'fuchsia', preview: 'capture' as const, radius: 4, locks: { ...cell.settings.locks, content: false, position: false } },
        }],
      };
    });
    setSelectedCellId(newId);
    showToast('Variante métamorphosée créée · original conservé');
  };

  const blockAction = (action: BlockAction, id: string) => {
    const cell = project.cells.find((c) => c.id === id);
    if (!cell) return;
    const f = cell.fragmentId ? fragments.get(cell.fragmentId) : null;
    setSelectedCellId(id);
    if (action === 'remix' && f && !cell.settings.locks.content && otherProjects.length) setBlockDialog({ mode: 'remix', cellId: id });
    if (action === 'metamorphose' && f) metamorphose(id);
    if (action === 'design' && f) setBlockDialog({ mode: 'design', cellId: id });
    if (action === 'crop' && f?.kind === 'site' && !cell.settings.locks.crop) setModal('crop');
    if (action === 'preview' && f) setMode('use');
    if (action === 'edit-text' && f?.kind === 'text') { setRightOpen(true); setContentFocusKey((n) => n + 1); }
    if (action === 'source' && f) {
      const target = f.url?.startsWith('https://') || f.url?.startsWith('http://') ? f.url : f.repo ? githubRepoUrl(f.repo) : null;
      if (target) window.open(target, '_blank', 'noopener,noreferrer');
    }
    if (action === 'replace' && !cell.settings.locks.content) setModal('replace');
    if (action === 'duplicate' && f && !cell.settings.locks.content) {
      const newId = uid('cell');
      update((p) => ({ ...p, cells: [...p.cells, { ...structuredClone(cell), id: newId, rect: p.arrangement === 'libre' ? cascadeRect(p.cells.length) : undefined }] }));
      setSelectedCellId(newId);
      showToast('Case dupliquée');
    }
    if (action === 'clear' && !cell.settings.locks.content) clearCell(id);
    if (action === 'delete' && !cell.settings.locks.position && !cell.settings.locks.content) removeCell(id);
  };

  const executeCanvasAgent = async (command: string): Promise<AgentReply> => {
    try {
      return await runCanvasAgent(command);
    } catch (error) {
      console.error('[ATLAS] agent du canevas', error);
      return {
        text: `Je me suis arrêté avant de modifier quoi que ce soit : ${error instanceof Error ? error.message : 'erreur inattendue'}. Le canevas reste tel quel ; reformulez la consigne ou annulez avec ⌘Z si besoin.`,
        assumptions: ['Erreur interceptée localement, enregistrée dans la console du navigateur.'],
      };
    }
  };

  const runCanvasAgent = async (command: string): Promise<AgentReply> => {
    const lower = command.toLocaleLowerCase('fr-FR');
    const historyKey = uid('agent-order');
    const brief = analyzeBrief(command, github.repos);
    const participants: AgentProfile[] = [...new Map(brief.selectedAgents.map((a) => [a.id, a])).values()];
    const reactionsFor = (operations: string[]) => participants.map((agent) => ({
      agent,
      text: agent.id === 'ux-architect'
        ? `Parcours concerné : ${operations.some((x) => /support|composition|section|bloc|grille/i.test(x)) ? 'la structure affichée a été ajustée' : 'aucun parcours n’a été modifié'}.`
        : agent.id === 'art-director'
          ? `Direction visuelle : ${operations.find((x) => /direction|fond|gouttière|taille/i.test(x)) ?? 'je conserve l’apparence actuelle'}.`
          : agent.id === 'principal-developer'
            ? 'Modifications locales, sans déployer ni écrire dans les dépôts sources.'
            : agent.id === 'noema'
              ? 'La proposition reste réversible. La validation finale vous appartient.'
              : operations.length ? `Spécialité sollicitée pour : ${operations[0].toLowerCase()}.` : `Aucune action spécifique de ${agent.specialty.toLowerCase()} n’a été appliquée.`,
    }));
    const generating = /^(?:crée|creer|créer|génère|generer|générer|construis|construire|prépare|preparer|compose|fabrique|lance|fais-moi|fais moi)\b/i.test(command.trim()) &&
      /\b(site|application|app|landing|portfolio|page|plateforme|expérience|experience)\b/i.test(lower);

    if (generating) {
      const generated = generateSiteFromBrief(brief, {}, github.repos);
      const assumptions = generated.assumptions;
      return {
        text: `J’ai préparé « ${generated.project.name} » à partir de votre consigne : ${generated.sections.join(', ').toLowerCase()}. Le brief reste visible dans le canevas. Voici l’architecture proposée ; vérifiez les hypothèses avant de poursuivre.`,
        applied: [
          `Type ${generated.project.typeId} · composition ${generated.project.layoutId} · support ${generated.project.supportId}`,
          `${generated.sourcesUsed.length} dépôt(s) GitHub réellement associé(s)`,
          `${generated.project.cells.length} blocs éditables, dont les sections du brief`,
        ],
        assumptions,
        agents: participants,
        reactions: reactionsFor([
          `composition ${LAYOUT_MAP[generated.project.layoutId].name}`,
          `support ${SUPPORT_MAP[generated.project.supportId].name}`,
          ...generated.sections,
        ]),
        generated: true,
        action: {
          label: 'Appliquer ce site dans le canevas · ⌘Z pour annuler',
          run: () => {
            const next = generated.project;
            update((current) => ({ ...next, id: current.id, createdAt: current.createdAt, updatedAt: Date.now() }));
            setSelectedCellId(generated.project.cells[0]?.id ?? null);
            setSlideIndex(0);
            setZoomMode('fit');
            setView('composition');
            showToast(`« ${generated.project.name} » appliqué · Annuler avec ⌘Z`);
          },
        },
      };
    }

    const applied: string[] = [];
    if (/backend|base de données|base de donnees|authentification|connexion utilisateur|paiement|stripe|réserver en ligne|reserver en ligne|api externe/i.test(lower)) {
      return {
        text: 'Cette session transforme le canevas, mais ne peut pas créer un serveur, une base de données ou connecter une API privée. Je n’ai pas simulé cette fonctionnalité. Je peux préparer son parcours visuel ; l’intégration doit se faire dans le dépôt de l’application, avec des accès autorisés.',
        agents: participants,
        reactions: reactionsFor([]),
        assumptions: ['Aucun accès backend, secret, paiement ou compte utilisateur n’est configuré dans ATLAS.'],
      };
    }
    const layoutChoice: [RegExp, LayoutId][] = [
      [/ordonne les blocs|range les blocs|réorganise la grille|reorganise la grille|grille équilibrée/, 'bento'],
      [/grille infinie|infini/, 'infinite'],
      [/masonry|mosaïque libre/, 'masonry'],
      [/bento/, 'bento'],
      [/mosaïque|grille 2\s*[x×]\s*2/, 'mosaic'],
      [/frise|timeline|chronologie/, 'timeline'],
      [/diaporama|diapositive|slides|présentation/, 'slides'],
      [/split|50\s*[/x×]\s*50|deux colonnes/, 'split'],
      [/éditorial|editorial|colonne unique/, 'editorial'],
      [/3 colonnes|trois colonnes|grille 3/, 'grid3'],
      [/vedette|bande de vignettes|filmstrip/, 'filmstrip'],
      [/barre latérale|sidebar|navigation latérale/, 'sidebar'],
      [/hero.*grille|grille.*hero/, 'hero-grid'],
    ];
    const layoutMatch = layoutChoice.find(([pattern]) => pattern.test(lower));
    if (layoutMatch && layoutMatch[1] !== project.layoutId) {
      setLayout(layoutMatch[1], historyKey);
      applied.push(`Composition changée : ${LAYOUT_MAP[layoutMatch[1]].name}`);
    }

    const supportChoice: [RegExp, SupportId][] = [
      [/mobile|iphone|téléphone|telephone|390\s*(?:px)?/, 'mobile'],
      [/tablette|ipad|820\s*(?:px)?/, 'tablet'],
      [/\ba4\b|impression|print/, 'a4'],
      [/16\s*[:x×/]\s*9|diaporama|écran de présentation/, 'slide'],
      [/desktop|bureau|ordinateur|1440\s*(?:px)?/, 'desktop'],
    ];
    const supportMatch = supportChoice.find(([pattern]) => pattern.test(lower));
    if (supportMatch && supportMatch[1] !== project.supportId) {
      setSupport(supportMatch[1], historyKey);
      applied.push(`Support adapté : ${SUPPORT_MAP[supportMatch[1]].name} (${SUPPORT_MAP[supportMatch[1]].detail})`);
    }

    if (/plus d'espace|plus d’air|plus d'air|espacement|aère|aere/.test(lower)) {
      const gap = Math.min(44, project.theme.gap + 8);
      update((p) => ({ ...p, theme: { ...p.theme, gap } }), historyKey);
      applied.push(`Gouttière augmentée à ${gap} px`);
    }
    if (/compact|resserre|rapproche/.test(lower)) {
      const gap = Math.max(8, project.theme.gap - 8);
      update((p) => ({ ...p, theme: { ...p.theme, gap } }), historyKey);
      applied.push(`Gouttière ramenée à ${gap} px`);
    }
    if (/marges plus larges|augmente les marges|plus d'air autour|plus d’espace autour|more padding/i.test(lower)) {
      const padding = Math.min(112, project.theme.padding + 12);
      update((p) => ({ ...p, theme: { ...p.theme, padding } }), 'agent-padding');
      applied.push(`Marges extérieures augmentées à ${padding} px`);
    }

    const variant = /fuchsia|magenta|rose vif/.test(lower) ? 'fuchsia'
      : /rose poudré|rose poudre|blush/.test(lower) ? 'rose'
      : /monochrome|noir et blanc|noir & blanc|gris seulement/.test(lower) ? 'mono'
        : /éditorial|editorial|apple|minimal|épuré|epure|sobre|simplifie/.test(lower) ? 'editorial'
          : /nuit|mode sombre|style sombre|en noir|noir mat/.test(lower) ? 'noir'
            : /retour.*original|style original/.test(lower) ? 'original' : null;
    if (variant) {
      const targets = /tout le site|tous les blocs|toutes les cases|ensemble du site/.test(lower)
        ? project.cells
        : selectedCell ? [selectedCell] : project.cells;
      const targetIds = new Set(targets.map((cell) => cell.id));
      update((p) => ({ ...p, cells: p.cells.map((cell) => targetIds.has(cell.id) ? { ...cell, settings: { ...cell.settings, designVariant: variant } } : cell) }), historyKey);
      applied.push(`Direction ${variant} appliquée à ${targets.length} bloc(s), sans toucher aux sources`);
    }

    const background = /fond(?: général)?\s+(?:noir|sombre)|toile\s+(?:noire|sombre)/.test(lower) ? 'noir'
      : /fond(?: général)?\s+(?:papier|crème|creme|beige)/.test(lower) ? 'papier'
        : /fond(?: général)?\s+(?:pointillé|pointille|points)/.test(lower) ? 'points'
          : /fond(?: général)?\s+(?:blanc|clair)|toile blanche/.test(lower) ? 'blanc' : null;
    if (background && background !== project.theme.background) {
      update((p) => ({ ...p, theme: { ...p.theme, background } }), historyKey);
      applied.push(`Fond du canevas changé : ${background}`);
    }

    if (/agrandis|plus grand|élargis|elargis|mets en vedette|hero principal/.test(lower) && selectedCell) {
        updateCell(selectedCell.id, (c) => ({ ...c, settings: { ...c.settings, colSpan: Math.min(2, LAYOUT_MAP[project.layoutId].cols), rowSpan: 2 } }), historyKey);
      applied.push(`« ${selectedFragment?.name ?? 'Bloc sélectionné'} » agrandi dans la grille`);
    }
    if (/hiérarchie|hierarchie|priorise|priorité visuelle|priorite visuelle|clarifie le parcours/.test(lower)) {
      if (selectedCell) {
        updateCell(selectedCell.id, (c) => ({ ...c, settings: { ...c.settings, colSpan: Math.max(2, c.settings.colSpan ?? 1), rowSpan: Math.max(2, c.settings.rowSpan ?? 1) } }));
        applied.push(`« ${selectedFragment?.name ?? 'Bloc sélectionné'} » mis en évidence pour clarifier la hiérarchie`);
      } else if (project.layoutId !== 'hero-grid' && project.layoutId !== 'bento') {
        setLayout('hero-grid');
        applied.push('Hiérarchie réorganisée en hero + preuves, contenu conservé');
      }
    }
    if (/réduis|reduit|plus petit|taille normale/.test(lower) && selectedCell) {
        updateCell(selectedCell.id, (c) => ({ ...c, settings: { ...c.settings, colSpan: undefined, rowSpan: undefined } }), historyKey);
      applied.push(`« ${selectedFragment?.name ?? 'Bloc sélectionné'} » remis au format du gabarit`);
    }

    const namedRepo = github.repos.find((r) => lower.includes(r.name.toLocaleLowerCase('fr-FR')));
    if (namedRepo && /ajoute|place|remplace|utilise|intègre|integre/.test(lower)) {
      const fragmentId = `gh:${namedRepo.name}`;
      if (/remplace|utilise|change/.test(lower) && selectedCell && !selectedCell.settings.locks.content) {
        assign(selectedCell.id, fragmentId, historyKey);
        applied.push(`Contenu remplacé par le vrai dépôt ${namedRepo.name}`);
      } else {
        placeFragment(fragmentId);
        applied.push(`Dépôt ${namedRepo.name} placé dans une case`);
      }
    }

    const addSection = /ajoute|ajouter|crée un bloc|crée une section|insère|insere/.test(lower) && /hero|section|bloc|titre|cta|appel à l'action|appel à l’action/.test(lower);
    if (addSection) {
      const cleanTitle = command.replace(/^(?:ajoute|ajouter|crée|cree|insère|insere)\s+(?:un|une|le|la)?\s*(?:bloc|section|hero|titre|cta|appel à l’action|appel à l'action)?\s*[:,-]?\s*/i, '').trim();
      const textFragment = makeTextFragment({
        eyebrow: /cta|appel à l'action|appel à l’action/i.test(lower) ? 'Prochaine étape' : 'Section ajoutée par AIME',
        title: cleanTitle.slice(0, 72) || 'Votre prochaine section',
        body: `Section ajoutée à la demande : « ${command} ». Modifiez son contenu dans l’inspecteur.`,
        tone: project.theme.background === 'noir' ? 'sombre' : 'clair',
      });
      update((p) => ({ ...p, customFragments: [...p.customFragments, textFragment], cells: [...p.cells, { id: uid('cell'), fragmentId: textFragment.id, settings: defaultSettings('text'), label: textFragment.text?.eyebrow }] }), historyKey);
      applied.push(`Nouvelle section éditable ajoutée : « ${textFragment.text?.title} »`);
    }

    if (!applied.length) {
      const invoked = participants.filter((a) => a.id !== 'noema').map((a) => `${a.name} (${a.specialty.toLowerCase()})`);
      return {
        text: `Je n’ai pas modifié le canevas : votre consigne ne désigne pas encore une action précise. ${invoked.length ? `${invoked.join(', ')} peuvent vous aider.` : ''} Essayez « Passe le support en mobile », « Rends le site monochrome », « Agrandis le bloc sélectionné » ou « Ajoute une section hero sur la réservation ».`,
        agents: participants,
        reactions: reactionsFor([]),
        assumptions: ['Rôles locaux fondés sur des documents GitHub publics ; aucun modèle externe ni mémoire privée n’est sollicité.'],
      };
    }

    return {
      text: `J’ai appliqué ${applied.length} changement${applied.length > 1 ? 's' : ''} au canevas. Les sources ne sont pas modifiées ; vous pouvez tout annuler avec ⌘Z.`,
      applied,
      agents: participants,
      reactions: reactionsFor(applied),
    };
  };

  const updateFragment = (id: string, patch: Partial<Fragment>) =>
    update((p) => ({ ...p, customFragments: p.customFragments.map((f) => (f.id === id ? { ...f, ...patch } : f)) }), `frag:${id}`);

  const openCrop = () => {
    let cell = selectedCell;
    if (!cell || fragments.get(cell.fragmentId ?? '')?.kind !== 'site') {
      cell = project.cells.find((c) => c.fragmentId && fragments.get(c.fragmentId)?.kind === 'site') ?? null;
      if (cell) setSelectedCellId(cell.id);
    }
    if (!cell) return showToast('Le recadrage vivant s’applique aux fragments web');
    if (cell.settings.locks.crop) return showToast('Cadrage verrouillé · déverrouillez-le dans l’inspecteur');
    setModal('crop');
  };

  const applyCrop = (crop: Rect | null, viewport: Viewport) => {
    if (!selectedCell) return;
    updateCell(selectedCell.id, (c) => ({ ...c, settings: { ...c.settings, crop, viewport } }));
    setModal(null);
    showToast(crop ? `Zone ${crop.w} × ${crop.h} appliquée` : 'Recadrage retiré · page entière');
  };

  const addText = () => addAndPlace(makeTextFragment(TEXT_TEMPLATES.note));

  const zoomBy = (d: number) => {
    setManualPct(clamp(zoom + d, 8, 200));
    setZoomMode('manual');
  };

  const toggleAudio = () => {
    setPlaying((v) => {
      if (v) stopTone();
      else playTone();
      return !v;
    });
  };

  const copyLink = () => {
    void navigator.clipboard?.writeText(readOnlyUrl(project));
    showToast('Lien de lecture seule copié');
  };

  /* ---------- raccourcis ---------- */

  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setModal('search');
      return;
    }
    if (modal || isTyping()) return;
    if (mode === 'present') {
      if (e.key === 'Escape' && !readOnly) setMode('edit');
      if (e.key === 'ArrowRight') setSlideIndex((i) => Math.min(project.cells.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setSlideIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }
    if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redo();
      return;
    }
    if (mod && (e.key === '=' || e.key === '+')) {
      e.preventDefault();
      zoomBy(10);
      return;
    }
    if (mod && e.key === '-') {
      e.preventDefault();
      zoomBy(-10);
      return;
    }
    if (mod && e.key === '0') {
      e.preventDefault();
      setZoomMode('fit');
      return;
    }
    if (mod) return;
    const k = e.key.toLowerCase();
    if (k === 'e') setMode('edit');
    else if (k === 'u') setMode('use');
    else if (k === 'p') setMode('present');
    else if (k === 'v') setTool('select');
    else if (k === 'h') setTool('pan');
    else if (k === 'l') setLayoutPicker((v) => !v);
    else if (k === 'c') openCrop();
    else if (k === 't') addText();
    else if (k === 'escape') {
      setSelectedCellId(null);
      setLayoutPicker(false);
    } else if ((k === 'delete' || k === 'backspace') && selectedCell && !selectedCell.settings.locks.content) clearCell(selectedCell.id);
    else if (layout.kind === 'slides' && k === 'arrowright') setSlideIndex((i) => Math.min(project.cells.length - 1, i + 1));
    else if (layout.kind === 'slides' && k === 'arrowleft') setSlideIndex((i) => Math.max(0, i - 1));
  };
  useEffect(() => {
    const on = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  const actions: SearchAction[] = [
    { id: 'autofill', label: 'Remplir avec GitHub', hint: 'Compléter les cellules vides avec tes sites en ligne', run: autoFill },
    { id: 'present', label: 'Présenter', hint: 'Plein écran (P)', run: () => setMode('present') },
    { id: 'home', label: 'Retour à l’accueil', hint: 'Choisir un autre projet ou modèle', run: onExit },
    ...LAYOUTS.map((l) => ({ id: `layout-${l.id}`, label: `Composition : ${l.name}`, hint: l.description, run: () => setLayout(l.id) })),
    ...SUPPORTS.map((s) => ({ id: `support-${s.id}`, label: `Support : ${s.name}`, hint: s.detail, run: () => setSupport(s.id) })),
  ];

  const library = (
    <Library
      repos={github.repos}
      syncStatus={github.status}
      syncedAt={github.syncedAt}
      onSync={() => void github.sync()}
      mediaFragments={MEDIA_FRAGMENTS}
      customFragments={project.customFragments}
      extraFragments={loadExtras()}
      usedIds={usedIds}
      onPlace={(id) => {
        placeFragment(id);
        if (!isLg) setLeftOpen(false);
      }}
      onOpenAdd={(t) => {
        setAddTab(t);
        setModal('add');
      }}
    />
  );

  const inspector = (
    <Inspector
      project={project}
      cell={selectedCell}
      fragment={selectedFragment}
      label={selectedGeom ? `${selectedGeom.label} · ${selectedGeom.role}` : ''}
      size={selectedGeom ? { w: selectedGeom.rect.w, h: selectedGeom.rect.h } : null}
      onUpdateProject={update}
      onUpdateCell={updateCell}
      onUpdateFragment={updateFragment}
      onOpenCrop={openCrop}
      onClearCell={clearCell}
      onRemoveCell={removeCell}
      onReplace={() => setModal('replace')}
      onAutoFill={autoFill}
      onAddCell={() => appendCell(null)}
      onSetLayout={setLayout}
      onSetSupport={setSupport}
      onSetArrangement={setArrangement}
      onPreview={() => setMode('use')}
      onDeselect={() => setSelectedCellId(null)}
      focusContentKey={contentFocusKey}
    />
  );

  if (readOnly) {
    return (
      <PresentOverlay
        project={project}
        fragments={fragments}
        slideIndex={slideIndex}
        onSlide={setSlideIndex}
        onExit={onExit}
        readOnly
        onDuplicate={() => onDuplicate(project)}
        replayKey={replayKey}
        playing={playing}
        onToggleAudio={toggleAudio}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#f5f5f7] text-gray-900">
      <TopBar
        project={project}
        projectsCount={projectsCount}
        fragmentsCount={fragments.size}
        zoom={zoom}
        onZoomIn={() => zoomBy(10)}
        onZoomOut={() => zoomBy(-10)}
        onFit={() => setZoomMode('fit')}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onHome={() => { saveProject(project); onSaved(project); onExit(); }}
        onDuplicate={() => onDuplicate(project)}
        onOpenSearch={() => setModal('search')}
        onOpenAdd={() => {
          setAddTab('url');
          setModal('add');
        }}
        onOpenShare={() => setModal('share')}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onToggleLeft={() => setLeftOpen((v) => !v)}
        onToggleRight={() => setRightOpen((v) => !v)}
        onFocus={() => {
          const both = leftOpen || rightOpen;
          setLeftOpen(!both);
          setRightOpen(!both);
        }}
        onOpenViewer={onOpenViewer ? () => { saveProject(project); onSaved(project); onOpenViewer(); } : undefined}
        onOpenDesk={onOpenDesk ? () => { saveProject(project); onSaved(project); onOpenDesk(); } : undefined}
        onOpenSystems={onOpenSystems ? () => { saveProject(project); onSaved(project); onOpenSystems(); } : undefined}
      />

      <div className="relative flex min-h-0 flex-1">
        {leftOpen && (isLg ? library : <Drawer side="left" onClose={() => setLeftOpen(false)}>{library}</Drawer>)}
        <Canvas
          project={project}
          fragments={fragments}
          mode={mode}
          view={view}
          onViewChange={setView}
          tool={tool}
          onToolChange={setTool}
          zoom={zoom}
          onFitChange={setFitPct}
          onZoomBy={zoomBy}
          selectedCellId={selectedCellId}
          onSelectCell={(id) => {
            setSelectedCellId(id);
            if (id && !isXl && view === 'graph') setRightOpen(true);
          }}
          slideIndex={slideIndex}
          onSlideChange={setSlideIndex}
          replayKey={replayKey}
          playingAudio={playing}
          onToggleAudio={toggleAudio}
          onDropFragment={(cellId, fid) => {
            assign(cellId, fid);
            showToast(`« ${fragments.get(fid)?.name ?? 'Fragment'} » placé`);
          }}
          onDropNew={(fid) => appendCell(fid)}
          onSwapCells={swapCells}
          onUpdateCell={updateCell}
          onBlockAction={blockAction}
          remixAvailable={otherProjects.length > 0}
          onAgentCommand={executeCanvasAgent}
          onUndo={undo}
          canUndo={canUndo}
          onSetLayout={setLayout}
          onSetSupport={setSupport}
          onSetArrangement={setArrangement}
          onOpenCrop={openCrop}
          onAddText={addText}
          onAddCell={() => appendCell(null)}
          layoutPickerOpen={layoutPicker}
          onLayoutPicker={setLayoutPicker}
        />
        {rightOpen && (isXl ? inspector : <Drawer side="right" onClose={() => setRightOpen(false)}>{inspector}</Drawer>)}
        {mode === 'use' && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/85 px-3 py-1.5 text-[11px] text-white shadow-lg">
            Mode UTILISER · les sites et médias sont interactifs — <span className="font-mono">E</span> pour éditer
          </div>
        )}
      </div>

      <BottomBar
        project={project}
        mode={mode}
        onMode={setMode}
        zoom={zoom}
        onZoomIn={() => zoomBy(10)}
        onZoomOut={() => zoomBy(-10)}
        onFit={() => setZoomMode('fit')}
        onExport={() => setModal('export')}
        onCopyLink={copyLink}
        lastSavedAt={lastSavedAt}
        historyCount={historyCount}
      />

      {(modal === 'search' || modal === 'replace') && (
        <SearchModal
          onClose={() => setModal(null)}
          fragments={searchable}
          actions={modal === 'search' ? actions : []}
          onPick={(f) => placeFragment(f.id)}
          title={modal === 'replace' ? 'Remplacer le contenu de la cellule…' : undefined}
        />
      )}
      {modal === 'add' && <AddModal initialTab={addTab} repos={github.repos} onClose={() => setModal(null)} onAdd={addAndPlace} onPlaceExisting={placeFragment} />}
      {modal === 'share' && <ShareModal project={project} onClose={() => setModal(null)} onCopied={() => showToast('Lien copié dans le presse-papier')} />}
      {modal === 'export' && <ExportModal project={project} fragments={fragments} onClose={() => setModal(null)} />}
      {modal === 'crop' && selectedCell && selectedFragment?.kind === 'site' && (
        <LiveCropModal
          fragment={selectedFragment}
          settings={selectedCell.settings}
          cellAspect={selectedGeom ? selectedGeom.rect.w / Math.max(1, selectedGeom.rect.h) : 16 / 10}
          onApply={applyCrop}
          onClose={() => setModal(null)}
        />
      )}

      {blockDialog && (() => {
        const c = project.cells.find((cell) => cell.id === blockDialog.cellId);
        const f = c?.fragmentId ? fragments.get(c.fragmentId) : null;
        if (!c || !f) return null;
        return <BlockDialogs
          mode={blockDialog.mode}
          cell={c}
          fragment={f}
          projects={otherProjects}
          resolve={(p, id) => p.customFragments.find((item) => item.id === id) ?? fragments.get(id) ?? null}
          onClose={() => setBlockDialog(null)}
          onRemix={(sourceProject, source) => remixWith(sourceProject, source, c.id)}
          onDesign={(variant) => {
            updateCell(c.id, (cell) => ({ ...cell, settings: { ...cell.settings, designVariant: variant } }));
            setBlockDialog(null);
            showToast('Design transformé · source conservée');
          }}
        />;
      })()}

      {mode === 'present' && (
        <PresentOverlay
          project={project}
          fragments={fragments}
          slideIndex={slideIndex}
          onSlide={setSlideIndex}
          onExit={() => setMode('edit')}
          onDuplicate={() => onDuplicate(project)}
          replayKey={replayKey}
          playing={playing}
          onToggleAudio={toggleAudio}
        />
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
