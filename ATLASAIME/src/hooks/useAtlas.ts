import { isProject } from '../data/projectBackup';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { REPO_SNAPSHOT, SNAPSHOT_DATE, GITHUB_USER } from '../data/repos';
import type { RepoSnapshot } from '../data/repos';
import type { Project } from '../types';
import { seedMemoireActive } from '../data/templates';

/* ---------- Mesures & environnement ---------- */

export function useElementSize<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((s) => (Math.abs(s.width - width) < 0.5 && Math.abs(s.height - height) < 0.5 ? s : { width, height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatches(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return matches;
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/* ---------- GitHub : instantané + synchronisation live ---------- */

interface ApiRepo {
  name: string;
  description: string | null;
  language: string | null;
  homepage: string | null;
  pushed_at: string;
  created_at: string;
  size: number;
  stargazers_count: number;
  private: boolean;
}

export type SyncStatus = 'snapshot' | 'loading' | 'live' | 'error';
const CACHE_KEY = 'atlas:github:v1';

function readCache(): { at: string; repos: RepoSnapshot[] } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: string; repos: RepoSnapshot[] };
    if (Date.now() - new Date(parsed.at).getTime() > 15 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useGithubRepos() {
  const [repos, setRepos] = useState<RepoSnapshot[]>(() => readCache()?.repos ?? REPO_SNAPSHOT);
  const [status, setStatus] = useState<SyncStatus>(() => (readCache() ? 'live' : 'snapshot'));
  const [syncedAt, setSyncedAt] = useState<string>(() => readCache()?.at ?? SNAPSHOT_DATE);

  const sync = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch(`https://api.github.com/users/${GITHUB_USER.login}/repos?per_page=100&sort=pushed`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as ApiRepo[];
      const known = new Map(REPO_SNAPSHOT.map((r) => [r.name, r]));
      const merged: RepoSnapshot[] = data
        .filter((d) => !d.private)
        .map((d) => {
          const s = known.get(d.name);
          const homepage = d.homepage || null;
          const same = s && s.homepage === homepage ? s : null;
          return {
            name: d.name,
            description: d.description ?? s?.description ?? '',
            language: d.language,
            homepage,
            pushedAt: d.pushed_at,
            createdAt: d.created_at,
            size: d.size,
            stars: d.stargazers_count,
            embed: same ? same.embed : homepage ? 'live' : 'none',
            siteTitle: same ? same.siteTitle : '',
            siteDescription: same ? same.siteDescription : '',
            ogImage: same ? same.ogImage : '',
          };
        });
      const at = new Date().toISOString();
      setRepos(merged);
      setSyncedAt(at);
      setStatus('live');
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at, repos: merged }));
      } catch {
        /* quota */
      }
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!readCache()) void sync();
  }, [sync]);

  return { repos, status, syncedAt, sync };
}

export type GithubState = ReturnType<typeof useGithubRepos>;

/* ---------- Persistance des projets ---------- */

const STORE_KEY = 'atlas:projects:v2';
let pendingProjects: Project[] | null = null;
let storageError = '';
let unreadableStore = false;
export const getStorageError = () => storageError;
function reportStorage(error: string) {
  storageError = error;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('atlas:storage'));
}


function readStore(): Project[] | null {
  if (pendingProjects) return pendingProjects;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list) || !list.every(isProject)) throw new Error('Invalid storage');
    return list;
  } catch {
    unreadableStore = true;
    reportStorage('Stockage existant illisible ou inaccessible : aucune donnée enregistrée ne sera remplacée. Conservez cet onglet et sauvegardez votre travail.');
    return null;
  }
}

function writeStore(list: Project[]) {
  try {
    if (unreadableStore) throw new Error('Existing storage unreadable');
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
    pendingProjects = null;
    reportStorage('');
  } catch {
    pendingProjects = list;
    reportStorage('Sauvegarde locale impossible. Vos modifications restent dans cet onglet uniquement. Téléchargez une sauvegarde avant de le fermer.');
  }
}

export function restoreProjects(projects: Project[]): Project[] {
  if (!projects.every(isProject)) throw new Error('Composition invalide.');
  // Imported entries use fresh IDs: existing work is never replaced.
  const now = Date.now();
  const imported = projects.map(p => ({ ...p, id: `restore-${crypto.randomUUID()}`, updatedAt: now }));
  const next = [...imported, ...(readStore() ?? [])];
  writeStore(next);
  return next;
}

export function loadProjects(): Project[] {
  const list = readStore();
  if (list) return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  const seed = [seedMemoireActive()];
  writeStore(seed);
  return seed;
}

export function saveProject(p: Project): Project[] {
  const list = (readStore() ?? []).filter((x) => x.id !== p.id);
  const next = [p, ...list].sort((a, b) => b.updatedAt - a.updatedAt);
  writeStore(next);
  return next;
}

export function removeProject(id: string): Project[] {
  const next = (readStore() ?? []).filter((x) => x.id !== id);
  writeStore(next);
  return next;
}

/* ---------- Historique (annuler / rétablir) ---------- */

export function useProjectHistory(initial: Project) {
  const [state, setState] = useState<{ past: Project[]; present: Project; future: Project[] }>({
    past: [],
    present: initial,
    future: [],
  });
  const last = useRef<{ key: string; t: number } | null>(null);

  const update = useCallback((fn: (p: Project) => Project, key?: string) => {
    const now = Date.now();
    const coalesce = !!key && !!last.current && last.current.key === key && now - last.current.t < 900;
    last.current = key ? { key, t: now } : null;
    setState((s) => {
      // Une mise à jour fautive ne doit jamais faire tomber le rendu : on garde l'état précédent.
      let computed: Project;
      try {
        computed = fn(s.present);
      } catch (error) {
        console.error('[ATLAS] mise à jour refusée', error);
        return s;
      }
      if (!computed || !Array.isArray(computed.cells)) return s;
      const next = { ...computed, updatedAt: now };
      return coalesce ? { ...s, present: next } : { past: [...s.past.slice(-79), s.present], present: next, future: [] };
    });
  }, []);

  const undo = useCallback(
    () =>
      setState((s) =>
        s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s,
      ),
    [],
  );
  const redo = useCallback(
    () => setState((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s)),
    [],
  );

  return {
    project: state.present,
    update,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    historyCount: state.past.length + 1,
  };
}

/* ---------- Partage en lecture seule (#lecture=…) ---------- */

export function encodeProject(p: Project): string {
  const lite = {
    ...p,
    customFragments: p.customFragments.map((f) => (f.source === 'upload' ? { ...f, url: undefined, poster: undefined } : f)),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(lite));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeProject(s: string): Project | null {
  if (s.length > 2_000_000) return null;
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const p = JSON.parse(new TextDecoder().decode(bytes)) as Project;
    return isProject(p) ? p : null;
  } catch {
    return null;
  }
}

export const readOnlyUrl = (p: Project) => `${window.location.origin}${window.location.pathname}#lecture=${encodeProject(p)}`;
