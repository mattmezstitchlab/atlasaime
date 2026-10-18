import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, GitMerge, Layers, Link2, Sparkles } from 'lucide-react';
import type { CollectionId, Project } from '../../types';
import type { RepoSnapshot } from '../../data/repos';
import { COLLECTIONS } from '../../data/repos';
import {
  buildStitchProject,
  composeLinks,
  domainSummaries,
  encodeAssemblage,
  gatherSections,
  harvestSubSections,
  ROLE_LABEL,
  stitchDomain,
  type Section,
} from '../../data/stitch';
import { AssemblageView } from './AssemblageView';
import { cn } from '../../utils/cn';

const DOMAIN_LABEL: Record<string, string> = Object.fromEntries(COLLECTIONS.map((c) => [c.id, c.label]));
const RESOLVABLE = /^(gh:|m:|url:|yt:)/;

export function DomainStitch({ repos, onCreate }: { repos: RepoSnapshot[]; onCreate: (p: Project) => void }) {
  const [domain, setDomain] = useState<string | null>(null);
  const [assembled, setAssembled] = useState<Section[] | null>(null);
  const [blockLevel, setBlockLevel] = useState(false);
  const [memory, setMemory] = useState(true);
  const [extra, setExtra] = useState<Section[]>([]);
  const [harvesting, setHarvesting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const sectionsBase = useMemo(() => gatherSections(repos), [repos]);
  const sections = useMemo(() => {
    const map = new Map<string, Section>();
    for (const s of [...sectionsBase, ...extra]) map.set(s.fragment.id, s);
    return [...map.values()];
  }, [sectionsBase, extra]);

  const domains = useMemo(() => domainSummaries(sections), [sections]);
  const picks = useMemo(() => (domain ? stitchDomain(sections, domain as CollectionId) : []), [sections, domain]);
  const label = domain ? DOMAIN_LABEL[domain] ?? domain : '';
  const links = useMemo(() => (memory ? composeLinks(picks, label) : []), [memory, picks, label]);

  useEffect(() => {
    let alive = true;
    if (!blockLevel) {
      setExtra([]);
      return;
    }
    setHarvesting(true);
    harvestSubSections(repos)
      .then((s) => alive && setExtra(s))
      .finally(() => alive && setHarvesting(false));
    return () => {
      alive = false;
    };
  }, [blockLevel, repos]);

  const flash = (m: string) => {
    setNotice(m);
    window.setTimeout(() => setNotice(null), 2400);
  };

  const share = () => {
    const ids = picks.map((p) => p.fragment.id).filter((id) => RESOLVABLE.test(id));
    if (!ids.length || !domain) return;
    const code = encodeAssemblage(domain as CollectionId, ids);
    const url = `${location.origin}${location.pathname}#assemblage=${code}`;
    history.replaceState(null, '', url);
    navigator.clipboard?.writeText(url).catch(() => {});
    flash('Lien partageable copié');
  };

  return (
    <section aria-label="Assemblage de domaine">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400">Assemblage · une page, tous les dépôts</p>
          <h2 className="font-display mt-2 text-4xl leading-none sm:text-5xl">
            Le même domaine, <em className="text-gray-400">recomposé.</em>
          </h2>
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-gray-500">
            On regroupe les liens, médias et extraits documentaires par domaine et par rôle. Le mode README extrait du texte, pas les composants des applications. Le résultat est une composition visuelle éditable, sans fusion de code ni connexion de données.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {domains.map((d) => (
            <button
              key={d.domain}
              type="button"
              onClick={() => setDomain(d.domain)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors',
                domain === d.domain ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
              )}
            >
              {DOMAIN_LABEL[d.domain] ?? d.domain} · {d.count}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setBlockLevel((v) => !v)}
          className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors', blockLevel ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300')}
        >
          <Layers className="h-3.5 w-3.5" /> Extraits de README {harvesting && <span className="text-[10px]">· récolte…</span>}
        </button>
        <button
          type="button"
          onClick={() => setMemory((v) => !v)}
          className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors', memory ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300')}
        >
          <Sparkles className="h-3.5 w-3.5" /> Texte de liaison · modèles locaux
        </button>
      </div>

      {domain && (
        <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              <Layers className="h-4 w-4 text-[#0071e3]" /> {label} · {picks.length} sections complémentaires
            </h3>
            <span className="font-mono text-[11px] text-gray-400">{new Set(picks.map((p) => p.source)).size} dépôts mobilisés</span>
          </div>

          <ol className="mt-4 space-y-2">
            {picks.map((p, i) => (
              <li key={`${p.fragment.id}-${i}`} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-[#fbfbfd] px-3 py-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-white">{i + 1}</span>
                <span className="shrink-0 rounded-md bg-gray-900 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">{ROLE_LABEL[p.role]}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-gray-900">{p.fragment.name}</span>
                <span className="shrink-0 rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-gray-500">{p.source}</span>
              </li>
            ))}
            {picks.length === 0 && <li className="text-[12px] text-gray-400">Aucune section exploitable dans ce domaine.</li>}
          </ol>

          {picks.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAssembled(picks)}
                className="flex items-center gap-2 rounded-xl bg-[#0071e3] px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#0077ed]"
              >
                <Sparkles className="h-3.5 w-3.5" /> Assembler bord à bord <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onCreate(buildStitchProject(`Assemblage · ${label}`, picks, repos, links))}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[12px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <GitMerge className="h-3.5 w-3.5" /> Ouvrir dans l’éditeur
              </button>
              <button
                type="button"
                onClick={share}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[12px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Link2 className="h-3.5 w-3.5" /> Copier le lien
              </button>
            </div>
          )}
        </div>
      )}

      {assembled && domain && (
        <AssemblageView
          picks={assembled}
          domain={domain as CollectionId}
          links={memory ? composeLinks(assembled, label) : []}
          onClose={() => setAssembled(null)}
          onShare={share}
          onOpenEditor={() => {
            onCreate(buildStitchProject(`Assemblage · ${label}`, assembled, repos, memory ? composeLinks(assembled, label) : []));
            setAssembled(null);
          }}
        />
      )}

      {notice && <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-xs text-white shadow-lg">{notice}</div>}
    </section>
  );
}
