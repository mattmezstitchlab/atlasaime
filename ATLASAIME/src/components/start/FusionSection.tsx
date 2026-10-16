import { useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, GitMerge, LayoutGrid } from 'lucide-react';
import type { Project } from '../../types';
import type { RepoSnapshot } from '../../data/repos';
import { githubRepoUrl, screenshotUrl } from '../../data/repos';
import { composeFusionSignal, FUSION_KIND_LABEL, FUSIONS, fusionReadiness } from '../../data/fusions';
import type { FusionKind, Signal } from '../../data/fusions';
import { createProject } from '../../data/templates';
import { SignalPanel } from './SignalPanel';
import { Reveal } from '../ui/controls';
import { cn } from '../../utils/cn';

const STATUS_LABEL: Record<string, string> = { live: 'en ligne', blocked: 'CSP · statique', offline: 'hors ligne', none: 'code', unknown: 'à vérifier' };

export function FusionSection({ repos, onCreate }: { repos: RepoSnapshot[]; onCreate: (p: Project) => void }) {
  const [filter, setFilter] = useState<FusionKind | 'tous'>('tous');
  const [openId, setOpenId] = useState<string | null>(FUSIONS[0]?.id ?? null);
  const [signal, setSignal] = useState<Signal | null>(null);

  const rows = useMemo(() => FUSIONS.map((f) => ({ f, readiness: fusionReadiness(f, repos) })).sort((a, b) => b.readiness.score - a.readiness.score), [repos]);
  const shown = rows.filter(({ f }) => filter === 'tous' || f.kind === filter);

  const compose = (members: string[], name: string) => {
    const available = members.filter((m) => repos.some((r) => r.name === m && r.size > 0)).map((m) => `gh:${m}`);
    onCreate(createProject({ name: `Fusion · ${name}`, typeId: 'archive', layoutId: 'infinite', supportId: 'desktop', explicit: available, repos }));
  };

  return (
    <section aria-label="Fusions possibles">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400">Fusions · ce qui gagne à ne faire qu’un</p>
          <h2 className="font-display mt-2 text-4xl leading-none sm:text-5xl">Plus forts <em className="text-gray-400">ensemble.</em></h2>
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-gray-500">
            Projets, modules et moteurs qui décrivent le même geste dans plusieurs dépôts. Les regroupements suivent la liste des « organes » de la constitution NOEMA et les audits publics. Chaque fusion se prépare avec moi : le bouton compose la consigne exacte, avec les sources.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['tous', 'moteur', 'module', 'plateforme', 'systeme'] as const).map((k) => (
            <button key={k} type="button" onClick={() => setFilter(k)} className={cn('rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors', filter === k ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300')}>
              {k === 'tous' ? `Tout · ${rows.length}` : `${FUSION_KIND_LABEL[k]}s · ${rows.filter((r) => r.f.kind === k).length}`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {shown.map(({ f, readiness }, i) => {
          const open = openId === f.id;
          const liveMember = f.members.map((m) => repos.find((r) => r.name === m)).find((r) => r && (r.embed === 'live' || r.embed === 'blocked') && r.homepage);
          return (
            <Reveal key={f.id} delay={Math.min(i, 6) * 40}>
              <article className={cn('flex h-full flex-col overflow-hidden rounded-3xl border bg-white transition-all', open ? 'border-gray-900 shadow-[0_20px_60px_-30px_rgba(0,0,0,.35)]' : 'border-gray-200 hover:border-gray-300')}>
                <button type="button" onClick={() => setOpenId(open ? null : f.id)} aria-expanded={open} className="flex items-start gap-4 p-5 text-left">
                  <span className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5 sm:block">
                    {liveMember?.homepage ? <img src={screenshotUrl(liveMember.homepage)} alt="" loading="lazy" className="h-full w-full object-cover object-top" /> : <GitMerge className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-gray-400" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-gray-900 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">{FUSION_KIND_LABEL[f.kind]}</span>
                      <span className="font-mono text-[10px] text-gray-400">{f.members.length} membres · {readiness.live} en ligne · maturité {readiness.score} %</span>
                    </span>
                    <span className="mt-1.5 block text-[17px] font-semibold tracking-tight">{f.name}</span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-gray-500">{f.thesis}</span>
                    <span className="mt-3 block h-1 overflow-hidden rounded-full bg-gray-100"><span className="block h-full rounded-full bg-[#e6007e]" style={{ width: `${readiness.score}%` }} /></span>
                  </span>
                </button>

                {open && (
                  <div className="animate-pop border-t border-gray-100 px-5 pb-5 pt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Membres</h4>
                        <ul className="mt-2 space-y-1.5">
                          {f.members.map((m) => {
                            const r = repos.find((x) => x.name === m);
                            const status = !r ? 'introuvable' : r.size === 0 ? 'dépôt vide' : STATUS_LABEL[r.embed] ?? r.embed;
                            return (
                              <li key={m} className="flex items-center justify-between gap-2 text-[12px]">
                                <a href={githubRepoUrl(m)} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 truncate font-medium text-gray-800 hover:underline">{m} <ExternalLink className="h-3 w-3 shrink-0 text-gray-400" /></a>
                                <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[9px]', status === 'en ligne' ? 'bg-emerald-50 text-emerald-700' : status === 'hors ligne' || status === 'dépôt vide' || status === 'introuvable' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600')}>{status}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Gain attendu</h4>
                        <p className="mt-2 text-[12px] leading-relaxed text-gray-700">{f.gain}</p>
                        <h4 className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Prérequis</h4>
                        <ul className="mt-2 space-y-1.5">
                          {f.prerequisites.map((p) => <li key={p} className="flex items-start gap-2 text-[12px] leading-relaxed text-gray-700"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />{p}</li>)}
                        </ul>
                      </div>
                    </div>
                    <a href={`${githubRepoUrl(f.source.repo)}/blob/main/${f.source.path}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] text-gray-500 hover:text-black">Source : {f.source.repo}/{f.source.path} · {f.source.label} <ExternalLink className="h-3 w-3" /></a>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setSignal(composeFusionSignal(f, readiness, repos))} className="flex items-center gap-2 rounded-xl bg-[#161616] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#e6007e]"><GitMerge className="h-3.5 w-3.5" /> Préparer la fusion avec l’IA <ArrowRight className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => compose(f.members, f.name)} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"><LayoutGrid className="h-3.5 w-3.5" /> Voir les membres côte à côte</button>
                    </div>
                  </div>
                )}
              </article>
            </Reveal>
          );
        })}
      </div>

      {signal && <SignalPanel signal={signal} onClose={() => setSignal(null)} />}
    </section>
  );
}
