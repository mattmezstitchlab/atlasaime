import { ArrowRight, ExternalLink, GitMerge, Link2, Sparkles, X } from 'lucide-react';
import type { CollectionId } from '../../types';
import { COLLECTIONS } from '../../data/repos';
import { Reveal } from '../ui/controls';
import { ROLE_LABEL, type LinkBand, type Section } from '../../data/stitch';

const DOMAIN_LABEL: Record<string, string> = Object.fromEntries(COLLECTIONS.map((c) => [c.id, c.label]));

function mediaOf(f: Section['fragment']) {
  if (f.kind === 'video') {
    const yt = /youtube\.com|youtu\.be/i.test(f.url ?? '');
    if (yt && f.url) return { kind: 'yt' as const, url: f.url };
    if (f.url) return { kind: 'video' as const, url: f.url };
  }
  if (f.kind === 'audio' && f.url) return { kind: 'audio' as const, url: f.url };
  if (f.poster || f.fallbackPoster) return { kind: 'img' as const, url: f.poster ?? f.fallbackPoster! };
  return { kind: 'none' as const };
}

function Band({ section }: { section: Section }) {
  const { fragment: f, role, source } = section;
  const media = mediaOf(f);
  const isText = f.kind === 'text';
  const isCode = f.kind === 'repo' || f.kind === 'code';

  return (
    <section className="relative w-full">
      <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-black/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white">{ROLE_LABEL[role]}</span>
        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-gray-800 ring-1 ring-black/10">{source}</span>
      </div>

      {isText ? (
        <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#fbfbfd] px-6 py-16">
          <div className="max-w-2xl text-center">
            {f.text?.eyebrow && <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-400">{f.text.eyebrow}</div>}
            <h3 className="font-display mt-3 text-4xl font-semibold leading-tight tracking-tight text-gray-950 sm:text-5xl">{f.text?.title}</h3>
            {f.text?.body && <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-600 sm:text-lg">{f.text.body}</p>}
          </div>
        </div>
      ) : isCode ? (
        <div className="flex min-h-[55vh] w-full items-center justify-center bg-[#fbfbfd] px-6 py-16">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="font-mono text-[10px] uppercase tracking-wider text-gray-400">Dépôt · {f.language ?? 'code'}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-950">{f.name}</div>
            <p className="mt-2 text-[13px] text-gray-500">{f.description || f.subtitle}</p>
          </div>
        </div>
      ) : media.kind === 'img' ? (
        <div className="relative h-[68vh] w-full overflow-hidden bg-gray-100">
          <img src={media.url} alt={f.name} className="h-full w-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <div className="text-2xl font-semibold tracking-tight sm:text-3xl">{f.name}</div>
            {(f.headline || f.description) && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-white/85">{f.headline ?? f.description}</p>}
          </div>
        </div>
      ) : media.kind === 'yt' ? (
        <div className="relative h-[68vh] w-full bg-black">
          <iframe src={media.url.replace('watch?v=', 'embed/')} title={f.name} className="absolute inset-0 h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      ) : media.kind === 'video' ? (
        <div className="relative flex h-[68vh] w-full items-center justify-center bg-black">
          <video src={media.url} controls className="max-h-full max-w-full" />
        </div>
      ) : media.kind === 'audio' ? (
        <div className="flex min-h-[45vh] w-full flex-col items-center justify-center gap-4 bg-[#fbfbfd] px-6">
          <div className="text-xl font-semibold text-gray-950">{f.name}</div>
          <audio src={media.url} controls className="w-full max-w-md" />
        </div>
      ) : (
        <div className="flex min-h-[50vh] w-full items-center justify-center bg-[#fbfbfd]">
          <div className="text-[13px] text-gray-400">{f.name}</div>
        </div>
      )}
    </section>
  );
}

function LinkBandView({ band }: { band: LinkBand }) {
  return (
    <div className="flex min-h-[42vh] w-full items-center justify-center bg-white px-6 py-14">
      <div className="max-w-2xl text-center">
        <div className="mx-auto mb-3 flex w-fit items-center gap-1.5 rounded-full bg-[#0071e3]/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[#0071e3]">
          <Sparkles className="h-3 w-3" /> Mémoire générative
        </div>
        {band.text.eyebrow && <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-400">{band.text.eyebrow}</div>}
        <h3 className="font-display mt-2 text-3xl font-semibold leading-tight tracking-tight text-gray-950 sm:text-4xl">{band.text.title}</h3>
        {band.text.body && <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-gray-600">{band.text.body}</p>}
      </div>
    </div>
  );
}

export function AssemblageView({
  picks,
  domain,
  onClose,
  onOpenEditor,
  links,
  onShare,
}: {
  picks: Section[];
  domain: CollectionId;
  onClose: () => void;
  onOpenEditor: () => void;
  links?: LinkBand[];
  onShare?: () => void;
}) {
  const repos = new Set(picks.map((p) => p.source)).size;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-gray-950">
            {DOMAIN_LABEL[domain] ?? domain} · {picks.length} sections
          </div>
          <div className="text-[10px] text-gray-400">Assemblé bord à bord · depuis {repos} dépôt{picks.length > 1 ? 's' : ''} du domaine</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenEditor}
            className="flex items-center gap-1.5 rounded-lg bg-[#0071e3] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#0077ed]"
          >
            <GitMerge className="h-3.5 w-3.5" /> Ouvrir dans l’éditeur
          </button>
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Link2 className="h-3.5 w-3.5" /> Copier le lien
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <X className="h-3.5 w-3.5" /> Fermer
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {picks.map((p, i) => (
          <Reveal key={`${p.fragment.id}-${i}`}>
            <Band section={p} />
            {p.fragment.url && (
              <a
                href={p.fragment.url}
                target="_blank"
                rel="noreferrer"
                className="block border-t border-black/5 bg-white py-2 text-center text-[11px] text-gray-400 transition-colors hover:text-[#0071e3]"
              >
                Ouvrir « {p.fragment.name} » dans un onglet <ExternalLink className="ml-1 inline h-3 w-3" />
              </a>
            )}
            {links?.[i] && <LinkBandView band={links[i]} />}
          </Reveal>
        ))}
        <div className="flex items-center justify-center gap-2 bg-[#fbfbfd] px-6 py-10 text-[12px] text-gray-400">
          <ArrowRight className="h-3.5 w-3.5" /> Chaque section provient d’un dépôt différent · un seul langage visuel
        </div>
      </div>
    </div>
  );
}
