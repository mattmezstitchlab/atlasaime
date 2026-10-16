import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Info, X, Play, Plus, ExternalLink, Wand2, Trash2, Eraser, RotateCcw, Crop } from 'lucide-react';
import type { Cell, CellSettings, Fragment, LayoutId, Project, ProjectTheme, SupportId, TextContent } from '../../types';
import { LAYOUTS, LAYOUT_MAP, SUPPORTS } from '../../data/layouts';
import { COLLECTIONS, formatDate, formatSize, githubRepoUrl } from '../../data/repos';
import { PROJECT_TYPES } from '../../data/templates';
import { LayoutThumb } from '../ui/LayoutThumb';
import { KindIcon, NumberField, Segmented, SectionLabel, SliderRow, Toggle } from '../ui/controls';
import { cn } from '../../utils/cn';

export interface InspectorProps {
  project: Project;
  cell: Cell | null;
  fragment: Fragment | null;
  label: string;
  size: { w: number; h: number } | null;
  onUpdateProject: (fn: (p: Project) => Project, key?: string) => void;
  onUpdateCell: (cellId: string, fn: (c: Cell) => Cell, key?: string) => void;
  onUpdateFragment: (id: string, patch: Partial<Fragment>) => void;
  onOpenCrop: () => void;
  onClearCell: (id: string) => void;
  onRemoveCell: (id: string) => void;
  onReplace: () => void;
  onAutoFill: () => void;
  onAddCell: () => void;
  onSetLayout: (id: LayoutId) => void;
  onSetSupport: (id: SupportId) => void;
  onSetArrangement: (a: 'grille' | 'libre') => void;
  onPreview: () => void;
  onDeselect: () => void;
  focusContentKey?: number;
  className?: string;
}

const Block = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('border-b border-gray-100 px-4 py-3.5', className)}>{children}</div>
);

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 py-1">
    <span className="text-xs text-gray-700">{label}</span>
    {children}
  </div>
);

const Btn = ({ children, onClick, dark, className, disabled }: { children: ReactNode; onClick?: () => void; dark?: boolean; className?: string; disabled?: boolean }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
      dark ? 'bg-black text-white hover:bg-gray-800' : 'border border-gray-200 text-gray-700 hover:bg-gray-50',
      className,
    )}
  >
    {children}
  </button>
);

const STATUS: Record<string, string> = {
  live: '● En ligne · intégrable en iframe',
  blocked: '◐ CSP frame-ancestors · aperçu statique uniquement',
  offline: '○ Site hors ligne · capture GitHub',
  none: '◇ Code seul · aucun site publié',
  unknown: '● URL externe · intégration tentée',
};

