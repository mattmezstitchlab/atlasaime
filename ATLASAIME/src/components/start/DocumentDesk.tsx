import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, FileText, Folder, Search, Users, X, ChevronDown } from 'lucide-react';
import { AGENTS, WELCOME_MESSAGE } from '../../data/agents';
import { PUBLIC_DOCUMENTS } from '../../data/publicDocuments';
import type { DocumentCategory, PublicDocument } from '../../data/publicDocuments';
import { AtlasLogo } from '../ui/controls';
import { cn } from '../../utils/cn';
import { WorkspaceNav } from '../ui/WorkspaceNav';

const CATEGORIES: { id: DocumentCategory | 'tous'; label: string }[] = [
  { id: 'tous', label: 'Tout le bureau' },
  { id: 'manifestes', label: 'Manifestes' },
  { id: 'audits', label: 'Audits' },
  { id: 'memoire', label: 'Mémoires' },
  { id: 'soul', label: 'Soul & constitution' },
  { id: 'instructions', label: 'Instructions & prompts' },
  { id: 'design', label: 'Design systems' },
  { id: 'architecture', label: 'Architecture' },
];

const TOPICS: { id: string; re: RegExp }[] = [
  { id: 'IA & agents', re: /agent|noema|soul|prompt|ia|assistant|constitution/i },
  { id: 'Mémoire & temps', re: /memory|memoire|mémoire|archive|timeline|temps|temporal|chronolog|history/i },
  { id: 'Design & création', re: /design|color|couleur|art|studio|media|média|composition|broder|chromat/i },
  { id: 'Mariage & événements', re: /mariage|wedding|event|événement|rsvp|dispoo|ceremoni/i },
  { id: 'Relations & monde', re: /relation|network|monde|relia|profile|profil|ripple/i },
  { id: 'Preuve & gouvernance', re: /audit|preuve|proof|permission|consent|validation|privacy|governance/i },
];

function topicFor(d: PublicDocument): string {
  const source = `${d.path} ${d.repo}`;
  return TOPICS.find((t) => t.re.test(source))?.id ?? 'Autres';
}

function titleOf(d: PublicDocument) {
  return d.path.split('/').pop()?.replace(/\.(mdx?|tsx?|jsx?|css|html|txt|toml)$/i, '').replace(/[-_]/g, ' ') ?? d.path;
}

