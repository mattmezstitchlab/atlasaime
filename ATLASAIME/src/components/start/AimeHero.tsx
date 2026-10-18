import { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import type { Project } from '../../types';
import { GITHUB_USER, type RepoSnapshot } from '../../data/repos';
import { analyzeBrief } from '../../data/agents';
import type { Brief } from '../../data/agents';
import { generateSiteFromBrief } from '../../data/siteGenerator';
import type { GeneratedSite } from '../../data/siteGenerator';

export function AimeHero({ repos, onCreate, onExplore }: { repos: RepoSnapshot[]; onCreate: (p: Project) => void; onExplore: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [brief, setBrief] = useState<Brief | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState<GeneratedSite | null>(null);
  const [expanded, setExpanded] = useState(false);

  const submit = () => {
    if (prompt.trim().length < 12) return;
    setBrief(analyzeBrief(prompt, repos));
    setAnswers({});
    setGenerated(null);
  };

  return (
    <section aria-label="Composition depuis une idée" className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-8">
      <h3 className="text-xl font-semibold">Une idée, des sources, une maquette.</h3>
      <p className="mt-2 text-sm text-gray-500">Des règles locales suggèrent des projets existants. Aucun modèle IA ni service externe n’est appelé.</p>
      <label htmlFor="aime-intention" className="mt-5 block text-sm font-medium">Que souhaitez-vous présenter ou composer ?</label>
      <textarea id="aime-intention" value={prompt} rows={3}
        onChange={(e) => { setPrompt(e.target.value); setBrief(null); setGenerated(null); }}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
        placeholder="Un portfolio musical pour mes visiteurs, sobre et mobile…"
        className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-black" />
      <button type="button" disabled={prompt.trim().length < 12} onClick={submit} className="mt-3 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">Trouver des sources</button>
      {brief && (
        <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">
          <p className="text-sm">{brief.rationale}</p>
          <div>
            <h4 className="text-sm font-semibold">Sources suggérées · à vérifier</h4>
            <ul className="mt-2 flex flex-wrap gap-2">
              {brief.selectedRepos.map((name) => <li key={name}><a href={`https://github.com/${GITHUB_USER.login}/${encodeURIComponent(name)}`} target="_blank" rel="noreferrer" className="inline-block rounded-full border border-gray-200 px-3 py-1 text-xs underline">{name}</a></li>)}
            </ul>
            {!brief.selectedRepos.length && <p className="mt-2 text-xs text-gray-500">Aucun projet correspondant identifié. La maquette utilisera des blocs texte.</p>}
          </div>
          {brief.missing.length > 0 && <div className="grid gap-3 sm:grid-cols-2">
            {brief.missing.map((m) => <label key={m.id} className="text-xs text-gray-600">{m.question}
              <input value={answers[m.id] ?? ''} onChange={(e) => { setAnswers((prev) => ({ ...prev, [m.id]: e.target.value })); setGenerated(null); }} placeholder="Facultatif · hypothèse sinon" className="mt-1 block w-full rounded-lg border border-gray-200 p-2" />
            </label>)}
          </div>}
          <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="flex items-center gap-2 text-xs text-gray-500">Références documentaires <ChevronDown className="h-3 w-3" /></button>
          {expanded && <ul className="space-y-2 text-xs text-gray-600">{brief.selectedAgents.map((a) => <li key={a.id}><strong>{a.specialty}</strong> · {a.note} <a href={`https://github.com/${GITHUB_USER.login}/${encodeURIComponent(a.repo)}/blob/main/${a.source}`} target="_blank" rel="noreferrer" className="underline">Source</a></li>)}</ul>}
          {!generated ? <button type="button" onClick={() => setGenerated(generateSiteFromBrief(brief, answers, repos))} className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white">Préparer la maquette</button> : <div className="rounded-xl bg-gray-50 p-4" role="status">
            <p className="text-sm font-medium">Maquette préparée · {generated.project.cells.length} blocs</p>
            <p className="mt-2 text-xs text-gray-600">{generated.sections.join(' · ')}</p>
            {generated.assumptions.length > 0 && <ul className="mt-2 list-inside list-disc text-xs text-gray-500">{generated.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>}
            <button type="button" onClick={() => onCreate(generated.project)} className="mt-4 flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm text-white">Ouvrir dans le canevas <ArrowRight className="h-4 w-4" /></button>
          </div>}
          <p className="text-xs text-gray-500">Prototype visuel local : aucun compte, paiement, formulaire réel ou échange de données entre applications n’est connecté.</p>
        </div>
      )}
      <button type="button" onClick={onExplore} className="mt-5 text-xs underline">Choisir les sources et la mise en page manuellement</button>
    </section>
  );
}
