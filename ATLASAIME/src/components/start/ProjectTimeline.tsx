import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Info, Play, Wrench, BadgeCheck, Check } from 'lucide-react';
import type { RepoSnapshot } from '../../data/repos';
import { formatDate, githubRepoUrl, screenshotUrl } from '../../data/repos';
import { DOCUMENTED_SYSTEMS } from '../../data/designSystems';
import { composeProjectSignal, defaultRemaining, remainingFor } from '../../data/fusions';
import type { Signal } from '../../data/fusions';
import { SignalPanel } from './SignalPanel';
import { cn } from '../../utils/cn';

const STORIES: Record<string, { discovery: string; innovation: string; next: string; source?: string }> = {
  'AIME-COMPOSER': { discovery: 'Composition comme moteur transversal : sections, médias, temps et preuve.', innovation: 'NOEMA est définie dans une constitution proposée, distincte d’un agent actif.', next: 'Franchir la merge gate de la PR #4, puis extraire réellement routes, sections et médias.', source: 'ARCHITECTURE/NOEMA-CONSTITUTION-V1.md' },
  POINTZERO: { discovery: 'Les univers, les studios et les moteurs sont trois concepts séparés.', innovation: 'Navigation mère AIME documentée et réversible.', next: 'Valider la PR #38 après recette sur iPhone, iPad et bureau.', source: 'docs/AIME-ARCHITECTURE-MERE-AUDIT.md' },
  'byaime-one-page': { discovery: 'Grille vivante, chronologie des profils et fil publiable, décrits dans les mémoires publiques.', innovation: 'Une page publique projetée à partir de moments validés.', next: 'Tester les parcours complets, permissions et publication.', source: '.agents/memory/MEMORY.md' },
  RELIA: { discovery: 'Relations sourcées entre personnes, lieux et œuvres.', innovation: 'Chronologie documentaire avec limites et sources explicites.', next: 'Terminer la phase YouTube : clé API, synchronisation, catalogue commité.', source: 'AUDIT_TIMELINE.md' },
  SILLAGE: { discovery: 'La musique comme mémoire d’un moment partagé.', innovation: 'Une bande-son relationnelle documentée.', next: 'Valider les droits des médias, la lecture et la collaboration.', source: '.agents/memory/MEMORY.md' },
  'AIME-ARCHIVE': { discovery: 'Architecture d’archives construite avec Base44.', innovation: 'Consignes publiques AGENTS.md et modèle d’audit.', next: 'Auditer les permissions et les données avant toute réutilisation.', source: 'AGENTS.md' },
  'lemondeaimedesignsystem': { discovery: 'Tokens, typographie et composants documentés.', innovation: 'Pont visuel entre Le Monde Aime et Matt Mez Sax.', next: 'Reprendre l’audit maintenant que le site Base44 répond.', source: 'DESIGN_SYSTEM.md' },
  RIPPLECIRCLE: { discovery: 'Cadran 2D vivant pour les événements.', innovation: 'Les moments se lisent comme une expérience spatiale.', next: 'Valider les interactions sur mobile et les données réelles.', source: 'docs/00-baseline-audit.md' },
  'AIME-METAMORPHOSE': { discovery: 'Une URL, une grille, des transformations et des preuves.', innovation: 'Le fragment change de contexte sans perdre sa provenance.', next: 'Tester le remix sur davantage de sites et leurs dépendances.' },
  'AIMEPROJET': { discovery: 'Un espace de liens entre informations, créations et préparation.', innovation: 'Des fragments manipulables dans une même interface.', next: 'Mesurer l’usage réel et consolider les parcours.' },
  'dispoo-app': { discovery: 'Proposer des créneaux et partager un vote.', innovation: 'La disponibilité devient un outil de coordination.', next: 'Vérifier les réponses, les rappels et l’accessibilité.' },
  BRODEZ: { discovery: 'Atelier de broderie en ligne.', innovation: 'Le motif peut entrer dans la composition d’une page.', next: 'Documenter les motifs, sources et droits d’utilisation.' },
};

interface Estimate {
  completion: number;
  low: number;
  high: number;
  future: number;
  gates: string[];
}

/** Fourchette de coût de reconstruction illustrative, pas une valorisation commerciale.
 *  Hypothèses visibles : 45–85 €/h, effort estimé selon taille du dépôt et preuves.
 *  `done` = conditions déclarées remplies par le propriétaire (déclaratif, local). */
