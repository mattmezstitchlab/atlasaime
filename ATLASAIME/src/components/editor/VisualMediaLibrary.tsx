import { useEffect, useState } from 'react';
import type { Fragment } from '../../types';
import { GITHUB_USER } from '../../data/repos';
import { blobDataUrl, importLocalMedia, indexGithubMedia, loadLibraryMedia, type LibraryMedia } from '../../data/mediaLibrary';
function MediaPreview({ item }: { item: LibraryMedia }) {
  const [url, setUrl] = useState(item.url);
  useEffect(() => { if (!item.blob) { setUrl(item.url); return; } const object = URL.createObjectURL(item.blob); setUrl(object); return () => URL.revokeObjectURL(object); }, [item]);
  if (!url) return <p>Chargement…</p>;
  if (item.kind === 'image') return <img src={url} alt={item.name} loading="lazy" className="h-32 w-full object-contain" />;
  if (item.kind === 'video') return <video src={url} controls preload="none" className="h-32 w-full bg-black" />;
  if (item.kind === 'audio') return <audio src={url} controls preload="none" className="w-full" />;
  return <a href={url} target="_blank" rel="noreferrer" className="block py-8 text-center underline">Ouvrir le PDF</a>;
}
export function VisualMediaLibrary({ repoNames, onInsert }: { repoNames: string[]; onInsert: (fragment: Fragment) => void }) {
  const [items, setItems] = useState<LibraryMedia[]>([]);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [kind, setKind] = useState('all');
  const [repo, setRepo] = useState(repoNames[0] ?? '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = async () => setItems(await loadLibraryMedia());
  useEffect(() => { refresh().catch(e => setMessage(e.message)); }, []);
  const importFiles = async (files: File[]) => {
    setBusy(true); const results: string[] = [];
    for (const file of files) { try { await importLocalMedia(file); results.push(`${file.name} : enregistré`); } catch(e) { results.push(e instanceof Error ? e.message : 'Import refusé'); } }
    try { await refresh(); } catch(e) { results.push(String(e)); } setMessage(results.join(' · ')); setBusy(false);
  };
  const shown = items.filter(i => (source === 'all' || (source === 'local' ? !!i.blob : !i.blob)) && (kind === 'all' || i.kind === kind) && `${i.name} ${i.origin}`.toLowerCase().includes(query.toLowerCase()));
  return <section aria-label="Médiathèque visuelle" className="space-y-3 border-b p-3" onDragOver={e => { if (!busy) e.preventDefault(); }} onDrop={e => { e.preventDefault(); if (!busy && e.dataTransfer.files.length) void importFiles(Array.from(e.dataTransfer.files)); }}>
    <h2 className="font-semibold">Médiathèque visuelle</h2>
    <p className="text-xs text-gray-500">Fichiers locaux sur cet appareil uniquement (100 Mo maximum par fichier). Gardez les originaux : la médiathèque entière n’est pas incluse dans les sauvegardes et disparaît si les données du site sont effacées. Insertion dans une composition : 10 Mo maximum. Aucun accès automatique à vos dossiers. GitHub : dépôts publics, indexation à la demande.</p>
    <label className="block text-xs">Importer plusieurs fichiers<input disabled={busy} type="file" multiple accept="image/*,video/*,audio/*,application/pdf" onChange={e => { const files = Array.from(e.target.files ?? []); e.target.value = ''; void importFiles(files); }} /></label>
    <div className="flex gap-2"><select aria-label="Dépôt GitHub à indexer" value={repo} onChange={e => setRepo(e.target.value)} className="min-w-0 flex-1 border p-1">{repoNames.map(name => <option key={name}>{name}</option>)}</select><button disabled={busy || !repo} type="button" onClick={async () => { setBusy(true); try { const result = await indexGithubMedia(GITHUB_USER.login, repo); await refresh(); setMessage(`${result.items.length} média(s) indexé(s).${result.truncated ? ' Attention : arbre GitHub tronqué, index incomplet.' : ''}`); } catch(e) { setMessage(e instanceof Error ? e.message : 'Indexation impossible.'); } finally { setBusy(false); } }} className="underline">Indexer</button></div>
    <input aria-label="Rechercher un média" placeholder="Nom, projet ou chemin…" value={query} onChange={e => setQuery(e.target.value)} className="w-full rounded border p-2" />
    <div className="flex gap-2"><select aria-label="Source des médias" value={source} onChange={e => setSource(e.target.value)}><option value="all">Toutes les sources</option><option value="local">Mon ordinateur</option><option value="github">GitHub</option></select><select aria-label="Type de média" value={kind} onChange={e => setKind(e.target.value)}><option value="all">Tous les types</option>{['image','video','audio','pdf'].map(k => <option key={k}>{k}</option>)}</select></div>
    <p role="status" className="text-xs">{busy ? 'Traitement en cours…' : message}</p>
    <div className="grid gap-3">{shown.map(item => <article key={item.id} className="rounded-xl border p-2"><MediaPreview item={item} /><h3 className="mt-2 truncate text-xs font-semibold">{item.name}</h3><p className="my-2 break-all text-[10px] text-gray-500">{item.origin} · {(item.bytes / 1024 / 1024).toFixed(1)} Mo</p><button type="button" disabled={busy} className="text-xs underline" onClick={async () => { setBusy(true); try {
      if (item.blob && item.blob.size > 10 * 1024 * 1024) throw new Error('Fichier conservé en médiathèque, mais insertion limitée à 10 Mo pour les compositions actuelles.');
      const url = item.blob ? await blobDataUrl(item.blob) : item.url;
      onInsert({ id: `asset-${crypto.randomUUID()}`, name: item.name, kind: item.kind, source: item.blob ? 'upload' : 'github', subtitle: item.origin, url, poster: item.kind === 'image' ? url : undefined });
    } catch(e) { setMessage(e instanceof Error ? e.message : 'Insertion impossible.'); } finally { setBusy(false); } }}>Insérer dans la destination choisie</button></article>)}</div>
    {!shown.length && <p className="text-xs text-gray-500">Aucun média. Importez des fichiers ou indexez un dépôt.</p>}
  </section>;
}
