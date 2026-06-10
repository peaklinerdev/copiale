import { useState } from 'react';
import { Trade } from '@/api';
import { TradeAction } from './TradeActionButton';
import { EscrowDetailsPanel } from './EscrowDetailsPanel';
import { TradeLegState } from '@/utils/tradeStates';
import TransactionHistory from './TransactionHistory';
import { getAvailableActions } from '@/components/Trade/TradeStatusDisplay/getAvailableActions';
import { renderTimers } from '@/components/Trade/TradeStatusDisplay/renderTimers';
import { renderActionButtons } from '@/components/Trade/TradeStatusDisplay/renderActionButtons';
import { ExceptionalCases } from '@/components/Trade/TradeStatusDisplay/renderExceptionalCases';

interface TradeStatusDisplayProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
  onCreateEscrow?: () => void;
  onFundEscrow?: () => void;
  onMarkFiatPaid?: () => void;
  onReleaseCrypto?: () => void;
  onDisputeTrade?: () => void;
  onCancelTrade?: () => void;
  loading?: boolean;
  escrowDetails?: { escrow_id: bigint; amount: bigint; state: bigint };
  escrowLoading?: boolean;
  escrowError?: Error | null;
  balance?: string;
  refreshEscrow?: () => Promise<void>;
}

const TradeStatusDisplay = ({
  trade,
  userRole,
  onCreateEscrow,
  onMarkFiatPaid,
  onReleaseCrypto,
  onDisputeTrade,
  onCancelTrade,
  loading = false,
  escrowDetails,
  balance,
  refreshEscrow,
}: TradeStatusDisplayProps) => {
  const [localLoading, setLocalLoading] = useState<TradeAction | null>(null);
  const [lastLogTime, setLastLogTime] = useState(0);

  const handleAction = async (action: TradeAction, handler?: () => Promise<void> | void) => {
    if (!handler || loading) return;
    setLocalLoading(action);
    try {
      await handler();
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
    } finally {
      setLocalLoading(null);
    }
  };

  const availableActions = getAvailableActions({ trade, userRole, lastLogTime, setLastLogTime });

  return (
    <div className="space-y-3">
      {renderTimers({ trade, userRole })}

      {renderActionButtons({ availableActions, loading, localLoading, handleAction, onCreateEscrow, onMarkFiatPaid, onReleaseCrypto, onDisputeTrade, onCancelTrade })}

      <ExceptionalCases trade={trade} userRole={userRole} escrowDetails={escrowDetails} balance={balance} refreshEscrow={refreshEscrow} />

      {trade.leg1_escrow_address && (
        <EscrowDetailsPanel escrowAddress={trade.leg1_escrow_address} trade={trade} userRole={userRole} />
      )}

      <TransactionHistory tradeId={trade.id} />
    </div>
  );
};

export default TradeStatusDisplay;
