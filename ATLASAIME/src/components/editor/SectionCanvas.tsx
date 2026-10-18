import { defaultSettings } from '../../data/templates';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Cell, Fragment, Project } from '../../types';
import { FragmentView } from './FragmentView';

export const sectionTitle = (cell: Cell, index: number, fragments: Map<string, Fragment>) => {
  const f = cell.fragmentId ? fragments.get(cell.fragmentId) : undefined;
  return cell.label || f?.text?.title || f?.name || `Section ${index + 1}`;
};
export function insertDocumentSection(project: Project, index: number, id: string): Project {
  const cells = [...project.cells];
  cells.splice(Math.max(0, Math.min(index, cells.length)), 0, { id, fragmentId: null, settings: defaultSettings() });
  return { ...project, cells };
}
export function moveSection(project: Project, id: string, delta: number): Project {
  const cells = [...project.cells]; const i = cells.findIndex(c => c.id === id); const j = i + delta;
  if (i < 0 || j < 0 || j >= cells.length || cells[i].settings.locks.position || cells[j].settings.locks.position) return project;
  [cells[i], cells[j]] = [cells[j], cells[i]];
  return { ...project, cells };
}
export function SectionCanvas({ project, fragments, selectedId, onSelect, onInsert, onMove, onSettings, preview, library, libraryOpen = false, onLibraryChange }: {
  library?: ReactNode; libraryOpen?: boolean; onLibraryChange?: (open: boolean) => void;
  project: Project; fragments: Map<string, Fragment>; selectedId: string | null;
  onSelect: (id: string | null) => void; onInsert: (index: number) => void;
  onMove: (id: string, delta: number) => void; onSettings: () => void; preview: boolean;
}) {
  const [slide, setSlide] = useState(0);
  const [planOpen, setPlanOpen] = useState(false);
  const nodes = useRef(new Map<string, HTMLElement>());
  useEffect(() => { if (selectedId) nodes.current.get(selectedId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [selectedId]);
  const select = (id: string) => { onSelect(id); setPlanOpen(false); };
  const tabs = <div role="group" aria-label="Panneau de l’atelier" className="flex gap-2 border-b p-3"><button type="button" aria-pressed={!libraryOpen} onClick={() => onLibraryChange?.(false)}>Plan</button><button type="button" aria-pressed={libraryOpen} onClick={() => onLibraryChange?.(true)}>Bibliothèque</button></div>;
  const plan = <nav aria-label="Plan de la présentation" className="space-y-2 p-4">
    <button type="button" onClick={() => onSelect(null)} className="mb-3 text-left font-semibold">{project.name}</button>
    <ol className="space-y-2">{project.cells.map((c, i) => <li key={c.id} className={`rounded-lg border p-2 ${selectedId === c.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
      <button type="button" aria-current={selectedId === c.id ? 'true' : undefined} onClick={() => select(c.id)} className="w-full truncate text-left text-sm">{i + 1}. {sectionTitle(c, i, fragments)}</button>
      <div className="mt-2 flex gap-3 text-xs"><button type="button" disabled={i === 0 || c.settings.locks.position || project.cells[i-1]?.settings.locks.position} onClick={() => onMove(c.id, -1)} className="underline disabled:opacity-30">Monter</button><button type="button" disabled={i === project.cells.length - 1 || c.settings.locks.position || project.cells[i+1]?.settings.locks.position} onClick={() => onMove(c.id, 1)} className="underline disabled:opacity-30">Descendre</button></div>
    </li>)}</ol>
    <button type="button" onClick={() => { onInsert(project.cells.length); setPlanOpen(false); }} className="mt-4 text-sm underline">+ Ajouter une section</button>
  </nav>;
  const visibleCells = preview && project.layoutId === 'slides' ? project.cells.slice(Math.min(slide, Math.max(0, project.cells.length - 1)), Math.min(slide, Math.max(0, project.cells.length - 1)) + 1) : project.cells;
  const insert = (index: number) => !preview && <button type="button" aria-label={`Ajouter une section à la position ${index + 1}`} onClick={() => onInsert(index)} className="my-3 w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-black hover:text-black">+ Ajouter ici</button>;
  return <div className="flex min-w-0 flex-1 overflow-hidden">
    {!preview && <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-gray-200 bg-white lg:block">{tabs}{libraryOpen ? library : plan}</aside>}
    <div className="min-w-0 flex-1 overflow-y-auto bg-gray-100 p-3 sm:p-6" aria-label={preview ? 'Aperçu de la présentation' : 'Document à sections'}>
      {!preview && <div className="mb-3 flex justify-between text-sm"><button type="button" onClick={() => setPlanOpen(v => !v)} className="underline lg:hidden">Plan des sections</button><button type="button" onClick={onSettings} className="underline">Réglages de la sélection</button></div>}
      {!preview && (planOpen || libraryOpen) && <div className="mb-4 rounded-xl border bg-white lg:hidden">{tabs}{libraryOpen ? library : plan}</div>}
      <div className={`mx-auto max-w-4xl ${project.theme.background === 'noir' ? 'bg-black text-white' : 'bg-white text-gray-900'} p-3 shadow-sm sm:p-6`}>
        {insert(0)}
        {preview && project.layoutId === 'slides' && <div className="mb-4 flex justify-between text-sm"><button type="button" disabled={slide <= 0} onClick={() => setSlide(v => Math.max(0, v-1))}>Précédente</button><span>{Math.min(slide+1,project.cells.length)} / {project.cells.length}</span><button type="button" disabled={slide >= project.cells.length - 1} onClick={() => setSlide(v => Math.min(project.cells.length - 1, v+1))}>Suivante</button></div>}
        <div className={project.layoutId === 'bento' ? 'grid gap-4 md:grid-cols-2' : 'space-y-4'}>
        {visibleCells.map((c) => {
          const i = project.cells.findIndex(item => item.id === c.id);
          const f = c.fragmentId ? fragments.get(c.fragmentId) : undefined;
          return <div key={c.id}>
            <section ref={el => { if (el) nodes.current.set(c.id, el); else nodes.current.delete(c.id); }} aria-label={`Section ${i+1} : ${sectionTitle(c, i, fragments)}`} className={`relative rounded-lg ${!preview ? `border-2 ${selectedId === c.id ? 'border-blue-600' : 'border-gray-200'}` : ''}`}>
              {!preview && <button type="button" onClick={() => select(c.id)} className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs ${selectedId === c.id ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-600'}`}><span>{i+1} · {sectionTitle(c, i, fragments)}</span><span>Modifier</span></button>}
              <div className={`relative ${f?.kind === 'text' ? 'min-h-64' : 'h-[360px] sm:h-[480px]'}`} onClick={() => { if (!preview) select(c.id); }}>
                {f?.text ? <div className="px-5 py-10 sm:px-10">{f.text.eyebrow && <p className="mb-3 text-xs uppercase tracking-wider opacity-60">{f.text.eyebrow}</p>}<h2 className="text-3xl font-semibold">{f.text.title}</h2>{f.text.body && <p className="mt-5 whitespace-pre-wrap leading-relaxed opacity-80">{f.text.body}</p>}</div> : f ? <FragmentView fragment={f} settings={{ ...c.settings, preview: 'capture' }} interactive={preview} lite={!preview} chips={false} /> : <div className="flex h-full items-center justify-center text-sm text-gray-500">{preview ? 'Section vide' : 'Section vide · sélectionnez-la pour ajouter du contenu'}</div>}
                {c.label && f?.kind !== 'text' && <p className="absolute inset-x-0 bottom-0 bg-white/95 p-3 text-sm text-gray-700">{c.label}</p>}
              </div>
            </section>
            {insert(i+1)}
          </div>;
        })}
        </div>
        {project.cells.length === 0 && <p className="py-16 text-center text-sm text-gray-500">Votre présentation est vide.</p>}
      </div>
    </div>
  </div>;
}
