import { Trade } from '@/api';
import TradeTimer from './TradeTimer';

interface RenderTimersProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
}

function getTimerLabel(trade: Trade, userRole: string): string {
  if (trade.leg1_state === 'CREATED') {
    return userRole === 'seller' ? 'Time to fund escrow' : 'Seller funds escrow';
  }
  if (trade.leg1_state === 'FUNDED' || trade.leg1_state === 'AWAITING_FIAT_PAYMENT') {
    return userRole === 'buyer' ? 'Time to pay' : 'Buyer makes payment';
  }
  return 'Time remaining';
}

function getTimerNote(trade: Trade, userRole: string): string | null {
  if (trade.leg1_state === 'CREATED') {
    return userRole === 'seller'
      ? 'Fund the escrow to proceed with this trade.'
      : 'Waiting for the seller to fund the on-chain escrow.';
  }
  if (trade.leg1_state === 'FUNDED' || trade.leg1_state === 'AWAITING_FIAT_PAYMENT') {
    return userRole === 'buyer'
      ? 'Complete your fiat payment before the deadline.'
      : 'Waiting for the buyer to send fiat payment. Do not release crypto until you have confirmed receipt.';
  }
  return null;
}

function getDeadline(trade: Trade): string | null {
  if (trade.leg1_state === 'CREATED') return trade.leg1_escrow_deposit_deadline;
  if (trade.leg1_state === 'FUNDED' || trade.leg1_state === 'AWAITING_FIAT_PAYMENT') return trade.leg1_fiat_payment_deadline;
  return null;
}

export const renderTimers = ({ trade, userRole }: RenderTimersProps) => {
  const deadline = getDeadline(trade);
  if (!deadline) return null;

  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-sm p-4">
      <TradeTimer
        deadline={deadline}
        label={getTimerLabel(trade, userRole)}
      />
      {getTimerNote(trade, userRole) && (
        <p className="mt-2 text-[11px] font-mono text-[#6b7280] leading-relaxed">
          {getTimerNote(trade, userRole)}
        </p>
      )}
    </div>
  );
};
