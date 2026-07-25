import { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, MessageSquare, Shield, Wallet, CheckCircle2, ArrowLeftRight, Ban, Clock } from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { CounterpartyPanel } from './CounterpartyPanel';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { useTradeChat } from '@/hooks/useTradeChat';
import { useCounterpartyStats } from '@/hooks/useCounterpartyStats';
import type { Account } from '@/api';

interface TradeChatProps {
  tradeId: number | undefined;
  currentAccount: Account | null;
  counterparty: Account | null;
  leg1State?: string;
  cryptoAmount?: string;
  className?: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages, loading: msgLoading, error: msgError,
    sendMessage,
  } = useTradeChat(tradeId, currentAccount?.id);

  const { counterparty: cpStats, loading: cpLoading } = useCounterpartyStats(tradeId);

  // Merge real messages with status pseudo-messages
  const displayMessages: DisplayMessage[] = useMemo(() => {
    const real: DisplayMessage[] = messages.map(m => ({ type: 'message' as const, ...m }));
    const status: DisplayMessage[] = [];
    
    // Generate status message from current leg1_state if it exists and we have messages
    if (leg1State && STATE_CONFIG[leg1State]) {
      // Only add if not already in the messages as a status
      const stateKey = `status-${leg1State}`;
      status.push({
        type: 'status',
        id: stateKey,
        state: leg1State,
        timestamp: new Date().toISOString(),
      });
    }

    // De-duplicate: only show latest status
    const combined = [...real];
    if (status.length > 0) {
      combined.push(status[0]);
    }
    
    // Sort by timestamp (oldest first, so newest is at bottom)
    return combined.sort((a, b) => new Date(a.created_at || a.timestamp).getTime() - new Date(b.created_at || b.timestamp).getTime());
  }, [messages, leg1State]);

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [displayMessages.length]);

  return (
    <div className={`flex h-full ${className || ''}`}>
      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-[#111111] border border-[#1f1f1f] rounded-sm min-w-0">
        <ChatHeader
          counterparty={counterparty}
          stats={cpStats?.stats}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen(p => !p)}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-3">
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
                  <div key={item.id} className="flex items-center justify-center my-4 px-4">
                    <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2b3139] rounded-sm px-4 py-2 max-w-[360px] w-full">
                      <div className="w-8 h-8 rounded-sm bg-[#f97316]/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[#f97316]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono font-bold text-white">{cfg.label}</p>
                        <p className="text-[10px] font-mono text-muted">{cfg.detail}</p>
                      </div>
                      <span className="text-[9px] font-mono text-muted shrink-0">{time}</span>
                    </div>
                  </div>
                );
              }
              return (
                <MessageBubble
                  key={item.id}
                  message={item.message}
                  attachmentUrl={item.attachment_url}
                  attachmentType={item.attachment_type}
                  attachmentName={item.attachment_name}
                  timestamp={item.created_at}
                  isOwn={item.sender_account_id === currentAccount?.id}
                  seen={!!item.seen_at}
                  username={item.sender_username}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSend={sendMessage}
          disabled={!currentAccount || !tradeId}
        />
      </div>

      {/* Counterparty panel */}
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
