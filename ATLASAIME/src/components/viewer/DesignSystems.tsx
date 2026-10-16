import { useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { RepoSnapshot } from '../../data/repos';
import { DOCUMENTED_SYSTEMS, EXTRACTED_PALETTES, paletteForRepo, systemForRepo } from '../../data/designSystems';
import type { DesignSystem } from '../../data/designSystems';
import { screenshotUrl } from '../../data/repos';
import { AtlasLogo } from '../ui/controls';
import { cn } from '../../utils/cn';
import { WorkspaceNav } from '../ui/WorkspaceNav';

const STATUS: Record<DesignSystem['status'], string> = {
  documente: 'Documenté',
  production: 'En production',
  extrait: 'Extrait du CSS',
  absent: 'Absent',
};

export function DesignSystems({
  repos,
  initialId,
  onBack,
  onOpenViewer,
  onOpenDesk,
}: {
  repos: RepoSnapshot[];
  initialId?: string | null;
  onBack: () => void;
  onOpenViewer: () => void;
  onOpenDesk: () => void;
}) {
  const [id, setId] = useState(initialId && DOCUMENTED_SYSTEMS.some((s) => s.id === initialId) ? initialId : DOCUMENTED_SYSTEMS[0].id);
  const system = DOCUMENTED_SYSTEMS.find((s) => s.id === id) ?? DOCUMENTED_SYSTEMS[0];
  const ink = system.colors.find((c) => /encre|noir|nuit/i.test(c.name))?.hex ?? '#161616';
  const accent = system.colors.find((c) => /accent|turquoise|rose|fuchsia|lagon|rouge|fil|or/i.test(c.role + c.name))?.hex ?? system.colors[0]?.hex ?? '#000';
  const paper = system.colors.find((c) => /fond|sable|papier|surface/i.test(c.role + c.name))?.hex ?? '#F7F8F8';

  const rows = useMemo(
    () =>
      repos
        .filter((r) => r.size > 0)
        .map((r) => ({
          repo: r,
          system: systemForRepo(r.name),
          palette: paletteForRepo(r.name),
        })),
    [repos],
  );

  return (
    <div className="h-screen overflow-y-auto bg-[#f5f5f7] text-gray-900">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label="Retour" className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-black">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <AtlasLogo compact />
          <span className="text-[13px] font-semibold">Design systems</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block"><WorkspaceNav active="systems" onNavigate={(page) => { if (page === 'home') onBack(); else if (page === 'viewer') onOpenViewer(); else if (page === 'desk') onOpenDesk(); }} /></div>
          <div className="md:hidden"><WorkspaceNav compact active="systems" onNavigate={(page) => { if (page === 'home') onBack(); else if (page === 'viewer') onOpenViewer(); else if (page === 'desk') onOpenDesk(); }} /></div>
          <span className="hidden font-mono text-[10px] text-gray-400 xl:inline">
            {DOCUMENTED_SYSTEMS.length} spécimens · {EXTRACTED_PALETTES.length} palettes · {repos.length} dépôts
          </span>
        </div>
      </header>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400">Tous les projets · un langage par projet</div>
          <h1 className="font-display mt-3 max-w-3xl text-5xl leading-[0.95] sm:text-6xl">
            Le design system <em className="text-gray-400">de chaque projet.</em>
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-gray-500">
            Trois systèmes sont documentés : LE MONDE AIME®, sa mise en production sur Base44, et ATLAS. Les autres sites en ligne ont une palette extraite de leur CSS publié. Les dépôts sans site n’ont pas de système visible — c’est indiqué, pas inventé.
          </p>
        </div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-6 sm:px-6">
          {DOCUMENTED_SYSTEMS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setId(s.id)}
              className={cn('w-44 shrink-0 rounded-2xl border p-3 text-left transition-all', s.id === system.id ? 'border-black bg-white shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300')}
            >
              <span className="flex h-8 overflow-hidden rounded-md">
                {s.colors.slice(0, 5).map((c) => (
                  <span key={c.hex + c.name} className="h-full flex-1" style={{ background: c.hex }} />
                ))}
              </span>
              <span className="mt-2 block truncate text-[13px] font-semibold">{s.name}</span>
              <span className="font-mono text-[10px] text-gray-400">{STATUS[s.status]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-400">Spécimen</div>
          <div className="mt-2 text-xl font-semibold">{system.name}</div>
          <p className="mt-2 text-[12px] leading-relaxed text-gray-500">{system.summary}</p>
          <p className="mt-3 font-mono text-[10px] leading-relaxed text-gray-400">{system.verified}</p>
          {system.url && (
            <a href={system.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-800 hover:underline">
              Voir le site <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </aside>

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-10 sm:px-10" style={{ background: paper, color: ink }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-50">{system.project}</div>
            <h2 className="mt-3 max-w-xl text-4xl leading-[1.02] sm:text-5xl" style={{ fontFamily: system.fonts[0]?.name.includes('Variable') ? 'inherit' : `${system.fonts[0]?.name}, serif` }}>
              {system.fonts[0]?.sample}
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed opacity-70" style={{ fontFamily: `${system.fonts[1]?.name ?? system.fonts[0]?.name}, sans-serif` }}>
              {system.fonts[1]?.sample ?? system.summary}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full px-4 py-2 text-[13px] font-medium text-white" style={{ background: ink }}>
                Action principale
              </span>
              <span className="rounded-full border px-4 py-2 text-[13px] font-medium" style={{ borderColor: ink, color: ink }}>
                Secondaire
              </span>
              <span className="rounded-full px-3 py-2 text-[12px] font-medium text-white" style={{ background: accent }}>
                Accent
              </span>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:grid-cols-2 sm:p-10">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Couleurs</h3>
              <ul className="mt-3 space-y-2">
                {system.colors.map((c) => (
                  <li key={c.name} className="flex items-center gap-3">
                    <span className="h-9 w-9 shrink-0 rounded-lg ring-1 ring-black/10" style={{ background: c.hex }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium">{c.name}</span>
                      <span className="font-mono text-[10px] text-gray-400">{c.role}</span>
                    </span>
                    <span className="font-mono text-[11px] text-gray-500">{c.hex}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Typographie</h3>
                <ul className="mt-3 space-y-3">
                  {system.fonts.map((f) => (
                    <li key={f.role}>
                      <div className="font-mono text-[10px] text-gray-400">{f.role} · {f.name}</div>
                      <div className="text-2xl leading-tight" style={{ fontFamily: f.name.split('·')[0].trim() }}>{f.sample}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Espacement</h3>
                <div className="mt-3 flex items-end gap-3">
                  {system.spacing.map((n) => (
                    <div key={n} className="text-center">
                      <div className="mx-auto bg-gray-900" style={{ width: n, height: n }} />
                      <div className="mt-1 font-mono text-[10px] text-gray-400">{n}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[12px] text-gray-500">Rayon · {system.radius}</p>
              </div>
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Composants</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {system.components.map((c) => (
                    <span key={c} className="rounded-md border border-gray-200 px-2 py-1 text-[12px]">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {system.url && system.status !== 'documente' && (
            <div className="border-t border-gray-100">
              <img src={screenshotUrl(system.url)} alt="" className="max-h-64 w-full object-cover object-top" />
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-4xl">Tous les dépôts</h2>
          <p className="mt-2 max-w-2xl text-[13px] text-gray-500">
            Une ligne par dépôt. Palette seulement quand le CSS publié la contient. « Absent » veut dire : pas de site, donc pas de système à montrer.
          </p>
          <div className="mt-8 divide-y divide-gray-100">
            {rows.map(({ repo, system: sys, palette }) => {
              const colors = sys?.colors.map((c) => c.hex) ?? palette?.colors ?? [];
              const state = sys ? STATUS[sys.status] : palette ? 'Palette extraite' : repo.homepage ? 'Non extrait' : 'Absent';
              return (
                <div key={repo.name} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="w-44 min-w-0">
                    <div className="truncate text-[13px] font-semibold">{repo.name}</div>
                    <div className="font-mono text-[10px] text-gray-400">{state}</div>
                  </div>
                  <div className="flex h-6 min-w-[120px] flex-1 overflow-hidden rounded-md ring-1 ring-black/5">
                    {colors.length ? (
                      colors.slice(0, 6).map((hex) => <span key={hex} className="h-full flex-1" style={{ background: hex }} title={hex} />)
                    ) : (
                      <span className="flex h-full flex-1 items-center bg-gray-50 px-2 font-mono text-[10px] text-gray-400">pas de tokens</span>
                    )}
                  </div>
                  {sys && (
                    <button type="button" onClick={() => { setId(sys.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[12px] font-medium text-gray-700 hover:underline">
                      Ouvrir
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-10 grid gap-4 rounded-2xl border border-dashed border-gray-300 p-5 sm:grid-cols-3">
            {[
              ['Figma', 'Aucun fichier public relié à ce compte. Collez un lien de frame dans la visionneuse pour l’ajouter.'],
              ['Lovable', 'Aucune app lovable.app publique trouvée. Un lien collé sera classé et prévisualisé.'],
              ['Replit', 'Aucun repl public trouvé. Même geste : coller l’URL dans la visionneuse.'],
            ].map(([name, text]) => (
              <div key={name}>
                <div className="text-[13px] font-semibold">{name}</div>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