export function Inspector(p: InspectorProps) {
  const [tab, setTab] = useState<'disposition' | 'contenu' | 'animation'>('disposition');
  useEffect(() => { if (p.focusContentKey) setTab('contenu'); }, [p.focusContentKey]);
  const { project, cell, fragment } = p;
  const layout = LAYOUT_MAP[project.layoutId];
  const isFree = project.arrangement === 'libre' || layout.kind === 'free';
  const theme = project.theme;

  const setTheme = (patch: Partial<ProjectTheme>, key?: string) => p.onUpdateProject((pr) => ({ ...pr, theme: { ...pr.theme, ...patch } }), key);
  const set = (patch: Partial<CellSettings>, key?: string) =>
    cell && p.onUpdateCell(cell.id, (c) => ({ ...c, settings: { ...c.settings, ...patch } }), key);
  const setText = (patch: Partial<TextContent>) =>
    fragment?.text && p.onUpdateFragment(fragment.id, { text: { ...fragment.text, ...patch }, name: (patch.title ?? fragment.text.title).slice(0, 34) });

  return (
    <aside className={cn('flex h-full w-[300px] shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white text-xs', p.className)}>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-gray-500">INSPECTEUR</span>
        <span title="Sélectionnez une cellule pour la régler — sinon, réglages de la composition" className="text-gray-400">
          <Info className="h-3.5 w-3.5" />
        </span>
      </div>

      {!cell ? (
        <div className="flex-1 overflow-y-auto">
          <Block>
            <SectionLabel>Projet</SectionLabel>
            <input
              value={project.name}
              onChange={(e) => p.onUpdateProject((pr) => ({ ...pr, name: e.target.value }), 'name')}
              aria-label="Nom du projet"
              className="mb-2 w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-[13px] font-semibold text-gray-900 outline-none focus:border-black"
            />
            <select
              value={project.typeId}
              aria-label="Type de projet"
              onChange={(e) => p.onUpdateProject((pr) => ({ ...pr, typeId: e.target.value as Project['typeId'] }))}
              className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-black"
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Block>
          <Block>
            <SectionLabel>Composition</SectionLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  title={`${l.name} — ${l.description}`}
                  onClick={() => p.onSetLayout(l.id)}
                  className={cn('rounded-lg border p-1 transition-all hover:border-gray-400', l.id === project.layoutId ? 'border-black ring-1 ring-black' : 'border-gray-200')}
                >
                  <LayoutThumb layoutId={l.id} active={l.id === project.layoutId} className="rounded bg-gray-50" />
                  <span className="mt-1 block truncate text-[10px] text-gray-600">{l.name}</span>
                </button>
              ))}
            </div>
          </Block>
          <Block>
            <SectionLabel>Support</SectionLabel>
            <div className="grid grid-cols-5 gap-1">
              {SUPPORTS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    title={`${s.name} · ${s.detail}`}
                    onClick={() => p.onSetSupport(s.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-md border py-1.5 text-[10px] transition-colors',
                      project.supportId === s.id ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {s.name}
                  </button>
                );
              })}
            </div>
          </Block>
          <Block className="space-y-3">
            <SectionLabel>Disposition</SectionLabel>
            <Segmented
              value={isFree ? 'libre' : 'grille'}
              onChange={p.onSetArrangement}
              options={[
                { value: 'grille', label: 'Grille' },
                { value: 'libre', label: 'Libre' },
              ]}
            />
            <SliderRow label="Gouttière" value={theme.gap} min={0} max={48} unit=" px" onChange={(v) => setTheme({ gap: v }, 'gap')} />
            <SliderRow label="Marges" value={theme.padding} min={0} max={120} unit=" px" onChange={(v) => setTheme({ padding: v }, 'padding')} />
          </Block>
          <Block>
            <SectionLabel>Fond</SectionLabel>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  ['blanc', 'bg-white'],
                  ['papier', 'bg-[#f7f5f0]'],
                  ['points', 'bg-white bg-dots'],
                  ['noir', 'bg-[#0c0c0e]'],
                ] as [ProjectTheme['background'], string][]
              ).map(([id, cls]) => (
                <button key={id} type="button" onClick={() => setTheme({ background: id })} className="group flex flex-col items-center gap-1">
                  <span className={cn('h-9 w-full rounded-md ring-1 transition-all', cls, theme.background === id ? 'ring-2 ring-black' : 'ring-gray-200 group-hover:ring-gray-400')} />
                  <span className="text-[10px] capitalize text-gray-500">{id}</span>
                </button>
              ))}
            </div>
          </Block>
          <Block>
            <Row label="Libellés des cellules">
              <Toggle checked={theme.showLabels} onChange={(v) => setTheme({ showLabels: v })} label="Libellés" />
            </Row>
            <Row label="Respecter « réduire les animations »">
              <Toggle checked={theme.reduceMotion} onChange={(v) => setTheme({ reduceMotion: v })} label="Réduire les animations" />
            </Row>
          </Block>
          <Block className="space-y-2.5">
            <SectionLabel>Contenu</SectionLabel>
            <p className="font-mono text-[10px] text-gray-500">
              {project.cells.length} cellules · {project.cells.filter((c) => c.fragmentId).length} remplies · {layout.name}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Btn onClick={p.onAddCell}>
                <Plus className="h-3.5 w-3.5" /> Cellule
              </Btn>
              <Btn dark onClick={p.onAutoFill}>
                <Wand2 className="h-3.5 w-3.5" /> Remplir
              </Btn>
            </div>
            <p className="text-[10px] leading-relaxed text-gray-400">« Remplir » complète les cellules vides avec tes sites GitHub en ligne les plus récents.</p>
          </Block>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-200/80 text-gray-700">
              {fragment ? <KindIcon kind={fragment.kind} /> : <Plus className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-black">{fragment ? fragment.name : `Cellule ${p.label}`}</div>
              <div className="truncate text-[11px] text-gray-400">{fragment ? fragment.subtitle : 'vide · déposez un fragment'}</div>
            </div>
            <button type="button" aria-label="Désélectionner" onClick={p.onDeselect} className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-black">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex border-b border-gray-200 px-3">
            {(
              [
                ['disposition', 'Disposition'],
                ['contenu', 'Contenu'],
                ['animation', 'Animation'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn('border-b-2 px-2.5 py-2 text-xs font-medium transition-colors', tab === id ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700')}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {tab === 'disposition' && (
              <>
                <Block className="space-y-2">
                  <SectionLabel
                    action={
                      !isFree && (cell.settings.colSpan || cell.settings.rowSpan) ? (
                        <button type="button" onClick={() => set({ colSpan: undefined, rowSpan: undefined })} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-black">
                          <RotateCcw className="h-3 w-3" /> gabarit
                        </button>
                      ) : null
                    }
                  >
                    Position & taille · {p.label}
                  </SectionLabel>
                  {isFree ? (
                    <div className="grid grid-cols-2 gap-2">
                      {(['x', 'y', 'w', 'h'] as const).map((k) => (
                        <NumberField
                          key={k}
                          label={k === 'w' ? 'L' : k === 'h' ? 'H' : k.toUpperCase()}
                          value={cell.rect?.[k] ?? 0}
                          disabled={(k === 'x' || k === 'y') ? cell.settings.locks.position : cell.settings.locks.size}
                          onChange={(v) =>
                            p.onUpdateCell(cell.id, (c) => ({ ...c, rect: { ...(c.rect ?? { x: 0, y: 0, w: 400, h: 300 }), [k]: v } }), `rect-${k}`)
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <NumberField
                        label="Col."
                        title="Colonnes occupées"
                        value={cell.settings.colSpan ?? layout.slots[project.cells.indexOf(cell)]?.colSpan ?? 1}
                        disabled={cell.settings.locks.size}
                        onChange={(v) => set({ colSpan: Math.max(1, Math.min(layout.cols, v)) }, 'colspan')}
                      />
                      <NumberField
                        label="Rang."
                        title="Rangées occupées"
                        value={cell.settings.rowSpan ?? layout.slots[project.cells.indexOf(cell)]?.rowSpan ?? 1}
                        disabled={cell.settings.locks.size}
                        onChange={(v) => set({ rowSpan: Math.max(1, Math.min(16, v)) }, 'rowspan')}
                      />
                    </div>
                  )}
                  {p.size && (
                    <p className="font-mono text-[10px] text-gray-400">
                      {Math.round(p.size.w)} × {Math.round(p.size.h)} px · {isFree ? 'placement libre' : 'poignées = fusionner les cellules'}
                    </p>
                  )}
                  <input
                    value={cell.label ?? ''}
                    placeholder="Libellé (frise, diapositive…)"
                    onChange={(e) => p.onUpdateCell(cell.id, (c) => ({ ...c, label: e.target.value || undefined }), 'label')}
                    className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs outline-none placeholder:text-gray-400 focus:border-black"
                  />
                </Block>

                {fragment?.kind === 'site' && (
                  <Block className="space-y-2.5">
                    <SectionLabel
                      action={
                        <button
                          type="button"
                          disabled={cell.settings.locks.crop}
                          onClick={p.onOpenCrop}
                          className="rounded bg-black px-2 py-0.5 text-[10px] font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                        >
                          {cell.settings.crop ? 'Rouvrir' : 'Recadrer'}
                        </button>
                      }
                    >
                      Recadrage
                    </SectionLabel>
                    {cell.settings.crop ? (
                      <div className="grid grid-cols-2 gap-2">
                        <NumberField
                          label="Décalage X"
                          value={-cell.settings.crop.x}
                          disabled={cell.settings.locks.crop}
                          onChange={(v) => cell.settings.crop && set({ crop: { ...cell.settings.crop, x: Math.max(0, -v) } }, 'cropx')}
                        />
                        <NumberField
                          label="Y"
                          value={-cell.settings.crop.y}
                          disabled={cell.settings.locks.crop}
                          onChange={(v) => cell.settings.crop && set({ crop: { ...cell.settings.crop, y: Math.max(0, -v) } }, 'cropy')}
                        />
                      </div>
                    ) : (
                      <p className="rounded-md border border-dashed border-gray-200 px-2.5 py-2 text-[11px] text-gray-500">Page entière · aucune zone définie</p>
                    )}
                    <Segmented
                      value={cell.settings.viewport}
                      onChange={(v) => set({ viewport: v, crop: null })}
                      options={[
                        { value: 390, label: '390' },
                        { value: 820, label: '820' },
                        { value: 1440, label: '1440' },
                      ]}
                    />
                    <SliderRow label="Échelle du contenu" value={cell.settings.scale} min={50} max={200} unit=" %" onChange={(v) => set({ scale: v }, 'scale')} />
                    <Segmented
                      value={cell.settings.fit}
                      onChange={(v) => set({ fit: v })}
                      options={[
                        { value: 'adapter', label: 'Adapter' },
                        { value: 'remplir', label: 'Remplir' },
                        { value: 'original', label: '100 %' },
                      ]}
                    />
                    <Row label="Masquer le débordement">
                      <Toggle checked={cell.settings.hideOverflow} onChange={(v) => set({ hideOverflow: v })} label="Masquer le débordement" />
                    </Row>
                  </Block>
                )}

                <Block className="space-y-3">
                  <SectionLabel>Aspect</SectionLabel>
                  <SliderRow label="Opacité" value={cell.settings.opacity} min={0} max={100} unit=" %" onChange={(v) => set({ opacity: v }, 'opacity')} />
                  <SliderRow label="Rayon" value={cell.settings.radius} min={0} max={40} unit=" px" onChange={(v) => set({ radius: v }, 'radius')} />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => set({ border: !cell.settings.border })}
                      className="flex items-center justify-between rounded-md border border-gray-200 px-2.5 py-1.5 hover:bg-gray-50"
                    >
                      <span className="text-[11px] text-gray-400">Bord</span>
                      <span className="font-mono text-xs text-gray-800">{cell.settings.border ? '1 px' : 'aucun'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => set({ shadow: cell.settings.shadow === 'aucune' ? 'douce' : cell.settings.shadow === 'douce' ? 'forte' : 'aucune' })}
                      className="flex items-center justify-between rounded-md border border-gray-200 px-2.5 py-1.5 hover:bg-gray-50"
                    >
                      <span className="text-[11px] text-gray-400">Ombre</span>
                      <span className="text-xs capitalize text-gray-800">{cell.settings.shadow}</span>
                    </button>
                  </div>
                </Block>

                <Block>
                  <SectionLabel>Verrouillages</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        ['position', 'Position'],
                        ['size', 'Taille'],
                        ['content', 'Contenu'],
                        ['crop', 'Cadrage'],
                        ['interaction', 'Interaction'],
                      ] as const
                    ).map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => set({ locks: { ...cell.settings.locks, [k]: !cell.settings.locks[k] } })}
                        className={cn(
                          'rounded-md border px-3 py-1 text-[12px] font-medium transition-colors',
                          cell.settings.locks[k] ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Block>

                <Block className="grid grid-cols-2 gap-2 border-b-0">
                  <Btn onClick={() => p.onClearCell(cell.id)} disabled={!fragment}>
                    <Eraser className="h-3.5 w-3.5" /> Vider
                  </Btn>
                  <Btn onClick={() => p.onRemoveCell(cell.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                  </Btn>
                </Block>
              </>
            )}

            {tab === 'contenu' && (
              <>
                <Block className="space-y-2.5">
                  <SectionLabel>Source</SectionLabel>
                  {fragment ? (
                    <>
                      <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-2">
                        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', fragment.embed === 'live' ? 'bg-black' : 'bg-gray-300')} />
                        <span className="truncate font-mono text-[11px] text-gray-600">
                          {fragment.url && !fragment.url.startsWith('data:') && !fragment.url.startsWith('blob:')
                            ? fragment.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
                            : fragment.repo
                              ? `github.com/mattmezstitchlab/${fragment.repo}`
                              : fragment.subtitle}
                        </span>
                      </div>
                      {fragment.embed && <p className="font-mono text-[10px] text-gray-500">{STATUS[fragment.embed]}</p>}
                      {fragment.headline && <p className="text-[12px] font-medium leading-snug text-gray-800">{fragment.headline}</p>}
                      {fragment.description && <p className="text-[11px] leading-relaxed text-gray-500">{fragment.description}</p>}
                      {fragment.kind === 'site' && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] text-gray-500">Aperçu</span>
                          <Segmented
                            value={fragment.embed === 'live' || fragment.embed === 'unknown' ? cell.settings.preview : 'capture'}
                            onChange={(v) => set({ preview: v })}
                            options={[
                              { value: 'live', label: 'Live (iframe)' },
                              { value: 'capture', label: 'Capture' },
                            ]}
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {fragment.url && (
                          <a href={fragment.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-md border border-gray-200 px-2 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50">
                            <ExternalLink className="h-3.5 w-3.5" /> Site
                          </a>
                        )}
                        {fragment.repo && (
                          <a href={githubRepoUrl(fragment.repo)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-md border border-gray-200 px-2 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50">
                            <ExternalLink className="h-3.5 w-3.5" /> GitHub
                          </a>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-gray-500">Cellule vide — glissez un fragment depuis la bibliothèque ou utilisez « Remplacer… ».</p>
                  )}
                </Block>

                {fragment?.text && (
                  <Block className="space-y-2">
                    <SectionLabel>Texte</SectionLabel>
                    <input
                      value={fragment.text.eyebrow ?? ''}
                      placeholder="Surtitre"
                      onChange={(e) => setText({ eyebrow: e.target.value })}
                      className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 font-mono text-[11px] uppercase outline-none focus:border-black"
                    />
                    <textarea
                      value={fragment.text.title}
                      rows={2}
                      placeholder="Titre"
                      onChange={(e) => setText({ title: e.target.value })}
                      className="font-display w-full resize-none rounded-md border border-gray-200 px-2.5 py-1.5 text-lg leading-tight outline-none focus:border-black"
                    />
                    <textarea
                      value={fragment.text.body ?? ''}
                      rows={4}
                      placeholder="Texte"
                      onChange={(e) => setText({ body: e.target.value })}
                      className="w-full resize-none rounded-md border border-gray-200 px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-black"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Segmented
                        value={fragment.text.align ?? 'left'}
                        onChange={(v) => setText({ align: v })}
                        options={[
                          { value: 'left', label: 'Gauche' },
                          { value: 'center', label: 'Centre' },
                        ]}
                      />
                      <Segmented
                        value={fragment.text.tone ?? 'clair'}
                        onChange={(v) => setText({ tone: v })}
                        options={[
                          { value: 'clair', label: 'Clair' },
                          { value: 'sombre', label: 'Sombre' },
                        ]}
                      />
                    </div>
                  </Block>
                )}

                {fragment?.pushedAt && (
                  <Block>
                    <SectionLabel>Métadonnées GitHub</SectionLabel>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[10px]">
                      <dt className="text-gray-400">Langage</dt>
                      <dd className="text-right text-gray-700">{fragment.language ?? '—'}</dd>
                      <dt className="text-gray-400">Taille</dt>
                      <dd className="text-right text-gray-700">{formatSize(fragment.size ?? 0)}</dd>
                      <dt className="text-gray-400">Créé</dt>
                      <dd className="text-right text-gray-700">{fragment.createdAt ? formatDate(fragment.createdAt) : '—'}</dd>
                      <dt className="text-gray-400">Dernier push</dt>
                      <dd className="text-right text-gray-700">{formatDate(fragment.pushedAt)}</dd>
                      <dt className="text-gray-400">Collection</dt>
                      <dd className="text-right text-gray-700">{COLLECTIONS.find((c) => c.id === fragment.collection)?.label ?? '—'}</dd>
                    </dl>
                  </Block>
                )}

                {fragment?.credit && (
                  <Block>
                    <SectionLabel>Crédit</SectionLabel>
                    <p className="text-[11px] text-gray-600">© {fragment.credit}</p>
                  </Block>
                )}

                <Block className="grid grid-cols-2 gap-2 border-b-0">
                  <Btn onClick={p.onReplace} disabled={cell.settings.locks.content}>
                    Remplacer…
                  </Btn>
                  <Btn dark onClick={p.onOpenCrop} disabled={fragment?.kind !== 'site' || cell.settings.locks.crop}>
                    <Crop className="h-3.5 w-3.5" /> Cadrage
                  </Btn>
                </Block>
              </>
            )}

            {tab === 'animation' && (
              <>
                <Block className="space-y-2">
                  <SectionLabel>Animations</SectionLabel>
                  {[
                    {
                      on: cell.settings.animation !== 'aucune',
                      name: { aucune: 'Aucune entrée', fade: 'Fade in', slide: 'Slide up', zoom: 'Zoom in' }[cell.settings.animation],
                      meta: `${cell.settings.duration} ms · délai ${cell.settings.delay}`,
                    },
                    {
                      on: cell.settings.hover !== 'aucun',
                      name: { aucun: 'Aucun survol', zoom: 'Zoom · survol', lift: 'Élévation · survol' }[cell.settings.hover],
                      meta: '300 ms · boucle',
                    },
                  ].map((a) => (
                    <div key={a.name} className={cn('flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2', !a.on && 'opacity-50')}>
                      <span className="flex items-center gap-2.5">
                        <Play className="h-3 w-3 rotate-180 fill-current" />
                        <span className="text-[12px] font-medium text-gray-900">{a.name}</span>
                      </span>
                      <span className="font-mono text-[10px] text-gray-400">{a.meta}</span>
                    </div>
                  ))}
                </Block>
                <Block className="space-y-3">
                  <SectionLabel>Entrée</SectionLabel>
                  <Segmented
                    value={cell.settings.animation}
                    onChange={(v) => set({ animation: v })}
                    options={[
                      { value: 'aucune', label: 'Aucune' },
                      { value: 'fade', label: 'Fondu' },
                      { value: 'slide', label: 'Glissé' },
                      { value: 'zoom', label: 'Zoom' },
                    ]}
                  />
                  <SliderRow label="Durée" value={cell.settings.duration} min={120} max={1400} step={20} unit=" ms" onChange={(v) => set({ duration: v }, 'duration')} />
                  <SliderRow label="Délai" value={cell.settings.delay} min={0} max={1200} step={20} unit=" ms" onChange={(v) => set({ delay: v }, 'delay')} />
                </Block>
                <Block className="space-y-3">
                  <SectionLabel>Survol</SectionLabel>
                  <Segmented
                    value={cell.settings.hover}
                    onChange={(v) => set({ hover: v })}
                    options={[
                      { value: 'aucun', label: 'Aucun' },
                      { value: 'zoom', label: 'Zoom' },
                      { value: 'lift', label: 'Élévation' },
                    ]}
                  />
                  <Btn dark onClick={p.onPreview} className="w-full">
                    <Play className="h-3.5 w-3.5 fill-current" /> Prévisualiser (mode UTILISER)
                  </Btn>
                </Block>
                <Block className="border-b-0">
                  <Row label="Respecter « réduire les animations »">
                    <Toggle checked={theme.reduceMotion} onChange={(v) => setTheme({ reduceMotion: v })} label="Réduire les animations" />
                  </Row>
                </Block>
              </>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
