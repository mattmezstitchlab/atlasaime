import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronDown, Sparkles } from 'lucide-react';
import type { Project } from '../../types';
import type { RepoSnapshot } from '../../data/repos';
import { analyzeBrief, AGENTS, WELCOME_MESSAGE } from '../../data/agents';
import type { Brief } from '../../data/agents';
import { generateSiteFromBrief } from '../../data/siteGenerator';
import type { GeneratedSite } from '../../data/siteGenerator';
import { cn } from '../../utils/cn';

const BLUE = '#0071e3';

const SUGGESTIONS = [
  'Un site pour des couples qui organise le mariage, avec RSVP et playlist, mobile, style rose, public.',
  'Une application pour mes clients qui suit leurs projets de broderie, mobile et bureau, style sobre, privée.',
  'Un portfolio web pour les visiteurs avec mes projets de musique, style sombre, public.',
];

const HEART = [
  '01100110',
  '11111111',
  '11111111',
  '01111110',
  '00111100',
  '00011000',
];

function PixelHeart({ small = false, color = BLUE }: { small?: boolean; color?: string }) {
  return (
    <span className={cn('pixel-heart', small ? 'pixel-heart-small' : '')} role="img" aria-label="Cœur en pixels qui bat" style={{ color }}>
      {HEART.join('').split('').map((pixel, i) => <i key={i} className={pixel === '1' ? 'on' : ''} />)}
    </span>
  );
}

