import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Shuffle, WandSparkles, Palette, Crop, Eye, ExternalLink, Copy, Eraser, Trash2, Type, Play } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Cell, Fragment } from '../../types';

export type BlockAction = 'remix' | 'metamorphose' | 'design' | 'crop' | 'preview' | 'source' | 'replace' | 'edit-text' | 'duplicate' | 'clear' | 'delete';

export function BlockMenu({
  cell,
  fragment,
  scale,
  lift,
  remixAvailable,
  onAction,
  onOpenChange,
}: {
  cell: Cell;
  fragment: Fragment | null;
  scale: number;
  lift: boolean;
  remixAvailable: boolean;
  onAction: (action: BlockAction, cellId: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); e.stopPropagation(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape, true);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape, true); };
  }, [open]);

  const actions: { id: BlockAction; label: string; icon: typeof Palette; group?: boolean }[] = [];
  if (fragment) {
    if (remixAvailable && !cell.settings.locks.content) actions.push({ id: 'remix', label: 'Remixer avec un projet', icon: Shuffle });
    if (!cell.settings.locks.content) actions.push({ id: 'metamorphose', label: 'Métamorphoser · créer une variante', icon: WandSparkles });
    actions.push({ id: 'design', label: 'Transformer le design', icon: Palette });
    if (fragment.kind === 'site' && !cell.settings.locks.crop) actions.push({ id: 'crop', label: 'Recadrage vivant', icon: Crop });
    if (fragment.kind === 'video' || fragment.kind === 'audio') actions.push({ id: 'preview', label: 'Prévisualiser / lire', icon: Play });
    else if (fragment.kind === 'site' || fragment.kind === 'image' || fragment.kind === 'model3d') actions.push({ id: 'preview', label: 'Prévisualiser', icon: Eye });
    if (fragment.kind === 'text' && !cell.settings.locks.content) actions.push({ id: 'edit-text', label: 'Éditer le texte', icon: Type });
    if (!cell.settings.locks.content) actions.push({ id: 'replace', label: 'Remplacer le contenu…', icon: Shuffle });
    if (fragment.repo || (fragment.url && !fragment.url.startsWith('blob:') && !fragment.url.startsWith('data:'))) actions.push({ id: 'source', label: 'Ouvrir la source', icon: ExternalLink });
    if (!cell.settings.locks.content) actions.push({ id: 'duplicate', label: 'Dupliquer la case', icon: Copy, group: true });
    if (!cell.settings.locks.content) actions.push({ id: 'clear', label: 'Vider la case', icon: Eraser });
  }
  if (!cell.settings.locks.position && !cell.settings.locks.content) actions.push({ id: 'delete', label: 'Supprimer la case', icon: Trash2, group: !fragment });

  const inv = 1 / (scale || 1);
  const buttonStyle: CSSProperties = { top: 10 * inv, right: 10 * inv, transform: `scale(${inv})`, transformOrigin: 'top right' };
  const panelStyle: CSSProperties = lift
    ? { bottom: 42 * inv, right: 10 * inv, transform: `scale(${inv})`, transformOrigin: 'bottom right' }
    : { top: 42 * inv, right: 10 * inv, transform: `scale(${inv})`, transformOrigin: 'top right' };

  return (
    <div ref={ref} className="contents" onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={`Options de ${fragment?.name ?? 'la cellule'}`}
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); if (!open) onOpenChange?.(true); setOpen((v) => !v); }}
        className="absolute z-40 flex h-7 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white/95 text-gray-800 shadow-sm transition-all hover:bg-black hover:text-white focus-visible:opacity-100"
        style={buttonStyle}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div role="menu" aria-label={`Actions possibles pour ${fragment?.name ?? 'cette cellule'}`} style={panelStyle} className="absolute z-50 w-[242px] rounded-xl border border-gray-200 bg-white p-1.5 text-left shadow-2xl">
          <div className="truncate px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{fragment?.name ?? 'Cellule vide'} · possibilités</div>
          {actions.map(({ id, label, icon: Icon, group }) => (
            <button key={id} type="button" role="menuitem" onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(id, cell.id); }} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[12px] text-gray-700 hover:bg-gray-100 hover:text-black ${group ? 'mt-1 border-t border-gray-100 pt-2.5' : ''}`}>
              <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
            </button>
          ))}
          {!actions.length && <p className="px-2 py-2 text-[11px] text-gray-400">Cette case est verrouillée.</p>}
        </div>
      )}
    </div>
  );
}