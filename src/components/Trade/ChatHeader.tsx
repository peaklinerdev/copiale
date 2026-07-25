import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight, X } from 'lucide-react';
import { User } from 'lucide-react';
import type { Account } from '@/api';

interface ChatHeaderProps {
  counterparty: Account | null;
  stats?: { total: number; completed: number; completionRate: number } | null;
  panelOpen: boolean;
  onTogglePanel: () => void;
}

export function ChatHeader({ counterparty, stats, panelOpen, onTogglePanel }: ChatHeaderProps) {
  if (!counterparty) {
    return (
      <div className="border-b border-[#1f1f1f] px-4 py-2 flex items-center gap-3">
        <span className="text-[11px] font-mono text-muted">No counterparty</span>
      </div>
    );
  }

  return (
    <div className="border-b border-[#1f1f1f] px-4 py-2 flex items-center gap-3">
      <Avatar className="w-8 h-8 rounded-sm shrink-0">
        <AvatarImage src={counterparty.profile_photo_url ?? undefined} alt={counterparty.username} />
        <AvatarFallback className="bg-[#f97316]/20 text-[#f97316] rounded-sm text-xs">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-bold text-white truncate">
          @{counterparty.username || 'Anonymous'}
        </p>
        <p className="text-[10px] font-mono text-muted">
          {stats ? (
            <>
              {stats.total} trades · {stats.completionRate}% complete
            </>
          ) : (
            <span className="opacity-50">Loading stats...</span>
          )}
        </p>
      </div>

      <button
        onClick={onTogglePanel}
        className="text-muted hover:text-white transition-colors p-1 rounded-sm hover:bg-[#1f1f1f]"
      >
        {panelOpen ? <X className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
}
