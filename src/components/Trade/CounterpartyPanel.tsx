import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  X, Check, Clock, AlertTriangle, User, Shield, Wallet,
  ArrowRightLeft, TrendingUp, Calendar, Globe, MessageCircle,
  Zap,
} from 'lucide-react';

interface CounterpartyPanelProps {
  open: boolean;
  onClose: () => void;
  data: {
    id: number;
    username: string;
    profile_photo_url: string | null;
    telegram_username: string | null;
    created_at: string;
    stats: {
      total: number;
      completed: number;
      disputes: number;
      cancelled: number;
      open: number;
      completionRate: number;
    };
  } | null;
  loading: boolean;
  cryptoAmount?: string;
}

function StatRow({ icon: Icon, label, value, accent }: {
  icon: typeof Shield; label: string; value: string | number; accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#1f1f1f]/50 last:border-0 group">
      <div className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${accent || 'bg-[#1f1f1f]'}`}>
        <Icon className={`w-3.5 h-3.5 ${accent ? 'text-white' : 'text-muted'}`} />
      </div>
      <span className="text-[11px] font-mono text-muted flex-1">{label}</span>
      <span className={`text-[11px] font-mono font-bold ${accent ? 'text-white' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}

export function CounterpartyPanel({ open, onClose, data, loading, cryptoAmount }: CounterpartyPanelProps) {
  if (!open) return null;

  return (
    <div className="w-64 shrink-0 bg-[#0d0d0d] border-l border-[#1f1f1f] overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#1f1f1f] flex items-center justify-between">
        <span className="text-[9px] font-mono font-bold text-muted tracking-[0.2em] uppercase">
          Trade Info
        </span>
        <button onClick={onClose} className="text-muted hover:text-white p-1 rounded-sm hover:bg-[#1f1f1f]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-14 h-14 rounded-sm bg-[#1f1f1f] animate-pulse" />
            <div className="h-3 w-20 bg-[#1f1f1f] rounded animate-pulse" />
            <div className="h-2 w-14 bg-[#1f1f1f] rounded animate-pulse" />
          </div>
        ) : data ? (
          <>
            {/* Profile */}
            <div className="flex flex-col items-center gap-2 pb-3 border-b border-[#1f1f1f]">
              <Avatar className="w-14 h-14 rounded-sm">
                <AvatarImage src={data.profile_photo_url ?? undefined} alt={data.username} />
                <AvatarFallback className="bg-[#f97316]/10 text-[#f97316] rounded-sm">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-mono font-bold text-white">@{data.username}</p>
              <p className="text-[10px] font-mono text-muted">Account #{data.id}</p>
              {data.telegram_username && (
                <span className="text-[9px] font-mono text-green-500/70 bg-green-500/5 px-2 py-0.5 rounded-sm">
                  @{data.telegram_username}
                </span>
              )}
            </div>

            {/* Trade amount */}
            {cryptoAmount && (
              <div className="bg-[#f97316]/5 border border-[#f97316]/10 rounded-sm p-3">
                <p className="text-[9px] font-mono text-muted uppercase tracking-wider mb-1">Escrow Amount</p>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#f97316]" />
                  <span className="text-sm font-mono font-bold text-white">{parseFloat(cryptoAmount).toFixed(2)} USDT</span>
                </div>
              </div>
            )}

            {/* Stats */}
            <div>
              <p className="text-[9px] font-mono font-bold text-muted tracking-[0.2em] uppercase mb-2">
                Trading Stats
              </p>
              <StatRow icon={TrendingUp} label="Total trades" value={data.stats.total} />
              <StatRow icon={Check} label="Completed" value={data.stats.completed}
                accent={data.stats.completed > 0 ? 'bg-green-500/10 text-green-500' : undefined} />
              <StatRow icon={Zap} label="Completion rate"
                value={`${data.stats.completionRate}%`}
                accent={data.stats.completionRate >= 80 ? 'bg-green-500/10 text-green-500' : 'bg-[#f97316]/10 text-[#f97316]'} />
              <StatRow icon={AlertTriangle} label="Disputes"
                value={data.stats.disputes}
                accent={data.stats.disputes > 0 ? 'bg-red-500/10 text-red-400' : undefined} />
            </div>

            {/* Activity */}
            <div>
              <p className="text-[9px] font-mono font-bold text-muted tracking-[0.2em] uppercase mb-2">
                Activity
              </p>
              <StatRow icon={Calendar} label="Joined" value={timeAgo(data.created_at)} />
              <StatRow icon={Shield} label="Open trades" value={data.stats.open} />
            </div>

            {/* Contact */}
            {data.telegram_username && (
              <a
                href={`https://t.me/${data.telegram_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full text-[11px] font-mono font-bold bg-[#f97316] text-white py-2.5 rounded-sm hover:opacity-90 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Telegram
              </a>
            )}
          </>
        ) : (
          <p className="text-[11px] font-mono text-muted text-center py-6">No data available</p>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#1f1f1f]">
        <p className="text-[9px] font-mono text-muted text-center leading-relaxed">
          Messages auto-delete after 2 weeks.<br />
          Keep records for disputes.
        </p>
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  return `${Math.floor(months / 12)} years ago`;
}