export function DocumentDesk({ onBack, onOpenViewer, onOpenSystems }: { onBack: () => void; onOpenViewer: () => void; onOpenSystems: () => void }) {
  const [category, setCategory] = useState<DocumentCategory | 'tous'>('tous');
  const [topic, setTopic] = useState('Tous les sujets');
  const [repo, setRepo] = useState('Tous les projets');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'documents' | 'agents'>('documents');
  const [chosen, setChosen] = useState<PublicDocument | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(48);

  const projects = useMemo(() => [...new Set(PUBLIC_DOCUMENTS.map((d) => d.repo))].sort(), []);
  const documents = useMemo(() => PUBLIC_DOCUMENTS.filter((d) => {
    if (category !== 'tous' && d.category !== category) return false;
    if (topic !== 'Tous les sujets' && topicFor(d) !== topic) return false;
    if (repo !== 'Tous les projets' && d.repo !== repo) return false;
    return !query || `${d.path} ${d.repo} ${topicFor(d)}`.toLowerCase().includes(query.toLowerCase());
  }), [category, topic, repo, query]);

  useEffect(() => {
    if (!chosen) return;
    const controller = new AbortController();
    setLoading(true);
    setPreview('');
    fetch(chosen.raw, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Lecture impossible (${r.status})`);
        return r.text();
      })
      .then((body) => setPreview(body.slice(0, 150000)))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setPreview(err instanceof Error ? err.message : 'Document indisponible. Ouvrez-le sur GitHub.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [chosen]);

  const chooseAgent = (source: string, project: string) => {
    const d = PUBLIC_DOCUMENTS.find((doc) => doc.repo === project && doc.path === source);
    if (d) { setChosen(d); setMode('documents'); }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f5f7] text-gray-900">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label="Retour" className="rounded p-1 text-gray-500 hover:bg-gray-100"><ArrowLeft className="h-4 w-4" /></button>
          <AtlasLogo compact />
          <span className="h-5 w-px bg-gray-200" />
          <span className="text-[13px] font-semibold">Bureau · mémoire AIME</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block"><WorkspaceNav active="desk" onNavigate={(page) => { if (page === 'home') onBack(); else if (page === 'viewer') onOpenViewer(); else if (page === 'systems') onOpenSystems(); }} /></div>
          <div className="md:hidden"><WorkspaceNav compact active="desk" onNavigate={(page) => { if (page === 'home') onBack(); else if (page === 'viewer') onOpenViewer(); else if (page === 'systems') onOpenSystems(); }} /></div>
          <div className="hidden font-mono text-[10px] text-gray-400 xl:block">{PUBLIC_DOCUMENTS.length} fichiers publics · {projects.length} dépôts</div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[230px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4 md:block">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-gray-400">Classement</div>
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" onClick={() => { setCategory(c.id); setMode('documents'); setLimit(48); }} className={cn('flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12px]', category === c.id && mode === 'documents' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100')}>
              <span className="flex items-center gap-2"><Folder className="h-3.5 w-3.5" />{c.label}</span>
              <span className="font-mono text-[10px] opacity-60">{c.id === 'tous' ? PUBLIC_DOCUMENTS.length : PUBLIC_DOCUMENTS.filter((d) => d.category === c.id).length}</span>
            </button>
          ))}
          <div className="my-4 border-t border-gray-100" />
          <button type="button" onClick={() => setMode('agents')} className={cn('flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px]', mode === 'agents' ? 'bg-[#0071e3] text-white' : 'text-gray-600 hover:bg-gray-100')}><Users className="h-3.5 w-3.5" /> Spécialités AIME <span className="ml-auto font-mono text-[10px] opacity-60">{AGENTS.length}</span></button>
          <p className="mt-6 text-[10px] leading-relaxed text-gray-400">Inventaire de chemins publics GitHub. Le contenu se charge seulement lorsque vous ouvrez un fichier. Aucun document privé n’est accessible.</p>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-5xl">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">Bibliothèque de travail · sources vérifiables</div>
            <h1 className="font-display mt-2 text-4xl sm:text-5xl">{mode === 'agents' ? <>Les spécialités <em className="text-[#0071e3]">se retrouvent.</em></> : <>Tout est <em className="text-[#0071e3]">à sa place.</em></>}</h1>
            <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-gray-500">{mode === 'agents' ? 'Spécialités éditoriales inspirées des fichiers publics, pas des modèles connectés ni des agents autonomes. NOEMA est une constitution proposée.' : 'Manifestes, audits, mémoires publiques, instructions, systèmes et architectures : filtrés par dossier, sujet et projet.'}</p>

            <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
              <button type="button" onClick={() => setMode('agents')} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-[11px]', mode === 'agents' ? 'border-black bg-black text-white' : 'border-gray-200 bg-white')}>Spécialités</button>
              {CATEGORIES.map((c) => <button key={c.id} type="button" onClick={() => { setMode('documents'); setCategory(c.id); }} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-[11px]', category === c.id && mode === 'documents' ? 'border-black bg-black text-white' : 'border-gray-200 bg-white')}>{c.label}</button>)}
            </div>

            {mode === 'agents' ? (
              <div className="mt-8 space-y-6">
                <div className="rounded-xl border border-[#0071e3]/20 bg-[#eef4ff] px-4 py-3 text-[13px] font-medium text-[#0a5bd6]">{WELCOME_MESSAGE} <span className="font-normal">· Invitation locale, non envoyée à GitHub ni à un agent externe.</span></div>
                {(['architecture', 'creation', 'relation', 'temps', 'design', 'preuve'] as const).map((cat) => {
                  const agents = AGENTS.filter((a) => a.category === cat);
                  if (!agents.length) return null;
                  return <section key={cat}>
                    <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400">{cat} · {agents.length}</h2>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {agents.map((a) => <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3"><h3 className="text-[15px] font-semibold">{a.name}</h3><span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[9px] uppercase text-gray-500">Source publique</span></div>
                        <p className="mt-1 text-[12px] text-gray-600">{a.specialty}</p>
                        <p className="mt-2 text-[11px] leading-relaxed text-gray-500">{a.note}</p>
                        <button type="button" onClick={() => chooseAgent(a.source, a.repo)} className="mt-3 text-left font-mono text-[10px] text-[#ac005f] hover:underline">{a.repo}/{a.source} ↗</button>
                      </div>)}
                    </div>
                  </section>;
                })}
              </div>
            ) : (
              <>
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <label className="relative min-w-[170px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher dans les titres et chemins…" className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-[12px] outline-none focus:border-black" />
                  </label>
                  <label className="relative">
                    <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Sujet" className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-[12px] outline-none focus:border-black">
                      <option>Tous les sujets</option>
                      {TOPICS.map((t) => <option key={t.id}>{t.id}</option>)}
                      <option>Autres</option>
                    </select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
                  </label>
                  <label className="relative">
                    <select value={repo} onChange={(e) => setRepo(e.target.value)} aria-label="Projet" className="max-w-[180px] appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-[12px] outline-none focus:border-black">
                      <option>Tous les projets</option>
                      {projects.map((r) => <option key={r}>{r}</option>)}
                    </select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
                  </label>
                </div>
                <p className="mt-3 font-mono text-[10px] text-gray-400">{documents.length} fichier{documents.length > 1 ? 's' : ''} · Source : dépôts publics @mattmezstitchlab</p>
                <div className="mt-4 grid gap-2 lg:grid-cols-2">
                  {documents.slice(0, limit).map((d) => <button key={`${d.repo}/${d.path}`} type="button" onClick={() => setChosen(d)} className={cn('flex items-start gap-3 rounded-xl border bg-white p-3 text-left transition-colors hover:border-gray-400', chosen?.repo === d.repo && chosen.path === d.path ? 'border-black' : 'border-gray-200')}>
                    <span className="rounded-md bg-gray-100 p-2 text-gray-600"><FileText className="h-4 w-4" /></span>
                    <span className="min-w-0"><span className="block truncate text-[12px] font-semibold">{titleOf(d)}</span><span className="mt-0.5 block truncate font-mono text-[10px] text-gray-400">{d.repo} / {d.path}</span><span className="mt-1 block font-mono text-[9px] uppercase text-[#aa005d]">{CATEGORIES.find((c) => c.id === d.category)?.label} · {topicFor(d)}</span></span>
                  </button>)}
                </div>
                {documents.length > limit && <button type="button" onClick={() => setLimit((n) => n + 48)} className="mt-6 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[12px] hover:bg-gray-50">Afficher {Math.min(48, documents.length - limit)} fichiers de plus</button>}
                {!documents.length && <p className="mt-6 text-[13px] text-gray-500">Aucun document pour ces critères.</p>}
              </>
            )}
          </div>
        </main>

        {chosen && <aside className="hidden w-[410px] shrink-0 flex-col border-l border-gray-200 bg-white xl:flex">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3"><span className="min-w-0 truncate text-[12px] font-semibold">{titleOf(chosen)}</span><button type="button" aria-label="Fermer" onClick={() => setChosen(null)} className="text-gray-400 hover:text-black"><X className="h-4 w-4" /></button></div>
          <div className="flex-1 overflow-y-auto p-4"><div className="mb-3 break-all font-mono text-[10px] text-gray-400">{chosen.repo} / {chosen.path}</div><pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-gray-700">{loading ? 'Lecture du fichier public…' : preview}</pre></div>
          <a href={chosen.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 border-t border-gray-100 px-4 py-3 text-[12px] font-medium hover:bg-gray-50">Voir sur GitHub <ExternalLink className="h-3.5 w-3.5" /></a>
        </aside>}
      </div>
      {chosen && <div className="fixed inset-0 z-40 flex items-end bg-black/30 xl:hidden" onClick={() => setChosen(null)}><div className="max-h-[86vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}><div className="mb-3 flex items-start justify-between gap-3"><span className="break-all text-[12px] font-semibold">{chosen.repo}/{chosen.path}</span><button type="button" aria-label="Fermer" onClick={() => setChosen(null)}><X className="h-4 w-4" /></button></div><pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">{loading ? 'Lecture du fichier public…' : preview}</pre><a href={chosen.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium">GitHub <ExternalLink className="h-3 w-3" /></a></div></div>}
    </div>
  );
}