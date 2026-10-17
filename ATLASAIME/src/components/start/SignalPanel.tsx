import { useEffect, useState } from 'react';
import { Check, Copy, Download, Trash2, X, Heart } from 'lucide-react';
import type { Signal } from '../../data/fusions';
import { loadSignals, removeSignal, saveSignal } from '../../data/fusions';
import { cn } from '../../utils/cn';

const KIND_LABEL: Record<Signal['kind'], string> = {
  continuer: 'Continuer avec l’IA',
  reparer: 'Réparer avec l’IA',
  finaliser: 'Finaliser & réévaluer',
  fusionner: 'Fusionner',
};

/** Le signal est le message exact à transmettre à l'assistant. Il est copié, conservé, jamais envoyé seul. */
export function SignalPanel({ signal, onClose }: { signal: Signal; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<Signal[]>(() => loadSignals());
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setSaved(saveSignal(signal));
  }, [signal]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(signal.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    const blob = new Blob([signal.body], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${signal.id}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={signal.title} onMouseDown={(e) => e.stopPropagation()} className="animate-pop flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#0066cc]"><Heart className="h-3 w-3 fill-current" /> Signal à l’assistant · {KIND_LABEL[signal.kind]}</div>
            <h2 className="mt-1 truncate text-lg font-semibold tracking-tight">{signal.title}</h2>
          </div>
          <button type="button" aria-label="Fermer" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black"><X className="h-4 w-4" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="rounded-xl border border-[#0071e3]/20 bg-[#eef4ff] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#0a5bd6]">
            Ce bouton ne peut pas me joindre tout seul : il prépare la consigne exacte, avec les sources. <strong>Copiez-la et collez-la dans notre conversation</strong> — c’est ainsi que je reçois votre signal et que je comprends précisément quoi faire.
          </p>
          <pre className="mt-4 whitespace-pre-wrap break-words rounded-2xl bg-[#f5f5f7] p-4 font-mono text-[11.5px] leading-relaxed text-gray-800">{signal.body}</pre>

          <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-4 text-[11px] font-medium text-gray-500 hover:text-black">
            {showAll ? 'Masquer' : 'Afficher'} la boîte à signaux ({saved.length})
          </button>
          {showAll && (
            <ul className="mt-2 divide-y divide-gray-100 rounded-xl border border-gray-200">
              {saved.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[11px]">
                  <span className="min-w-0 truncate"><span className="font-medium">{s.title}</span> <span className="text-gray-400">· {new Date(s.createdAt).toLocaleString('fr-FR')}</span></span>
                  <span className="flex shrink-0 gap-1">
                    <button type="button" title="Copier" onClick={() => void navigator.clipboard?.writeText(s.body)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-black"><Copy className="h-3.5 w-3.5" /></button>
                    <button type="button" title="Supprimer" onClick={() => setSaved(removeSignal(s.id))} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-[#fafafa] px-5 py-3">
          <span className="text-[10px] text-gray-400">Conservé dans ce navigateur · {saved.length} signal{saved.length > 1 ? 'aux' : ''}</span>
          <div className="flex gap-2">
            <button type="button" onClick={download} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium hover:bg-gray-50"><Download className="h-3.5 w-3.5" /> .txt</button>
            <button type="button" onClick={() => void copy()} className={cn('flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition-colors', copied ? 'bg-emerald-600' : 'bg-[#161616] hover:bg-[#0071e3]')}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copié · collez-le-moi' : 'Copier la consigne'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
