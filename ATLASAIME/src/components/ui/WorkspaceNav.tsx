import { BookOpen, Grid2X2, Home, Palette } from 'lucide-react';
import { cn } from '../../utils/cn';

export type WorkspacePage = 'home' | 'viewer' | 'systems' | 'desk';

export function WorkspaceNav({
  active,
  onNavigate,
  compact = false,
}: {
  active: WorkspacePage;
  onNavigate: (page: WorkspacePage) => void;
  compact?: boolean;
}) {
  const links = [
    { id: 'home' as const, label: 'Accueil', icon: Home },
    { id: 'viewer' as const, label: 'Projets', icon: Grid2X2 },
    { id: 'systems' as const, label: 'Design', icon: Palette },
    { id: 'desk' as const, label: 'Bureau', icon: BookOpen },
  ];
  return (
    <nav aria-label="Espace de travail" className="no-scrollbar flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-full border border-gray-200/80 bg-[#f5f5f7]/80 p-1">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <button
            key={link.id}
            type="button"
            onClick={() => onNavigate(link.id)}
            aria-current={active === link.id ? 'page' : undefined}
            aria-label={link.label}
            title={link.label}
            className={cn(
              'flex shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-all sm:px-3',
              active === link.id ? 'bg-white text-gray-950 shadow-sm ring-1 ring-black/[0.035]' : 'text-gray-500 hover:text-gray-900',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {!compact && <span className="hidden sm:inline">{link.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}