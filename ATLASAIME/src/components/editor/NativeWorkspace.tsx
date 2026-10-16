import { useState } from 'react';
import { emptyWorkspace, isWorkspace, parseAmount, workspaceTotals } from '../../data/workspace';
import type { WorkspaceData } from '../../data/workspace';

const euro = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
export function NativeWorkspace({ id, interactive }: { id: string; interactive: boolean }) {
  const key = `atlas:workspace:v1:${id}`;
  const [data, setData] = useState<WorkspaceData>(() => {
    try { const saved: unknown = JSON.parse(localStorage.getItem(key) || 'null'); return isWorkspace(saved) ? saved : emptyWorkspace(); }
    catch { return emptyWorkspace(); }
  });
  const [label, setLabel] = useState('');
  const [cost, setCost] = useState('0');
  const [error, setError] = useState('');
  const totals = workspaceTotals(data);
  const update = (next: WorkspaceData) => {
    setData(next);
    try { localStorage.setItem(key, JSON.stringify(next)); setError(''); }
    catch { setError('Stockage indisponible : exportez vos données avant de fermer.'); }
  };
  const exportData = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'taches-budget.json'; link.click(); URL.revokeObjectURL(url);
  };
  return <section className="absolute inset-0 overflow-auto bg-white p-5 text-gray-950" aria-label="Tâches et budget unifiés">
    <h3 className="text-xl font-semibold">Mon projet · tâches + budget</h3>
    <p className="my-2 text-xs text-gray-500">Deux modules natifs, les mêmes données. Sauvegarde sur cet appareil uniquement ; non incluse dans les liens partagés.</p>
    <fieldset disabled={!interactive} className="space-y-4">
      <legend className="sr-only">Gestion du projet</legend>
      <label className="block text-sm">Budget total (€)<input aria-label="Budget total en euros" type="number" min="0" step="0.01" value={data.limit / 100} onChange={(e) => { const limit = parseAmount(e.target.value); if (limit !== null) update({ ...data, limit }); }} className="ml-2 w-32 rounded border p-2" /></label>
      <div aria-live="polite" className="rounded bg-pink-50 p-3 text-sm">Prévu : {euro(totals.planned)} · Terminé : {euro(totals.completed)} · Disponible : {euro(totals.remaining)}</div>
      <form className="flex flex-wrap gap-2" onSubmit={(e) => {
        e.preventDefault(); const cents = parseAmount(cost);
        if (!label.trim() || cents === null) { setError('Indiquez une tâche et un coût positif ou nul, avec au plus deux décimales.'); return; }
        update({ ...data, items: [...data.items, { id: crypto.randomUUID(), label: label.trim(), cents, done: false }] }); setLabel(''); setCost('0');
      }}>
        <input aria-label="Nouvelle tâche" placeholder="Une tâche à réaliser" maxLength={200} value={label} onChange={(e) => setLabel(e.target.value)} className="min-w-0 flex-1 rounded border p-2 text-sm" />
        <input aria-label="Coût prévu en euros" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} className="w-24 rounded border p-2 text-sm" />
        <button className="rounded bg-black px-3 py-2 text-sm text-white">Ajouter</button>
      </form>
      <ul className="space-y-2">{data.items.map((item) => <li key={item.id} className="flex items-center gap-2 border-b pb-2 text-sm">
        <input aria-label={`Terminer ${item.label}`} type="checkbox" checked={item.done} onChange={() => update({ ...data, items: data.items.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry) })} />
        <span className={`flex-1 break-words ${item.done ? 'line-through' : ''}`}>{item.label}</span><span>{euro(item.cents)}</span>
        <button type="button" aria-label={`Supprimer ${item.label}`} onClick={() => update({ ...data, items: data.items.filter((entry) => entry.id !== item.id) })}>×</button>
      </li>)}</ul>
      {!data.items.length && <p className="text-sm text-gray-500">Ajoutez votre première tâche : son coût alimentera le budget.</p>}
      <button type="button" onClick={exportData} className="rounded border px-3 py-2 text-sm">Exporter les données (.json)</button>
    </fieldset>
    {!interactive && <p className="mt-2 text-xs">Passez en mode Utiliser pour interagir.</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </section>;
}