export function estimateProject(r: RepoSnapshot, done: string[] = []): Estimate {
  const documented = DOCUMENTED_SYSTEMS.some((d) => d.repo === r.name);
  const base = Math.min(100,
    (r.size > 0 ? 20 : 0) +
    (r.size > 200 ? 10 : 0) +
    (r.size > 1500 ? 10 : 0) +
    (r.embed === 'live' || r.embed === 'blocked' ? 25 : 0) +
    (r.description || r.siteDescription ? 10 : 0) +
    (documented ? 10 : 0) +
    (r.size > 4000 ? 5 : 0),
  );
  const gates = [
    ...(r.embed === 'offline' || r.embed === 'none' ? ['Publier un prototype accessible'] : []),
    ...(!r.description && !r.siteDescription ? ['Documenter l’intention et les parcours'] : []),
    'Valider les fonctions et l’accessibilité avec des utilisateurs',
    'Prouver les usages, les droits et la maintenance',
  ];
  const doneCount = gates.filter((g) => done.includes(g)).length;
  const ratio = gates.length ? doneCount / gates.length : 0;
  const completion = Math.min(100, Math.round(base + (100 - base) * ratio * 0.8));
  const hours = Math.max(12, Math.min(250, Math.round(12 + Math.log2(r.size + 1) * 12)));
  const lowBase = Math.round((hours * 45) / 100) * 100;
  const highBase = Math.round((hours * 85) / 100) * 100;
  const future = Math.round(highBase * 1.8 / 100) * 100;
  // Each satisfied condition moves the range toward the validated scenario.
  const low = Math.round((lowBase + (highBase - lowBase) * ratio) / 100) * 100;
  const high = Math.round((highBase + (future - highBase) * ratio) / 100) * 100;
  return { completion, low, high, future, gates };
}

const euro = (v: number) => `${v.toLocaleString('fr-FR')} €`;
const DONE_KEY = 'atlas:conditions:v1';

function loadDone(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    return map && typeof map === 'object' ? map : {};
  } catch {
    return {};
  }
}

