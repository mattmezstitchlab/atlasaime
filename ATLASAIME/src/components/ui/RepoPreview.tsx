import { useState } from 'react';
import type { RepoSnapshot } from '../../data/repos';
import { resolveRepoPreview, repoPreview } from '../../data/repoPreview';

export function RepoPreview({ repo }: { repo: RepoSnapshot }) {
  const initial = repoPreview(repo);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const preview = resolveRepoPreview(repo, failedUrl);
  return <>
    <img src={preview.url} alt={`${preview.label} : ${repo.name}. ${preview.description}`} loading="lazy" decoding="async"
      onError={() => setFailedUrl(initial.url)} className="absolute inset-0 h-full w-full object-cover object-top" />
    <span title={preview.description} className="absolute bottom-2 left-2 right-2 rounded-md bg-white/95 px-2 py-1 text-[10px] font-medium text-gray-800 shadow-sm">{preview.label}</span>
  </>;
}
