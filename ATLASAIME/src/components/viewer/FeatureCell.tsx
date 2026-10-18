import { RepoPreview } from '../ui/RepoPreview';
import type { RepoSnapshot } from '../../data/repos';
import { useState } from 'react';
import { Check, Minus } from 'lucide-react';
import type { CatalogItem, FeatureGroup } from '../../data/catalog';
import { SIGNAL_LABEL, SOURCE_LABEL } from '../../data/catalog';
import { cn } from '../../utils/cn';

export function FeatureGroups({ groups, dense = false }: { groups: FeatureGroup[]; dense?: boolean }) {
  return (
    <div className={cn('grid gap-2', dense ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
      {groups.map((g) => (
        <div key={g.id} className="min-w-0">
          <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-gray-400">{g.label}</div>
          <ul className="space-y-0.5">
            {g.rows.map((r) => (
              <li key={r.label} className="flex items-center gap-1.5 text-[11px]" title={r.detail}>
                <span className={cn('flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full', r.on ? 'bg-black text-white' : 'bg-gray-100 text-gray-300')}>
                  {r.on ? <Check className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                </span>
                <span className={cn('truncate', r.on ? 'text-gray-800' : 'text-gray-400')}>{r.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function FeatureCell({
  item,
  repo,
  groups,
  selected,
  onSelect,
}: {
  item: CatalogItem;
  repo?: RepoSnapshot;
  groups: FeatureGroup[];
  selected?: boolean;
  onSelect: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const lead = item.signals.find((s) => s === 'fonctionnel' || s === 'hors-ligne' || s === 'vide' || s === 'code');
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-white text-left transition-all hover:-translate-y-0.5 hover:shadow-xl',
        selected ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300',
      )}
    >
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-gray-100">
        {repo ? <RepoPreview repo={repo} /> : item.poster && !failed ? (
          <img
            src={item.poster}
            alt=""
            loading="lazy"
            draggable={false}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-end bg-[#f5f5f3] p-3">
            <span className="font-display text-2xl leading-none text-gray-900">{item.name}</span>
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 rounded-md bg-black/85 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">
          {SOURCE_LABEL[item.source]}
        </span>
        {lead && (
          <span className="absolute right-2.5 top-2.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-gray-800 ring-1 ring-black/5">
            {SIGNAL_LABEL[lead]}
          </span>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-3">
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold text-gray-950">{item.name}</div>
          <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-500">{item.title !== item.name ? item.title : item.description}</div>
        </div>
        <FeatureGroups groups={groups} dense />
      </div>
    </button>
  );
}