export function ProjectTimeline({ repos, onOpenRepo }: { repos: RepoSnapshot[]; onOpenRepo?: () => void }) {
  const entries = useMemo(() =>
    repos.filter((r) => r.size > 0 && (STORIES[r.name] || r.embed === 'live'))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [repos]);
  const [selected, setSelected] = useState<string | null>(null);
  const [doneMap, setDoneMap] = useState<Record<string, string[]>>(() => loadDone());
  const [finalizing, setFinalizing] = useState(false);
  const [signal, setSignal] = useState<Signal | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const active = entries.find((r) => r.name === selected) ?? entries[0];
  const info = active && (STORIES[active.name] ?? {
    discovery: active.siteDescription || active.description || 'Projet en ligne, fonction observée à confirmer.',
    innovation: 'À documenter : aucune innovation propre à ce dépôt n’a été vérifiée.',
    next: 'Documenter les parcours, les droits et les usages réels.',
  });
  const done = active ? doneMap[active.name] ?? [] : [];
  const valuation = active && estimateProject(active, done);
  const work = active ? remainingFor(active.name) : undefined;
  const remaining = active ? (work?.items ?? defaultRemaining(active)) : [];
  const broken = active ? [...(work?.broken ?? []), ...(active.embed === 'offline' ? [`${active.homepage} répond 404 alors qu’il est déclaré comme site du dépôt`] : []), ...(active.embed === 'blocked' ? ['Le site refuse l’intégration en iframe (CSP frame-ancestors)'] : [])] : [];

  const toggleDone = (gate: string) => {
    if (!active) return;
    const next = done.includes(gate) ? done.filter((g) => g !== gate) : [...done, gate];
    const map = { ...doneMap, [active.name]: next };
    setDoneMap(map);
    try { localStorage.setItem(DONE_KEY, JSON.stringify(map)); } catch { /* stockage indisponible */ }
  };

  const emit = (kind: 'continuer' | 'reparer' | 'finaliser') => {
    if (!active || !valuation) return;
    setSignal(composeProjectSignal(kind, active, { remaining, broken, source: work ? `${work.sourceLabel} (${work.source})` : undefined, completion: valuation.completion, done, low: valuation.low, high: valuation.high }));
  };

  return (
    <section aria-label="Chronologie des projets">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400">Évolution · sources GitHub</p>
          <h2 className="font-display mt-2 text-4xl leading-none sm:text-5xl">Une histoire <em className="text-gray-400">en mouvement.</em></h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Projets précédents" onClick={() => scroller.current?.scrollBy({ left: -480, behavior: 'smooth' })} className="rounded-full border border-gray-200 bg-white p-2 text-gray-600 hover:border-gray-400"><ArrowLeft className="h-4 w-4" /></button>
          <button type="button" aria-label="Projets suivants" onClick={() => scroller.current?.scrollBy({ left: 480, behavior: 'smooth' })} className="rounded-full border border-gray-200 bg-white p-2 text-gray-600 hover:border-gray-400"><ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>
      <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-gray-500">Les dates viennent de la création des dépôts GitHub. Chaque étape montre ce qui est visible ou documenté, ce qu’il reste à faire d’après les documents du dépôt, et trois façons de me faire signe.</p>

      <div ref={scroller} className="no-scrollbar -mx-4 mt-9 flex snap-x gap-0 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        {entries.map((r, i) => {
          const chosen = active?.name === r.name;
          const story = STORIES[r.name];
          const est = estimateProject(r, doneMap[r.name] ?? []);
          return (
            <button key={r.name} type="button" onClick={() => { setSelected(r.name); setFinalizing(false); }} className="group relative w-[230px] shrink-0 snap-start pb-2 pr-5 text-left sm:w-[270px]" aria-pressed={chosen}>
              <div className="flex items-center gap-0">
                <span className={cn('h-3 w-3 shrink-0 rounded-full border-2 transition-all', chosen ? 'scale-125 border-[#e6007e] bg-[#e6007e]' : 'border-gray-400 bg-white group-hover:border-[#e6007e]')} />
                <span className="h-px flex-1 bg-gray-300" />
              </div>
              <div className="pt-5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400">{String(i + 1).padStart(2, '0')} · {formatDate(r.createdAt)}</span>
                <h3 className={cn('mt-2 truncate text-[15px] font-semibold transition-colors', chosen ? 'text-[#b30063]' : 'text-gray-900')}>{r.name}</h3>
                <p className="mt-1 line-clamp-2 min-h-[32px] text-[11px] leading-relaxed text-gray-500">{story?.discovery || r.siteDescription || r.description || 'Projet public référencé.'}</p>
                <p className="mt-2 font-mono text-[10px] text-gray-500">{est.completion} % preuves · {euro(est.low)} – {euro(est.high)}</p>
                <span className="mt-2 inline-block rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-gray-500">{r.embed === 'live' ? 'SITE EN LIGNE' : r.embed === 'blocked' ? 'CSP · STATIQUE' : r.embed === 'offline' ? 'HORS LIGNE' : 'CODE'}</span>
              </div>
            </button>
          );
        })}
      </div>

      {active && info && valuation && (
        <div className="mt-6 grid overflow-hidden rounded-2xl border border-gray-200 bg-white lg:grid-cols-[1fr_330px]">
          <div className="p-5 sm:p-6">
            <div className="flex gap-5">
              {active.homepage && active.embed !== 'offline' && (
                <img src={screenshotUrl(active.homepage)} alt="" loading="lazy" className="hidden h-32 w-48 shrink-0 rounded-lg border border-gray-100 object-cover object-top sm:block" />
              )}
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-wider text-gray-400">{formatDate(active.createdAt)} · {active.language ?? 'Projet'}</div>
                <h3 className="mt-1 text-xl font-semibold">{active.name}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-gray-600"><strong>Créé / découvert :</strong> {info.discovery}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-600"><strong>Innovation émergente :</strong> {info.innovation}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-600"><strong>Pour aller plus loin :</strong> {info.next}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <a href={githubRepoUrl(active.name)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 hover:underline">Dépôt source <ExternalLink className="h-3 w-3" /></a>
                  {info.source && <a href={`${githubRepoUrl(active.name)}/blob/main/${info.source}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 hover:underline">Document cité <ExternalLink className="h-3 w-3" /></a>}
                  {onOpenRepo && <button type="button" onClick={onOpenRepo} className="text-[11px] font-medium text-[#a5005a] hover:underline">Ouvrir la visionneuse</button>}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-100 bg-[#fafafa] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-[12px] font-semibold uppercase tracking-wider text-gray-500">Ce qu’il reste à faire</h4>
                <span className="font-mono text-[10px] text-gray-400">{work ? `Source : ${work.sourceLabel}` : 'Déduit du statut GitHub, pas d’un document du dépôt'}</span>
              </div>
              {work && <p className="mt-1 text-[11px] text-gray-500">{work.verified}</p>}
              <ul className="mt-2 space-y-1.5">
                {remaining.map((item) => <li key={item} className="flex items-start gap-2 text-[12px] leading-relaxed text-gray-700"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />{item}</li>)}
              </ul>
              {broken.length > 0 && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
                  <strong>À réparer :</strong> {broken.join(' · ')}
                </div>
              )}
              {work && <a href={`${githubRepoUrl(active.name)}/${work.source.startsWith('pull/') ? work.source : `blob/main/${work.source}`}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 hover:underline">Lire la source <ExternalLink className="h-3 w-3" /></a>}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => emit('continuer')} className="flex items-center gap-2 rounded-xl bg-[#161616] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#e6007e]"><Play className="h-3.5 w-3.5 fill-current" /> Continuer avec l’IA</button>
              <button type="button" onClick={() => emit('reparer')} className={cn('flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[12px] font-semibold', broken.length ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50')}><Wrench className="h-3.5 w-3.5" /> Réparer avec l’IA{broken.length ? ` · ${broken.length}` : ''}</button>
              <button type="button" onClick={() => setFinalizing((v) => !v)} aria-expanded={finalizing} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"><BadgeCheck className="h-3.5 w-3.5" /> Finaliser et mettre à jour l’estimation</button>
            </div>

            {finalizing && (
              <div className="animate-pop mt-4 rounded-2xl border border-gray-200 p-4">
                <p className="text-[12px] font-semibold">Cochez les conditions réellement remplies : l’avancement et la fourchette se recalculent, puis le signal transmet ce que vous déclarez pour vérification.</p>
                <ul className="mt-3 space-y-2">
                  {valuation.gates.map((gate) => (
                    <li key={gate}>
                      <label className="flex cursor-pointer items-start gap-2.5 text-[12px] text-gray-700">
                        <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border', done.includes(gate) ? 'border-[#e6007e] bg-[#e6007e] text-white' : 'border-gray-300 bg-white')}>{done.includes(gate) && <Check className="h-3 w-3" />}</span>
                        <input type="checkbox" className="sr-only" checked={done.includes(gate)} onChange={() => toggleDone(gate)} />
                        {gate}
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-gray-500">Nouvelle estimation : {valuation.completion} % · {euro(valuation.low)} – {euro(valuation.high)}</span>
                  <button type="button" onClick={() => emit('finaliser')} className="rounded-xl bg-[#161616] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#e6007e]">Envoyer le signal de finalisation</button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 bg-[#faf9f8] p-5 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between text-[12px]"><span className="font-medium">Avancement documentaire</span><span className="font-mono">{valuation.completion} %</span></div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-[#e6007e] transition-all duration-500" style={{ width: `${valuation.completion}%` }} /></div>
            {done.length > 0 && <p className="mt-1.5 font-mono text-[10px] text-gray-400">{done.length}/{valuation.gates.length} condition(s) déclarée(s) remplie(s) · à vérifier</p>}
            <div className="mt-5 font-mono text-[10px] uppercase tracking-wider text-gray-400">Coût de reconstruction · indicatif</div>
            <div className="mt-1 text-xl font-semibold">{euro(valuation.low)} – {euro(valuation.high)}</div>
            <div className="mt-3 text-[12px] text-gray-600">Scénario après validation complète : <strong>jusqu’à {euro(valuation.future)}</strong></div>
            <p className="mt-2 text-[11px] leading-relaxed text-gray-500">Sous conditions : {valuation.gates.filter((g) => !done.includes(g)).join(' ; ').toLowerCase() || 'toutes déclarées remplies — vérification attendue'}.</p>
            <p className="mt-3 flex gap-1.5 border-t border-gray-200 pt-3 text-[10px] leading-relaxed text-gray-400"><Info className="mt-0.5 h-3 w-3 shrink-0" /> Estimation pédagogique, pas une valorisation marchande ni une offre : effort indicatif 12–250 h selon taille du dépôt, à 45–85 €/h. Scénario supérieur = borne haute × 1,8, seulement après les conditions ci-dessus. Le pourcentage mesure les preuves publiques et vos déclarations locales, pas les fonctions testées.</p>
          </div>
        </div>
      )}

      {signal && <SignalPanel signal={signal} onClose={() => setSignal(null)} />}
    </section>
  );
}
