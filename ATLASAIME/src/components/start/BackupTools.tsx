import { useState } from 'react';
import { downloadBackup, MAX_BACKUP_BYTES, parseBackup } from '../../data/projectBackup';
import { getStorageError, loadProjects, restoreProjects } from '../../hooks/useAtlas';
import type { Project } from '../../types';
export function BackupTools({ onRestored }: { onRestored: (projects: Project[]) => void }) {
  const [message, setMessage] = useState('');
  return <section className="rounded-2xl border border-gray-200 bg-white p-5">
    <h2 className="font-semibold">Sauvegarder et restaurer</h2>
    <p className="my-3 text-xs text-gray-500">Fichier privé non chiffré, compositions et médias inclus. La restauration ajoute des copies sans remplacer vos projets. Anciennes URL de fichiers temporaires : réimport nécessaire.</p>
    <button type="button" className="mr-4 text-sm underline" onClick={() => { try { downloadBackup(loadProjects()); setMessage('Sauvegarde préparée pour téléchargement.'); } catch (e) { setMessage(e instanceof Error ? e.message : 'Export impossible.'); } }}>Télécharger toutes les compositions</button>
    <label className="text-sm">Restaurer une sauvegarde <input type="file" accept="application/json,.json" onChange={async e => {
      const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
      try {
        if (file.size > MAX_BACKUP_BYTES) throw new Error('40 Mo maximum.');
        const projects = parseBackup(await file.text());
        const next = restoreProjects(projects); onRestored(next);
        setMessage(getStorageError() || `${projects.length} composition(s) restaurée(s) comme copies.`);
      } catch (err) { setMessage(err instanceof Error ? err.message : 'Restauration impossible.'); }
    }} /></label>
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </section>;
}
