import { useState } from 'react';
import { estimateSale } from '../../data/projectWork';
import type { SaleScenario } from '../../data/projectWork';
const blank = (): SaleScenario => ({ revenue: 0, multipleLow: 0, multipleHigh: 0, assumptions: '', evidence: '', rights: false });
export function SaleEstimate({ subject }: { subject: string }) {
  const key = `atlas:sale:v1:${subject}`;
  const [scenario, setScenario] = useState<SaleScenario>(() => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || 'null');
      if (data && typeof data === 'object' && typeof data.assumptions === 'string' && typeof data.evidence === 'string' && typeof data.rights === 'boolean' && [data.revenue, data.multipleLow, data.multipleHigh].every((n) => typeof n === 'number' && Number.isFinite(n))) return data;
    } catch { /* utiliser un formulaire vide */ }
    return blank();
  });
  const [error, setError] = useState('');
  const set = (change: Partial<SaleScenario>) => {
    const next = { ...scenario, ...change }; setScenario(next);
    try { localStorage.setItem(key, JSON.stringify(next)); setError(''); } catch { setError('Scénario non sauvegardé : stockage indisponible.'); }
  };
  const estimate = estimateSale(scenario);
  const euro = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  return <section className="mt-5 border-t pt-4 text-xs" aria-label="Scénario de vente">
    <h4 className="font-semibold">Scénario de vente · déclaratif</h4>
    <p className="my-2 text-gray-500">Pas de prix déduit de la taille du code. Saisissez vos revenus annuels et vos propres multiples, avec leurs sources. Aucun multiple de marché n’est présumé.</p>
    {([['revenue', 'Revenus annuels transférables (€)'], ['multipleLow', 'Multiple bas choisi'], ['multipleHigh', 'Multiple haut choisi']] as const).map(([field, label]) => <label key={field} className="mt-2 block">{label}<input type="number" min="0" step="0.01" value={scenario[field]} onChange={(e) => set({ [field]: e.target.valueAsNumber || 0 })} className="mt-1 w-full rounded border p-2" /></label>)}
    <label className="mt-2 block">Hypothèses, comparables et risques<textarea value={scenario.assumptions} onChange={(e) => set({ assumptions: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
    <label className="mt-2 block">Source des revenus / comparables (HTTPS)<input type="url" value={scenario.evidence} onChange={(e) => set({ evidence: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
    <label className="mt-3 flex gap-2"><input type="checkbox" checked={scenario.rights} onChange={(e) => set({ rights: e.target.checked })} />Je déclare avoir vérifié les droits de cession, licences et données transférables.</label>
    <p aria-live="polite" className="mt-3 font-semibold">{estimate ? `${euro(estimate.low)} – ${euro(estimate.high)}` : 'Vente : non estimable avec les informations actuelles.'}</p>
    <p className="mt-2 text-gray-500">Confiance non évaluée. Calcul = revenus annuels × multiples saisis. Sources non auditées, ni expertise indépendante ni offre d’achat. Sans revenus documentés, une expertise spécifique reste nécessaire.</p>
    {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
  </section>;
}
