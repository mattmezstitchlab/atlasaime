import type { FragmentKind } from '../types';
export interface LibraryMedia { id: string; name: string; kind: FragmentKind; origin: string; url?: string; blob?: Blob; bytes: number; }
export function mediaKind(path: string): FragmentKind | null {
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(path)) return 'image';
  if (/\.(mp4|webm|mov)$/i.test(path)) return 'video';
  if (/\.(mp3|wav|ogg|m4a|flac)$/i.test(path)) return 'audio';
  return /\.pdf$/i.test(path) ? 'pdf' : null;
}
const db = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('atlas-media-library', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('media', { keyPath: 'id' });
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(new Error('Stockage média indisponible.'));
});
export async function saveLibraryMedia(item: LibraryMedia): Promise<void> {
  const database = await db();
  try { await new Promise<void>((resolve, reject) => {
    const tx = database.transaction('media', 'readwrite'); tx.objectStore('media').put(item);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(new Error('Import non enregistré : espace insuffisant ou stockage refusé.')); tx.onabort = tx.onerror;
  }); } finally { database.close(); }
}
export async function loadLibraryMedia(): Promise<LibraryMedia[]> {
  const database = await db();
  try { return await new Promise((resolve, reject) => {
    const request = database.transaction('media').objectStore('media').getAll();
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error('Lecture de la médiathèque impossible.'));
  }); } finally { database.close(); }
}
export async function importLocalMedia(file: File): Promise<LibraryMedia> {
  const kind = mediaKind(file.name);
  if (!kind) throw new Error(`${file.name} : format non pris en charge.`);
  if (file.size > 100 * 1024 * 1024) throw new Error(`${file.name} : 100 Mo maximum.`);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()))).map(v => v.toString(16).padStart(2,'0')).join('');
  const item = { id: `local:${hash}`, name: file.name, kind, origin: 'Mon ordinateur', blob: file, bytes: file.size };
  await saveLibraryMedia(item); return item;
}
export async function indexGithubMedia(owner: string, repo: string): Promise<{ items: LibraryMedia[]; truncated: boolean }> {
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const meta = await fetch(base); if (!meta.ok) throw new Error(`${repo} : accès public impossible (${meta.status}).`);
  const { default_branch: branch } = await meta.json();
  const response = await fetch(`${base}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  if (!response.ok) throw new Error(`${repo} : indexation impossible (${response.status}).`);
  const data = await response.json();
  const items: LibraryMedia[] = data.tree.filter((entry: { type: string; path: string }) => entry.type === 'blob' && mediaKind(entry.path) && !/(^|\/)(node_modules|\.git|dist)\//.test(entry.path)).map((entry: { path: string; size?: number }) => ({
    id: `github:${owner}/${repo}/${entry.path}`, name: entry.path.split('/').pop()!, kind: mediaKind(entry.path)!, origin: `${owner}/${repo} · ${entry.path}`,
    url: `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${data.sha}/${entry.path.split('/').map(encodeURIComponent).join('/')}`, bytes: entry.size ?? 0,
  }));
  for (const item of items) await saveLibraryMedia(item);
  return { items, truncated: !!data.truncated };
}
export const blobDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Lecture du fichier impossible.')); reader.readAsDataURL(blob);
});
