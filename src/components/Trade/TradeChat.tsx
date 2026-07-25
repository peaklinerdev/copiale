import { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, MessageSquare, Shield, Wallet, CheckCircle2, ArrowLeftRight, Ban, Clock } from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { CounterpartyPanel } from './CounterpartyPanel';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { useTradeChat } from '@/hooks/useTradeChat';
import { useCounterpartyStats } from '@/hooks/useCounterpartyStats';
import api, { type Account } from '@/api';
import { toast } from 'sonner';

interface TradeChatProps {
  tradeId: number | undefined;
  currentAccount: Account | null;
  counterparty: Account | null;
  leg1State?: string;
  cryptoAmount?: string;
  className?: string;
  onViewLogs?: () => void;
}

type DisplayMessage = 
  | { type: 'message'; id: string; message: string | null; attachment_url: string | null; attachment_type: string | null; attachment_name: string | null; created_at: string; seen_at: string | null; sender_account_id: number; sender_username: string; }
  | { type: 'status'; id: string; state: string; timestamp: string; };

const STATE_CONFIG: Record<string, { icon: typeof Shield; label: string; detail: string }> = {
  CREATED:  { icon: Wallet, label: 'Escrow Created', detail: 'Escrow account created on-chain. Waiting for funding.' },
  FUNDED:   { icon: Shield, label: 'Escrow Funded', detail: 'Crypto deposited into escrow. Waiting for fiat payment.' },
  FIAT_PAID:{ icon: ArrowLeftRight, label: 'Fiat Paid', detail: 'Fiat payment confirmed. Waiting for crypto release.' },
  RELEASED: { icon: CheckCircle2, label: 'Escrow Released', detail: 'Crypto released to buyer. Trade complete.' },
  CANCELLED:{ icon: Ban, label: 'Escrow Cancelled', detail: 'Trade cancelled. Crypto returned to seller.' },
  DISPUTED: { icon: Clock, label: 'Dispute Opened', detail: 'A dispute has been opened. Awaiting arbitrator review.' },
};

export function TradeChat({ tradeId, currentAccount, counterparty, leg1State, cryptoAmount, className }: TradeChatProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  const {
    messages, loading: msgLoading, error: msgError,
    sendMessage,
  } = useTradeChat(tradeId, currentAccount?.id);

  const { counterparty: cpStats, loading: cpLoading } = useCounterpartyStats(tradeId);

  // Real messages + status pseudos, sorted newest-first for flex-col-reverse
  const displayMessages: DisplayMessage[] = useMemo(() => {
    const status: DisplayMessage[] = [];
    if (leg1State && STATE_CONFIG[leg1State]) {
      status.push({ type: 'status', id: `status-${leg1State}`, state: leg1State, timestamp: new Date().toISOString() });
    }
    const real: DisplayMessage[] = messages.map(m => ({ type: 'message' as const, ...m }));
    return [...real, ...status].sort(
      (a, b) => new Date(b.created_at || b.timestamp).getTime() - new Date(a.created_at || a.timestamp).getTime()
    );
  }, [messages, leg1State]);

  const handleAttach = async (file: File) => {
    if (!tradeId) return;
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post(`/trades/${tradeId}/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.attachment_url) {
        sendMessage(`[Attachment: ${file.name}]`);
      }
    } catch (e: any) {
      toast.error('Upload failed', { description: e?.response?.data?.error || e.message });
    }
  };

  return (
    <div className={`flex h-full ${className || ''}`}>
      <div className="flex-1 flex flex-col bg-[#111111] border border-[#1f1f1f] rounded-sm min-w-0">
        <ChatHeader
          counterparty={counterparty}
          stats={cpStats?.stats}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen(p => !p)}
        />

        {/* flex-col-reverse: newest at bottom naturally, no scroll hacks */}
        <div
          className="flex-1 overflow-y-auto flex flex-col-reverse py-3 relative"
          style={{
            background: `
              linear-gradient(rgba(17,17,17,0.94), rgba(17,17,17,0.94)),
              url('/chat-bg.svg')
            `,
            backgroundSize: 'auto, 48px 48px',
            backgroundRepeat: 'no-repeat, repeat',
          }}
          ref={scrollRef => { if (scrollRef) scrollRef.top = 0; }}
        >
          {msgLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 text-muted animate-spin" />
            </div>
          ) : msgError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[11px] font-mono text-muted">{msgError}</p>
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
              <div className="w-12 h-12 border-2 border-[#1f1f1f] rounded-sm flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-muted" />
              </div>
              <div className="text-center">
                <p className="text-xs font-mono text-muted max-w-[240px]">
                  Trade chat is encrypted. Messages auto-delete after 2 weeks.
                </p>
                {cryptoAmount && (
                  <p className="text-[10px] font-mono text-muted mt-2 opacity-60">
                    {cryptoAmount} USDT · Escrow protected
                  </p>
                )}
              </div>
            </div>
          ) : (
            displayMessages.map((item) => {
              if (item.type === 'status') {
                const cfg = STATE_CONFIG[item.state];
                if (!cfg) return null;
                const Icon = cfg.icon;
                const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={item.id} className="flex items-center justify-center gap-2 my-3 px-4 shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#f97316] shrink-0" />
                    <span className="text-[11px] text-muted">{cfg.label}</span>
                    <span className="text-[9px] text-muted/50">{time}</span>
                  </div>
                );
              }
              return (
                <div key={item.id} className="shrink-0">
                  <MessageBubble
                    message={item.message}
                    attachmentUrl={item.attachment_url}
                    attachmentType={item.attachment_type}
                    attachmentName={item.attachment_name}
                    timestamp={item.created_at}
                    isOwn={item.sender_account_id === currentAccount?.id}
                    seen={!!item.seen_at}
                    username={item.sender_username}
                  />
                </div>
              );
            })
          )}
        </div>

        <ChatInput
          onSend={sendMessage}
          onAttach={handleAttach}
          disabled={!currentAccount || !tradeId}
        />
      </div>

      <CounterpartyPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        data={cpStats}
        loading={cpLoading}
        cryptoAmount={cryptoAmount}
      />
    </div>
  );
}
