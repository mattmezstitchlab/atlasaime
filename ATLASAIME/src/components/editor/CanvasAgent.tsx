import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ChevronDown, Heart, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { AGENTS } from '../../data/agents';
import type { AgentProfile } from '../../data/agents';
import { cn } from '../../utils/cn';

export interface AgentReply {
  text: string;
  applied?: string[];
  assumptions?: string[];
  agents?: AgentProfile[];
  reactions?: { agent: AgentProfile; text: string }[];
  generated?: boolean;
  action?: { label: string; run: () => void };
}

interface Message {
  id: number;
  role: 'user' | 'agent';
  text: string;
  reply?: AgentReply;
}

const SUGGESTIONS = [
  'Rends ce site plus éditorial, garde sa structure.',
  'Passe le support en mobile et améliore la hiérarchie.',
  'Agrandis le bloc sélectionné et ajoute un appel à l’action.',
];

export function CanvasAgent({
  onCommand,
  onUndo,
  canUndo,
}: {
  onCommand: (command: string) => Promise<AgentReply>;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'agent', text: 'Donnez-moi une consigne sur le canevas. Je peux changer la composition, le support, le style, ajouter du contenu ou préparer un nouveau site. Chaque action est appliquée ici et peut être annulée.' },
  ]);
  const nextId = useRef(2);
  const listRef = useRef<HTMLDivElement>(null);

  // On fait défiler uniquement la liste des messages : jamais les conteneurs parents du canevas.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    try {
      list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
    } catch {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, busy]);

  const send = async (value = prompt) => {
    const command = value.trim();
    if (!command || busy) return;
    setPrompt('');
    setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: command }]);
    setBusy(true);
    try {
      // Yield before executing so the user sees the selected specialties working.
      await new Promise((resolve) => window.setTimeout(resolve, 360));
      const reply = await onCommand(command);
      setMessages((m) => [...m, { id: nextId.current++, role: 'agent', text: reply.text, reply }]);
    } catch (error) {
      console.error('[ATLAS] consigne refusée', error);
      const detail = error instanceof Error ? error.message : String(error);
      setMessages((m) => [...m, { id: nextId.current++, role: 'agent', text: `Je n’ai pas pu appliquer cette consigne (${detail}). Le canevas n’a pas été modifié.` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-5 sm:right-5">
      {open && (
        <section className="pointer-events-auto flex h-[min(640px,calc(100dvh-116px))] w-[min(400px,calc(100vw-24px))] flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white/95 shadow-[0_22px_80px_-24px_rgba(20,20,30,.35)] backdrop-blur-2xl" aria-label="Conversation avec l’agent AIME">
          <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fbe6f1] text-[#c60068]"><Heart className="h-4 w-4 fill-current" /></span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-900">AIME <span className="rounded-full bg-gray-100 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-gray-500">atelier local</span></div>
                <div className="truncate text-[10px] text-gray-400">Architecte UX · Directeur artistique · Grand développeur</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" disabled={!canUndo} title="Annuler la dernière modification" onClick={onUndo} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black disabled:opacity-30"><RotateCcw className="h-3.5 w-3.5" /></button>
              <button type="button" aria-label="Fermer la conversation" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black"><X className="h-4 w-4" /></button>
            </div>
          </header>

          <button type="button" onClick={() => setShowTeam((v) => !v)} aria-expanded={showTeam} className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-2 text-left">
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Spécialités publiques · coordination locale</span>
            <ChevronDown className={cn('h-3 w-3 text-gray-400 transition-transform', showTeam && 'rotate-180')} />
          </button>
          {showTeam && (
            <div className="grid grid-cols-2 gap-1.5 border-b border-gray-100 bg-[#fafafa] p-3">
              {AGENTS.filter((a) => ['ux-architect', 'art-director', 'principal-developer', 'composer', 'noema'].includes(a.id)).map((agent) => (
                <span key={agent.id} title={`${agent.repo}/${agent.source}`} className="flex min-w-0 items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 ring-1 ring-gray-100"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e6007e]" /><span className="truncate text-[10px] font-medium text-gray-700">{agent.name}</span></span>
              ))}
            </div>
          )}

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-[#fbfbfc] px-3 py-4">
            {messages.map((message) => (
              <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[91%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed', message.role === 'user' ? 'rounded-br-md bg-[#161616] text-white' : 'rounded-bl-md border border-gray-100 bg-white text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,.035)]')}>
                  {message.role === 'agent' && <div className="mb-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-[#bd0065]"><Heart className="h-2.5 w-2.5 fill-current" /> AIME</div>}
                  <p>{message.text}</p>
                  {message.reply?.applied?.length ? <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">{message.reply.applied.map((operation, i) => <div key={i} className="flex items-start gap-1.5 text-[10px] text-gray-500"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />{operation}</div>)}</div> : null}
                  {message.reply?.assumptions?.length ? <div className="mt-2 rounded-lg bg-[#fff7e6] p-2 text-[10px] text-[#815b11]">À valider : {message.reply.assumptions.join(' · ')}</div> : null}
                  {message.reply?.agents?.length ? <div className="mt-2 flex flex-wrap gap-1">{message.reply.agents.map((a) => <span key={a.id} title={`${a.repo}/${a.source}`} className="rounded-full border border-gray-200 px-1.5 py-0.5 text-[9px] text-gray-500">{a.name}</span>)}</div> : null}
                  {message.reply?.reactions?.length ? <div className="mt-2.5 space-y-1.5 border-t border-gray-100 pt-2.5">{message.reply.reactions.map(({ agent, text }) => <div key={agent.id} className="text-[10px] leading-relaxed text-gray-500"><span className="font-semibold text-gray-700">{agent.name}</span> · {text}<a href={`https://github.com/mattmezstitchlab/${agent.repo}/blob/main/${agent.source}`} target="_blank" rel="noreferrer" className="ml-1 text-[#b1005f] hover:underline">preuve ↗</a></div>)}</div> : null}
                  {message.reply?.action && <button type="button" onClick={() => { message.reply?.action?.run(); setMessages((all) => all.map((m) => m.id === message.id ? { ...m, text: 'Composition appliquée au canevas. Vous pouvez annuler avec ⌘Z.', reply: { ...m.reply!, action: undefined, applied: [...(m.reply?.applied ?? []), 'Nouveau site appliqué · historique réversible'] } } : m)); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#161616] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#e6007e]">{message.reply.action.label}<ArrowUp className="h-3 w-3 rotate-45" /></button>}
                </div>
              </div>
            ))}
            {busy && <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 text-[11px] text-gray-500"><span className="flex gap-0.5"><i className="h-1 w-1 animate-pulse rounded-full bg-[#e6007e]"/><i className="h-1 w-1 animate-pulse rounded-full bg-[#e6007e] [animation-delay:120ms]"/><i className="h-1 w-1 animate-pulse rounded-full bg-[#e6007e] [animation-delay:240ms]"/></span>Les spécialités concernées examinent la consigne…</div>}
          </div>

          {messages.length < 3 && (
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-t border-gray-100 bg-white px-3 py-2">
              {SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => void send(suggestion)} className="shrink-0 rounded-full border border-gray-200 px-2.5 py-1.5 text-[10px] text-gray-600 hover:border-[#e6007e]/50 hover:text-[#b1005f]">{suggestion}</button>)}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="border-t border-gray-100 bg-white p-3">
            <label htmlFor="canvas-agent-prompt" className="sr-only">Donner une consigne à l’agent AIME</label>
            <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-[#f5f5f7] p-1.5 pl-3 focus-within:border-gray-400">
              <textarea id="canvas-agent-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} rows={2} placeholder="Donnez une consigne au canevas…" className="max-h-28 min-h-[40px] flex-1 resize-y bg-transparent py-2 text-[12px] leading-relaxed outline-none placeholder:text-gray-400" />
              <button type="submit" disabled={!prompt.trim() || busy} aria-label="Envoyer la consigne" className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#161616] text-white transition-colors hover:bg-[#e6007e] disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
            </div>
            <p className="mt-1.5 px-1 text-[9px] text-gray-400">Entrée pour envoyer · ⇧ Entrée pour aller à la ligne · ⌘Z pour annuler</p>
          </form>
        </section>
      )}

      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="pointer-events-auto group flex items-center gap-2 rounded-full border border-white/80 bg-white/95 py-2 pl-2 pr-4 text-[12px] font-medium text-gray-800 shadow-[0_12px_42px_-18px_rgba(0,0,0,.38)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-xl">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fbe6f1] text-[#c60068]"><Heart className="h-4 w-4 fill-current" /></span>
        <span className="text-left"><span className="block leading-tight">AIME</span><span className="block text-[9px] font-normal text-gray-400">Architecte · DA · Grand développeur</span></span>
        {open ? <Minus className="ml-1 h-3.5 w-3.5 text-gray-400" /> : <Plus className="ml-1 h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-90" />}
      </button>
    </div>
  );
}