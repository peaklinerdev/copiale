import { Trade } from '@/api';
import TradeStatusDisplay from '@/components/Trade/TradeStatusDisplay';

interface TradeStatusCardProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
  actions: {
    createEscrow: () => Promise<void>;
    markFiatPaid: () => Promise<void>;
    releaseCrypto: () => Promise<void>;
    disputeTrade: () => Promise<void>;
    cancelTrade: () => Promise<void>;
  };
  actionLoading: boolean;
  escrowDetails?: { escrow_id: bigint; amount: bigint; state: bigint };
  escrowLoading?: boolean;
  escrowError?: Error | null;
  balance?: string;
  refreshEscrow?: () => Promise<void>;
}

/**
 * Card component that displays the trade status and actions
 */
export function TradeStatusCard({
  trade,
  userRole,
  actions,
  actionLoading,
  escrowDetails,
  escrowLoading,
  escrowError,
  balance,
  refreshEscrow,
}: TradeStatusCardProps) {
  // Log trade state changes only

  return (
    <div className="bg-[#111318]/60 border border-[#2b3139] rounded-sm p-3">
      <TradeStatusDisplay
        trade={trade}
        userRole={userRole}
        onCreateEscrow={actions.createEscrow}
        onMarkFiatPaid={actions.markFiatPaid}
        onReleaseCrypto={actions.releaseCrypto}
        onDisputeTrade={actions.disputeTrade}
        onCancelTrade={actions.cancelTrade}
        loading={actionLoading}
        escrowDetails={escrowDetails}
        escrowLoading={escrowLoading}
        escrowError={escrowError}
        balance={balance}
        refreshEscrow={refreshEscrow}
      />
    </div>
  );
}
