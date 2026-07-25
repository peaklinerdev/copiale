import { TradeChat } from './TradeChat';
import type { Account } from '@/api';

interface ChatSectionProps {
  counterparty: Account | null;
  tradeId?: number;
  currentAccount?: Account | null;
  leg1State?: string;
  cryptoAmount?: string;
  className?: string;
}

function ChatSection({ counterparty, tradeId, currentAccount, leg1State, cryptoAmount, className }: ChatSectionProps) {
  if (!tradeId || !currentAccount) {
    return (
      <div className={`bg-[#111111] border border-[#1f1f1f] rounded-sm flex items-center justify-center ${className || ''}`}>
        <p className="text-xs font-mono text-muted">Loading trade...</p>
      </div>
    );
  }

  return (
    <TradeChat
      tradeId={tradeId}
      currentAccount={currentAccount}
      counterparty={counterparty}
      leg1State={leg1State}
      cryptoAmount={cryptoAmount}
      className={className}
    />
  );
}

export default ChatSection;
