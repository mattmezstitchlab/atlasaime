import { useEffect, useState } from 'react';
import { getStorageError, loadProjects } from '../hooks/useAtlas';
import { downloadBackup } from '../data/projectBackup';

export function StorageNotice() {
  const [error, setError] = useState(getStorageError);
  const [exportError, setExportError] = useState('');
  useEffect(() => {
    const sync = () => setError(getStorageError());
    window.addEventListener('atlas:storage', sync); sync();
    const warn = (e: BeforeUnloadEvent) => { if (getStorageError()) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => { window.removeEventListener('atlas:storage', sync); window.removeEventListener('beforeunload', warn); };
  }, []);
  if (!error) return null;
  return <div role="alert" className="fixed inset-x-3 top-2 z-[150] rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 shadow-lg">
    {error} <button type="button" className="font-semibold underline" onClick={() => { try { downloadBackup(loadProjects()); } catch (e) { setExportError(e instanceof Error ? e.message : 'Export impossible.'); } }}>Télécharger la sauvegarde complète</button>
    {exportError && <p>{exportError}</p>}
  </div>;
}
