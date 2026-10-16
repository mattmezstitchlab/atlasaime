import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Appelé pour revenir à un état sûr (par ex. l'accueil). */
  onReset?: () => void;
  label?: string;
}

interface State {
  error: Error | null;
  info: string;
}

/** Empêche l'écran blanc : affiche l'erreur réelle et propose de revenir à l'accueil. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info: info.componentStack ?? '' });
    try {
      const journal = JSON.parse(localStorage.getItem('atlas:erreurs') ?? '[]') as unknown[];
      journal.unshift({ at: new Date().toISOString(), message: error.message, stack: error.stack?.slice(0, 1200), where: this.props.label ?? 'app' });
      localStorage.setItem('atlas:erreurs', JSON.stringify(journal.slice(0, 10)));
    } catch {
      /* stockage indisponible */
    }
    console.error('[ATLAS] Erreur interceptée', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null, info: '' });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;
    const report = `ATLAS — rapport d'erreur\nZone : ${this.props.label ?? 'application'}\nMessage : ${this.state.error.message}\n\n${this.state.error.stack ?? ''}\n\nComposants :${this.state.info.slice(0, 900)}`;
    return (
      <div role="alert" className="flex min-h-screen items-center justify-center bg-[#f5f5f7] p-6 text-gray-900">
        <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-7 shadow-[0_24px_80px_-30px_rgba(0,0,0,.25)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#b1005f]">Interruption interceptée</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Quelque chose s’est arrêté, pas vos projets.</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
            Vos compositions sont sauvegardées localement. L’erreur ci-dessous est conservée dans le navigateur pour pouvoir être corrigée. Vous pouvez reprendre sans recharger la page.
          </p>
          <pre className="mt-4 max-h-44 overflow-auto rounded-xl bg-[#1b1b1f] p-3 font-mono text-[11px] leading-relaxed text-gray-100">{this.state.error.message}{'\n'}{this.state.error.stack?.split('\n').slice(1, 5).join('\n')}</pre>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={this.reset} className="rounded-xl bg-[#161616] px-4 py-2 text-[13px] font-semibold text-white hover:bg-gray-800">Revenir à l’accueil</button>
            <button type="button" onClick={() => window.location.reload()} className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-medium hover:bg-gray-50">Recharger</button>
            <button type="button" onClick={() => void navigator.clipboard?.writeText(report)} className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-medium hover:bg-gray-50">Copier le rapport pour l’assistant</button>
          </div>
        </div>
      </div>
    );
  }
}
