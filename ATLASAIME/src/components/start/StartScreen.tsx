import { useEffect, useMemo, useRef, useState } from 'react';
import type { LayoutId } from '../../types';
import { createProject } from '../../data/templates';
import { collectionOf, COLLECTIONS, githubRepoUrl, type RepoSnapshot } from '../../data/repos';
import { WorkspaceNav } from '../ui/WorkspaceNav';
import { RepoPreview } from '../ui/RepoPreview';
import { LayoutThumb } from '../ui/LayoutThumb';
import { CompareView } from '../viewer/CompareView';
import { buildCatalog } from '../../data/catalog';
import { BackupTools } from './BackupTools';
import { AdvancedStartScreen, type StartScreenProps } from './AdvancedStartScreen';

export type { StartScreenProps } from './AdvancedStartScreen';
export const SIMPLE_FORMATS: { id: LayoutId; name: string; hint: string }[] = [
  { id: 'editorial', name: 'Page', hint: 'Un parcours à faire défiler.' },
  { id: 'bento', name: 'Grille', hint: 'Vos projets côte à côte.' },
  { id: 'slides', name: 'Diaporama', hint: 'Une présentation séquencée.' },
];
export function StartScreen(props: StartScreenProps & { initialTab?: 'projects' | 'compositions' }) {
  const { github, recent, onOpenViewer, onOpenDesk, onCreate, onOpen, onRestored } = props;
  const chooser = useRef<HTMLElement>(null);
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [choosing, setChoosing] = useState(false);
  const [format, setFormat] = useState<LayoutId>('editorial');
  const [name, setName] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [compare, setCompare] = useState(false);
  const [study, setStudy] = useState<RepoSnapshot | null>(null);
  useEffect(() => { if (choosing) chooser.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [choosing]);
  const compositions = props.initialTab === 'compositions';
  const repos = useMemo(() => github.repos.filter(r => r.size > 0 && (!domain || collectionOf(r) === domain) && `${r.name} ${r.description} ${r.siteTitle}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr'))), [github.repos, domain, query]);
  const compose = (ids = selected.map(n => `gh:${n}`)) => onCreate(createProject({ name: name.trim() || 'Nouvelle composition', typeId: format === 'slides' ? 'presentation' : 'archive', layoutId: format, supportId: format === 'slides' ? 'slide' : 'desktop', explicit: ids, repos: github.repos }));
  if (advanced) return <div className="relative"><button type="button" onClick={() => setAdvanced(false)} className="fixed bottom-4 right-4 z-[100] rounded-full bg-black px-4 py-3 text-sm text-white">Retour à la vue simple</button><AdvancedStartScreen {...props} /></div>;
  if (compare) return <CompareView items={buildCatalog(github.repos.filter(r => selected.includes(r.name)), [], [], []).filter(item => item.repo && selected.includes(item.repo))} onClose={() => setCompare(false)} />;
  return <div className="h-screen overflow-y-auto bg-[#f5f5f7] text-gray-900">
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 sm:px-8">
      <a href="/" className="font-semibold" title="Voir le portfolio public">ATLAS × AIME ↗</a>
      <WorkspaceNav active={compositions ? 'viewer' : 'home'} onNavigate={page => { if (page === 'desk') onOpenDesk(); else if (page === 'viewer') onOpenViewer(); else props.onHome?.(); }} />
      <button type="button" onClick={() => setChoosing(true)} className="rounded-xl bg-black px-4 py-2 text-sm text-white">Créer une composition</button>
    </header>
    <main className="mx-auto max-w-[1400px] space-y-8 px-4 py-8 sm:px-8">
      <div><h1 className="text-3xl font-semibold tracking-tight">{compositions ? 'Mes compositions' : 'Projets'}</h1><p className="mt-2 text-sm text-gray-500">{compositions ? 'Reprenez une présentation ou créez-en une nouvelle.' : 'Retrouvez vos créations. Sélectionnez des projets pour les comparer ou les présenter.'}</p></div>
      {recent.length > 0 && <section aria-label="Compositions récentes"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{compositions ? 'Toutes les compositions' : 'Reprendre'}</h2>{!compositions && <button type="button" onClick={onOpenViewer} className="text-sm underline">Tout voir · {recent.length}</button>}</div>
        <div className={compositions ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4' : 'flex gap-4 overflow-x-auto pb-3'}>{(compositions ? recent : recent.slice(0, 3)).map(p => <article key={p.id} className="min-w-[230px] rounded-xl border border-gray-200 bg-white p-3"><button type="button" onClick={() => onOpen(p)} className="w-full text-left"><LayoutThumb layoutId={p.layoutId} /><h3 className="mt-3 truncate font-medium">{p.name}</h3></button>{compositions && <details className="mt-2 text-xs"><summary className="cursor-pointer">Options</summary><button type="button" onClick={() => props.onDuplicate(p)} className="mr-3 py-2 underline">Dupliquer</button><button type="button" onClick={() => { if (window.confirm(`Supprimer « ${p.name} » ?`)) props.onDelete(p.id); }} className="py-2 text-red-700 underline">Supprimer</button></details>}</article>)}</div>
      </section>}
      {compositions && !recent.length && <p>Aucune composition. Commencez par sélectionner des projets ou choisissez une présentation vide.</p>}
      {choosing && <section ref={chooser} aria-label="Choisir une présentation" className="rounded-2xl border border-gray-300 bg-white p-5"><div className="flex justify-between"><h2 className="font-semibold">2 · Choisir une présentation</h2><button type="button" onClick={() => setChoosing(false)} className="text-sm underline">Annuler</button></div><p className="my-3 text-sm text-gray-500">{selected.length} projet(s) sélectionné(s). Les blocs resteront modifiables.</p><div className="grid gap-3 sm:grid-cols-3">{SIMPLE_FORMATS.map(f => <button key={f.id} type="button" aria-pressed={format === f.id} onClick={() => setFormat(f.id)} className={`rounded-xl border p-4 text-left ${format === f.id ? 'border-black bg-gray-50' : 'border-gray-200'}`}><strong>{f.name}</strong><span className="mt-1 block text-sm text-gray-500">{f.hint}</span></button>)}</div><label className="my-4 block text-sm">Nom de la composition<input value={name} onChange={e => setName(e.target.value)} placeholder="Nouvelle composition" className="mt-2 block w-full rounded-lg border p-2" /></label><button type="button" onClick={() => compose()} className="rounded-lg bg-black px-4 py-2 text-sm text-white">3 · Ajuster dans l’atelier</button></section>}
      {!compositions && <section aria-label="Catalogue des projets" className="space-y-5"><div className="flex flex-wrap gap-3"><label className="min-w-[200px] flex-1"><span className="sr-only">Rechercher un projet</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un projet…" className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm" /></label><select aria-label="Domaine" value={domain} onChange={e => setDomain(e.target.value)} className="rounded-xl border border-gray-200 bg-white p-3 text-sm"><option value="">Tous les domaines</option>{COLLECTIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select><button type="button" disabled={github.status === 'loading'} onClick={() => void github.sync()} className="text-xs underline">{github.status === 'loading' ? 'Actualisation…' : 'Actualiser'}</button></div>
        <p className="text-xs text-gray-500">1 · Sélectionner les projets · {repos.length} résultat(s){github.status === 'error' ? ' · Actualisation impossible, données précédentes conservées.' : ''}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{repos.map(r => <article key={r.name} className="overflow-hidden rounded-2xl border border-gray-200 bg-white"><div className="relative aspect-[16/10]"><RepoPreview repo={r} /></div><div className="p-4"><h2 className="truncate font-semibold">{r.name}</h2><p className="mt-1 line-clamp-2 min-h-10 text-sm text-gray-500">{r.siteDescription || r.description || r.siteTitle || 'Rôle à documenter.'}</p><div className="mt-4 flex justify-between gap-2"><a href={r.homepage && r.embed !== 'offline' ? r.homepage : githubRepoUrl(r.name)} target="_blank" rel="noreferrer" className="text-sm underline">Ouvrir{r.homepage && r.embed !== 'offline' ? '' : ' le code'}</a><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(r.name)} onChange={() => setSelected(list => list.includes(r.name) ? list.filter(n => n !== r.name) : [...list, r.name])} />Sélectionner<span className="sr-only"> {r.name}</span></label></div><details className="mt-3 text-xs text-gray-500"><summary className="cursor-pointer">Fiche du projet</summary><p className="my-2">{r.embed === 'none' ? 'Aucun site associé.' : r.embed === 'offline' ? 'Site indiqué hors ligne.' : 'Adresse déclarée · état à vérifier.'}</p><button type="button" onClick={() => { setStudy(r); setSelected([r.name]); setChoosing(true); }} className="underline">Préparer une présentation de ce projet</button></details></div></article>)}</div>
        {!repos.length && <p className="py-8 text-sm text-gray-500">Aucun projet ne correspond à ces filtres.</p>}
      </section>}
      {study && choosing && <p className="text-xs text-gray-500">Présentation de {study.name} : ajustez les textes dans l’atelier.</p>}
      {onRestored && <details className="rounded-xl border border-gray-200 bg-white p-4"><summary className="cursor-pointer text-sm">Sauvegardes et restauration</summary><div className="mt-4"><BackupTools onRestored={onRestored} /></div></details>}
      <details className="rounded-xl border border-gray-200 bg-white p-4"><summary className="cursor-pointer text-sm">Outils avancés</summary><p className="my-3 text-sm text-gray-500">Brief local, assemblages par domaine, modèles, fusions proposées, design et estimations documentaires.</p><button type="button" onClick={() => setAdvanced(true)} className="text-sm underline">Ouvrir les outils avancés</button></details>
      <p className="pb-20 text-xs text-gray-500">Sauvegarde dans ce navigateur uniquement. Les maquettes ne prouvent pas le fonctionnement des projets.</p>
    </main>
    {selected.length > 0 && <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl"><span className="text-sm">{selected.length} sélectionné(s)</span><button type="button" onClick={() => setCompare(true)} className="text-sm underline">Comparer</button><button type="button" onClick={() => { setChoosing(true); chooser.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="rounded-lg bg-black px-4 py-2 text-sm text-white">Composer</button><button type="button" onClick={() => setSelected([])} className="text-xs underline">Effacer</button></div>}
  </div>;
}
