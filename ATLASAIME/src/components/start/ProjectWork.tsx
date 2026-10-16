import { useState } from 'react';
import { canSetStatus, evidenceUrl, loadWork, WORK_KEY } from '../../data/projectWork';
import type { WorkRecord, WorkStatus } from '../../data/projectWork';
const labels: Record<WorkStatus, string> = { prepared: 'Consigne préparée', 'in-progress': 'Travail en cours (déclaré)', review: 'À vérifier', validated: 'Validé par le propriétaire' };
export function ProjectWork({ subject, revision }: { subject: string; revision: number }) {
  return <WorkList key={`${subject}:${revision}`} subject={subject} />;
}
function WorkList({ subject }: { subject: string }) {
  const [records, setRecords] = useState(loadWork);
  const [error, setError] = useState('');
  const update = (record: WorkRecord, changes: Partial<WorkRecord>) => {
    const nextRecord = { ...record, ...changes, updatedAt: Date.now() };
    if (!canSetStatus(nextRecord.status, nextRecord.evidence)) { setError('Ajoutez un lien HTTPS vers une PR, un test ou un aperçu avant de déclarer la validation.'); return; }
    const next = records.map((r) => r.id === record.id ? nextRecord : r);
    try { localStorage.setItem(WORK_KEY, JSON.stringify(next)); setRecords(next); setError(''); }
    catch { setError('Stockage indisponible : les changements ne sont pas enregistrés.'); }
  };
  const entries = records.filter((r) => r.subject === subject);
  return <section className="mt-5 rounded-xl border border-gray-200 p-4" aria-label="Suivi des demandes">
    <h4 className="text-sm font-semibold">Suivi et preuves</h4>
    <p className="mt-1 text-xs text-gray-500">Suivi local déclaré par vous. Aucun agent serveur connecté : créer une demande ne lance pas de correction. Une URL de preuve n’est pas vérifiée automatiquement.</p>
    {!entries.length && <p className="mt-3 text-xs">Utilisez Continuer, Réparer ou Finaliser pour préparer une demande et la suivre ici.</p>}
    {entries.map((r) => <div key={r.id} className="mt-3 space-y-2 border-t pt-3 text-xs">
      <p className="font-semibold">{r.title}</p><p>{new Date(r.updatedAt).toLocaleString('fr-FR')}</p>
      <label className="block">Preuve (PR, test ou aperçu HTTPS)<input type="url" value={r.evidence} onChange={(e) => update(r, { evidence: e.target.value, ...(r.status === 'validated' ? { status: 'review' as const } : {}) })} className="mt-1 w-full rounded border p-2" /></label>
      <label className="block">État déclaré <select value={r.status} onChange={(e) => update(r, { status: e.target.value as WorkStatus })} className="ml-2 rounded border p-2">{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {evidenceUrl(r.evidence) && <a href={evidenceUrl(r.evidence)!} target="_blank" rel="noreferrer" className="underline">Consulter la preuve</a>}
    </div>)}
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </section>;
}