export function AimeHero({ repos, onCreate, onExplore }: { repos: RepoSnapshot[]; onCreate: (p: Project) => void; onExplore: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [brief, setBrief] = useState<Brief | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState(-1);
  const [generated, setGenerated] = useState<GeneratedSite | null>(null);
  const [expanded, setExpanded] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scroll = useRef<HTMLDivElement>(null);

  const actors = useMemo(() => brief?.selectedAgents ?? [], [brief]);
  const questions = brief?.missing.filter((m) => !answers[m.id]?.trim()) ?? [];
  const running = phase >= 0;
  const steps = useMemo(() => [
    `Lire l’intention : « ${brief?.prompt.slice(0, 54) ?? ''}${(brief?.prompt.length ?? 0) > 54 ? '…' : ''} »`,
    `Identifier ${actors.length} spécialités concernées dans les documents publics`,
    `Vérifier les informations et les limites (${questions.length ? `${questions.length} hypothèse(s)` : 'brief complet'})`,
    `Retrouver ${brief?.selectedRepos.length ?? 0} dépôts GitHub correspondants`,
    'Préparer une composition réversible, non publiée',
  ], [brief, actors.length, questions.length]);

  useEffect(() => {
    if (phase < 0 || phase >= steps.length) return;
    timer.current = setInterval(() => setPhase((v) => Math.min(v + 1, steps.length)), 720);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [phase, steps.length]);

  useEffect(() => {
    if (running) scroll.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [running]);

  const submit = () => {
    if (prompt.trim().length < 12 || running) return;
    setBrief(analyzeBrief(prompt, repos));
    setAnswers({});
    setGenerated(null);
    setPhase(-1);
  };

  const start = () => setPhase(0);
  const finish = () => {
    if (!brief || phase < steps.length) return;
    if (!generated) {
      setGenerated(generateSiteFromBrief(brief, answers, repos));
      return;
    }
    onCreate(generated.project);
  };

  return (
    <section className="aime-hero relative overflow-hidden" aria-label="Composer avec AIME">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_-15%,rgba(0,113,227,0.10),transparent_55%)]" />
      <div className="pointer-events-none absolute -bottom-56 -right-40 h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle,rgba(0,113,227,0.10),transparent_70%)] blur-2xl" />
      <div className="relative mx-auto max-w-[1400px] px-5 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24 lg:pt-28">
        <div className="max-w-[940px]">
          <div className="mb-6 flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-black/55">
            <PixelHeart small /> ATLAS × AIME · atelier local
          </div>
          <h1 className="font-display max-w-[1000px] text-[clamp(72px,10vw,140px)] leading-[0.9] tracking-[-0.035em] text-[#1d1d1f]">
            AIME<span className="align-top text-[.25em] not-italic text-black/30">®</span>
            <span className="mt-3 block text-[.48em] leading-[1.05] tracking-[-0.02em] text-[#1d1d1f]">Décrivez une idée. <em className="not-italic text-[#0071e3]">Faites-la prendre forme.</em></span>
          </h1>
          <p className="mt-6 max-w-[620px] text-[15px] leading-relaxed text-[#6e6e73] sm:text-[17px]">
            Vos projets, leurs mémoires et leurs spécialités se rencontrent pour préparer une composition. Vous gardez la main, à chaque étape.
          </p>

          <div className="mt-9 max-w-[850px]" ref={scroll}>
            <div className="rounded-2xl border border-black/10 bg-white p-2 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.25)]">
              <label htmlFor="aime-intention" className="sr-only">Décrire l’application que vous souhaitez composer</label>
              <textarea
                id="aime-intention"
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); if (brief && !running) setBrief(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
                rows={3}
                placeholder="Je voudrais une application pour… Elle permettrait de…"
                className="w-full resize-none rounded-xl px-3 py-3 text-[15px] leading-relaxed outline-none placeholder:text-gray-400 sm:text-base"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-2 pt-2">
                <span className="text-[11px] text-gray-400">Proposition locale · aucune donnée envoyée à un modèle IA</span>
                <button type="button" disabled={prompt.trim().length < 12 || running} onClick={submit} className="flex items-center gap-2 rounded-xl bg-[#0071e3] px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-40">
                  <Sparkles className="h-4 w-4" /> Préparer l’idée <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!brief && (
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-[12px]">
                <span className="mr-1 font-mono text-[10px] uppercase tracking-widest text-black/45">Essayez</span>
                {SUGGESTIONS.map((s, i) => (
                  <button key={s} type="button" onClick={() => setPrompt(s)} className="max-w-[260px] truncate rounded-full border border-black/12 bg-white/70 px-3 py-1.5 text-left text-[#1d1d1f] transition-colors hover:border-[#0071e3]/40 hover:text-[#0071e3]" title={s}>
                    {['Un mariage vivant', 'Un atelier de broderie', 'Un portfolio musical'][i]} ↗
                  </button>
                ))}
              </div>
            )}

            {brief && (
              <div className="animate-pop mt-5 rounded-2xl border border-black/[0.08] bg-white/85 p-4 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0071e3]">Lecture du brief</div>
                    <p className="mt-1 text-[14px] font-medium leading-relaxed text-[#1d1d1f]">{brief.rationale}</p>
                  </div>
                  <PixelHeart />
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-black/[0.08] pt-3">
                  {actors.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1.5 text-[12px] text-[#1d1d1f]" title={`${a.note} · ${a.repo}/${a.source}`}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', phase > 0 ? 'bg-[#0071e3] animate-pulse' : 'bg-black/30')} />
                      {a.name} <span className="text-black/45">· {a.specialty}</span>
                    </span>
                  ))}
                </div>
                <p className="mt-3 font-mono text-[10px] text-black/45">{WELCOME_MESSAGE} · invitation affichée ici, aucun message envoyé à un service externe.</p>

                {questions.length > 0 && !running && (
                  <div className="mt-4 space-y-3 border-t border-black/[0.08] pt-4">
                    <p className="text-[12px] font-semibold text-[#1d1d1f]">Pour améliorer le résultat, il manque {questions.length} précision{questions.length > 1 ? 's' : ''} :</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {brief.missing.map((m) => (
                        <label key={m.id} className="block">
                          <span className="mb-1 block font-mono text-[10px] text-black/50">{m.label} · {m.question}</span>
                          <input
                            value={answers[m.id] ?? ''}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [m.id]: e.target.value }))}
                            placeholder="Facultatif · sinon une hypothèse sera utilisée"
                            className="w-full rounded-lg border border-black/12 bg-white px-3 py-2 text-[12px] text-[#1d1d1f] outline-none placeholder:text-gray-400 focus:border-[#0071e3]"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {phase < 0 ? (
                  <button type="button" onClick={start} className="mt-4 flex items-center gap-2 rounded-lg bg-[#0071e3] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#0077ed]">
                    {questions.length ? 'Continuer avec ces hypothèses' : 'Composer maintenant'} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="mt-4 border-t border-black/[0.08] pt-4" role="status" aria-live="polite">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">Étapes de préparation</div>
                    <ol className="mt-2 space-y-1.5">
                      {steps.map((step, i) => (
                        <li key={step} className={cn('flex items-center gap-2 text-[12px]', i > phase ? 'text-black/35' : 'text-[#1d1d1f]')}>
                          <span className="flex h-4 w-4 items-center justify-center">
                            {i < phase ? <Check className="h-3.5 w-3.5 text-[#0071e3]" /> : i === phase ? <PixelHeart small /> : <span className="h-1 w-1 rounded-full bg-black/30" />}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                    {phase >= 2 && (
                      <div className="mt-4 space-y-1.5 border-t border-black/[0.08] pt-3">
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/45">Réactions locales · uniquement les spécialités concernées</div>
                        {actors.map((a, i) => (
                          <p key={a.id} className="animate-pop text-[11px] leading-relaxed text-[#1d1d1f]" style={{ animationDelay: `${i * 70}ms` }}>
                            <strong>{a.name}</strong> · {a.id === 'noema'
                              ? `Je propose une validation humaine${questions.length ? ` et signale ${questions.length} point(s) à préciser` : ''}.`
                              : a.id === 'composer'
                                ? `Je propose « ${brief.layoutId} » ; l’assemblage reste modifiable.`
                                : `${a.specialty} : ${a.note}`}
                            <span className="ml-1 text-black/45">({a.repo}/{a.source})</span>
                          </p>
                        ))}
                      </div>
                    )}
                    {generated && (
                      <div className="mt-4 rounded-xl bg-black/[0.03] p-3 ring-1 ring-black/5">
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/45">Le site préparé correspond à votre intention</div>
                        <div className="mt-2 flex flex-wrap gap-1.5">{generated.sections.map((section) => <span key={section} className="rounded-full border border-black/10 bg-white px-2 py-1 text-[10px] text-[#1d1d1f]">{section}</span>)}</div>
                        <p className="mt-2 text-[11px] text-black/55">{generated.sourcesUsed.length} vrai{generated.sourcesUsed.length > 1 ? 's' : ''} projet{generated.sourcesUsed.length > 1 ? 's' : ''} réutilisé{generated.sourcesUsed.length > 1 ? 's' : ''} · {generated.project.cells.length} blocs · {generated.project.supportId} · {generated.project.layoutId}</p>
                        {generated.assumptions.filter((a) => a.includes('hypothèse')).length > 0 && <p className="mt-2 text-[11px] text-black/55">À valider : {generated.assumptions.filter((a) => a.includes('hypothèse')).join(' · ')}</p>}
                        <p className="mt-2 text-[10px] leading-relaxed text-black/40">Prototype visuel local · le backend, les comptes, paiements et formulaires réels restent à connecter.</p>
                      </div>
                    )}
                    {phase >= steps.length && (
                      <button type="button" onClick={finish} className="mt-4 flex items-center gap-2 rounded-lg bg-[#0071e3] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#0077ed]">
                        {generated ? 'Ouvrir ce site dans le canevas' : 'Générer les pages du site'} <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4 text-[12px] text-black/55">
              <button type="button" onClick={() => setExpanded((v) => !v)} className="inline-flex items-center gap-1.5 hover:text-[#1d1d1f]" aria-expanded={expanded}>
                {AGENTS.length} spécialités documentées <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} />
              </button>
              <button type="button" onClick={onExplore} className="inline-flex items-center gap-1.5 text-[#0071e3] hover:text-[#0077ed]">Ou choisir une composition à la main <ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
            {expanded && (
              <div className="mt-3 max-w-[850px] border-t border-black/10 pt-3 text-[12px] leading-relaxed text-[#1d1d1f]">
                <p className="font-semibold">{WELCOME_MESSAGE}</p>
                <p className="mt-1 text-black/55">Invitation affichée ici, non envoyée aux dépôts ou à leurs propriétaires. Les spécialités sont inspirées de fichiers publics : ce ne sont pas des agents IA connectés. Aucune mémoire privée n’est lue, aucune action n’est publiée sans vous.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
