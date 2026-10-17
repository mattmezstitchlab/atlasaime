import { useState } from 'react';
import { X, Shuffle, Palette, Check, ArrowRight } from 'lucide-react';
import type { Cell, Fragment, Project } from '../../types';
import { cn } from '../../utils/cn';

const VARIANTS = [
  { id: 'original', name: 'Original', desc: 'Source intacte', bg: 'bg-white' },
  { id: 'mono', name: 'Monochrome', desc: 'Gris & contraste', bg: 'bg-gray-300' },
  { id: 'rose', name: 'Azur', desc: 'Teinte douce', bg: 'bg-[#d6e6ff]' },
  { id: 'fuchsia', name: 'Bleu', desc: 'Accent net', bg: 'bg-[#0071e3]' },
  { id: 'editorial', name: 'Éditorial', desc: 'Nuance & netteté', bg: 'bg-[#b4b2a9]' },
  { id: 'noir', name: 'Nuit', desc: 'Contraste sombre', bg: 'bg-gray-950' },
] as const;

export function BlockDialogs({
  mode,
  cell,
  fragment,
  projects,
  resolve,
  onClose,
  onRemix,
  onDesign,
}: {
  mode: 'remix' | 'design';
  cell: Cell;
  fragment: Fragment;
  projects: Project[];
  resolve: (p: Project, id: string) => Fragment | null;
  onClose: () => void;
  onRemix: (project: Project, fragment: Fragment) => void;
  onDesign: (variant: NonNullable<Cell['settings']['designVariant']>) => void;
}) {
  const available = projects.filter((p) => p.cells.some((c) => c.fragmentId));
  const [projectId, setProjectId] = useState(available[0]?.id ?? '');
  const [fragmentId, setFragmentId] = useState('');
  const p = available.find((v) => v.id === projectId);
  const candidates = p?.cells.map((c) => c.fragmentId && resolve(p, c.fragmentId)).filter((f): f is Fragment => !!f) ?? [];
  const selected = candidates.find((f) => f.id === fragmentId) ?? candidates[0];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={mode === 'remix' ? 'Remixer avec un projet' : 'Transformer le design'} className="animate-pop w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">{mode === 'remix' ? <Shuffle className="h-4 w-4" /> : <Palette className="h-4 w-4" />}<h2 className="text-[15px] font-semibold">{mode === 'remix' ? 'Remixer avec un projet' : 'Transformer le design'}</h2></div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-black"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">
          <p className="mb-5 text-[12px] leading-relaxed text-gray-500">{mode === 'remix' ? `Source : ${fragment.name}. On crée une nouvelle case avec le contenu d’un autre projet et le style de cette case ; les deux projets sources restent intacts.` : `Le contenu de ${fragment.name} et son URL ne changent pas. Choisissez une enveloppe visuelle réversible (annuler : ⌘Z).`}</p>
          {mode === 'remix' ? (
            <>
              <label className="text-[11px] font-semibold text-gray-600">Projet source</label>
              <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setFragmentId(''); }} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-black">
                {available.map((source) => <option key={source.id} value={source.id}>{source.name} · {source.cells.filter((c) => c.fragmentId).length} fragments</option>)}
              </select>
              <div className="mt-4 max-h-56 space-y-1 overflow-y-auto">
                {candidates.map((f) => <button key={f.id} type="button" onClick={() => setFragmentId(f.id)} className={cn('flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left', selected?.id === f.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:bg-gray-50')}><span className="min-w-0"><span className="block truncate text-[12px] font-medium">{f.name}</span><span className="block truncate text-[10px] text-gray-400">{f.subtitle}</span></span>{selected?.id === f.id && <Check className="h-4 w-4 shrink-0" />}</button>)}
              </div>
              {!candidates.length && <p className="py-4 text-[12px] text-gray-400">Ce projet n’a pas de fragment disponible.</p>}
              <button type="button" disabled={!p || !selected} onClick={() => { if (p && selected) onRemix(p, selected); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-gray-800 disabled:opacity-40">Créer le remix <ArrowRight className="h-3.5 w-3.5" /></button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {VARIANTS.map((v) => <button key={v.id} type="button" onClick={() => onDesign(v.id)} className={cn('rounded-xl border p-2 text-left hover:border-black', cell.settings.designVariant === v.id ? 'border-black ring-1 ring-black' : 'border-gray-200')}>
                <span className={cn('flex h-16 items-end rounded-lg p-2', v.bg)}><span className={cn('h-3 w-14 rounded-full', v.id === 'fuchsia' || v.id === 'noir' ? 'bg-white/80' : 'bg-black/70')} /></span>
                <span className="mt-2 block text-[12px] font-semibold">{v.name}</span>
                <span className="text-[10px] text-gray-500">{v.desc}</span>
              </button>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}