import React, { useState, useMemo } from 'react';
import { Trade } from '@/api';
import StatusBadge from '@/components/Shared/StatusBadge';
// import TradeProgressBar from './TradeProgressBar'; // Removed ProgressBar
import { TradeAction } from './TradeActionButton';
import { EscrowDetailsPanel } from './EscrowDetailsPanel';
// import { EscrowState } from '@/hooks/useEscrowDetails'; // Removed unused import
import { TradeLegState, tradeStateMessages } from '@/utils/tradeStates';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'; // Added
import { Button } from '@/components/ui/button'; // Added
import {
  ChevronsUpDown, // Added
  Lock, // Added
  Send, // Added
  CheckCircle, // Added
  ShieldAlert, // Added
  XCircle, // Added
  Hourglass, // Added
  Check, // Added
} from 'lucide-react'; // Added
import { cn } from '@/lib/utils'; // Added
import TransactionHistory from './TransactionHistory'; // Added

// Import utility functions and components
import { getAvailableActions } from '@/components/Trade/TradeStatusDisplay/getAvailableActions';
import { renderTimers } from '@/components/Trade/TradeStatusDisplay/renderTimers';
import { renderActionButtons } from '@/components/Trade/TradeStatusDisplay/renderActionButtons';
import { ExceptionalCases } from '@/components/Trade/TradeStatusDisplay/renderExceptionalCases';

// --- Copied from TradeLegend ---
// Define the visual steps including exceptional states
const tradeVisualSteps: { state: TradeLegState; icon: React.ElementType }[] = [
  { state: TradeLegState.CREATED, icon: Lock },
  { state: TradeLegState.FUNDED, icon: Check },
  { state: TradeLegState.AWAITING_FIAT_PAYMENT, icon: Hourglass },
  { state: TradeLegState.PENDING_CRYPTO_RELEASE, icon: Send },
  { state: TradeLegState.COMPLETED, icon: CheckCircle },
  { state: TradeLegState.DISPUTED, icon: ShieldAlert },
  { state: TradeLegState.CANCELLED, icon: XCircle },
];

// Helper to get a canonical state for progress calculation
const getProgressState = (state: TradeLegState | null): TradeLegState | null => {
  if (!state) return null;
  switch (state) {
    case TradeLegState.FIAT_PAID:
      return TradeLegState.PENDING_CRYPTO_RELEASE;
    case TradeLegState.RELEASED:
      return TradeLegState.COMPLETED;
    default:
      return state;
  }
};
// --- End Copied from TradeLegend ---

interface TradeStatusDisplayProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
  onCreateEscrow?: () => void;
  onFundEscrow?: () => void; // Keep if needed by actions
  onMarkFiatPaid?: () => void;
  onReleaseCrypto?: () => void;
  onDisputeTrade?: () => void;
  onCancelTrade?: () => void;
  loading?: boolean; // Overall loading for actions
  escrowDetails?: { escrow_id: bigint; amount: bigint; state: bigint }; // Keep if needed by ExceptionalCases
  escrowLoading?: boolean; // Keep if needed by ExceptionalCases
  escrowError?: Error | null; // Keep if needed by ExceptionalCases
  balance?: string; // Keep if needed by ExceptionalCases
  refreshEscrow?: () => Promise<void>; // Keep if needed by ExceptionalCases
}

const TradeStatusDisplay: React.FC<TradeStatusDisplayProps> = ({
  trade,
  userRole,
  onCreateEscrow,
  // onFundEscrow, // Not directly used here anymore, but passed to renderActionButtons
  onMarkFiatPaid,
  onReleaseCrypto,
  onDisputeTrade,
  onCancelTrade,
  loading = false,
  escrowDetails,
  balance,
  refreshEscrow,
}) => {
  const [localLoading, setLocalLoading] = useState<TradeAction | null>(null);
  const [lastLogTime, setLastLogTime] = useState<number>(0);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false); // Collapsed by default

  // --- Logic Copied/Adapted from TradeLegend ---
  const rawCurrentState = Object.values(TradeLegState).includes(trade.leg1_state as TradeLegState)
    ? (trade.leg1_state as TradeLegState)
    : null;

  const currentStateForProgress = getProgressState(rawCurrentState);

  const currentStatusMessage =
    // First check if overall_status is COMPLETED
    trade.overall_status === 'COMPLETED'
      ? tradeStateMessages[TradeLegState.COMPLETED][userRole]
      : // Then fall back to the leg1_state message
      rawCurrentState && tradeStateMessages[rawCurrentState]
      ? tradeStateMessages[rawCurrentState][userRole]
      : 'Trade status unavailable.';

  const progressStates = useMemo(
    () =>
      tradeVisualSteps.filter(
        s => s.state !== TradeLegState.DISPUTED && s.state !== TradeLegState.CANCELLED
      ),
    []
  ); // Memoize progressStates

  const currentIndex = useMemo(
    () =>
      currentStateForProgress
        ? progressStates.findIndex(step => step.state === currentStateForProgress)
        : -1,
    [currentStateForProgress, progressStates]
  );
  // --- End Logic Copied/Adapted ---

  // Helper function to handle action button clicks remains the same
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

  // Get available actions remains the same
  const availableActions = getAvailableActions({
    trade,
    userRole,
    lastLogTime,
    setLastLogTime,
  });

  return (
    <div className="space-y-6 relative">
      {/* Main Status Display */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#1e2329] border border-[#2b3139] p-4 rounded-sm">
        <StatusBadge className="text-sm font-black tracking-widest">{trade.leg1_state}</StatusBadge>
        <div className="text-right">
          <p className="text-[10px] font-bold text-[#848e9c] uppercase mb-1">Current Status</p>
          <p className="text-lg font-bold text-[#eaecef]">{currentStatusMessage}</p>
        </div>
      </div>

      <Collapsible open={isOverviewOpen} onOpenChange={setIsOverviewOpen} className="w-full">
        <div className="flex justify-end mb-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest h-6 px-2 text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139]">
              {isOverviewOpen ? 'Hide' : 'Show'} Trade Flow
              <ChevronsUpDown className="h-3 w-3 ml-1" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="flex space-x-2 overflow-x-auto py-4 items-stretch border border-[#2b3139] p-3 bg-[#0b0e11] rounded-sm">
            {tradeVisualSteps.map(step => {
              const message =
                tradeStateMessages[step.state]?.[userRole] ?? step.state.replace(/_/g, ' ');
              const Icon = step.icon;
              const stepIndexInFlow = progressStates.findIndex(s => s.state === step.state);

              let isCompleted = false;
              let isCurrent = false;
              let isFuture = true;

              if (
                step.state === TradeLegState.DISPUTED &&
                rawCurrentState === TradeLegState.DISPUTED
              ) {
                isCurrent = true;
                isFuture = false;
              } else if (
                step.state === TradeLegState.CANCELLED &&
                rawCurrentState === TradeLegState.CANCELLED
              ) {
                isCurrent = true;
                isFuture = false;
              } else if (
                step.state === TradeLegState.COMPLETED &&
                rawCurrentState === TradeLegState.RELEASED
              ) {
                isCompleted = true;
                isFuture = false;
              } else if (stepIndexInFlow !== -1 && currentIndex !== -1) {
                if (stepIndexInFlow < currentIndex) {
                  isCompleted = true;
                  isFuture = false;
                } else if (stepIndexInFlow === currentIndex) {
                  isCurrent = true;
                  isFuture = false;
                }
              } else if (
                stepIndexInFlow !== -1 &&
                rawCurrentState === TradeLegState.COMPLETED &&
                step.state === TradeLegState.COMPLETED
              ) {
                isCompleted = true;
                isFuture = false;
              }

              const boxStyle = cn(
                'flex-1 flex flex-col items-center justify-start p-3 rounded-sm border text-center min-w-[110px] transition-all duration-200',
                isCurrent && step.state === TradeLegState.DISPUTED
                  ? 'border-[#f84960] bg-[#f84960]/10 text-[#f84960]'
                  : isCurrent && step.state === TradeLegState.CANCELLED
                  ? 'border-[#848e9c] bg-[#848e9c]/10 text-[#848e9c]'
                  : isCurrent
                  ? 'border-[#FF6B00] bg-[#FF6B00]/5 text-[#FF6B00]' 
                  : isCompleted
                  ? 'border-[#02c076] bg-[#02c076]/10 text-[#02c076]'
                  : isFuture
                  ? 'text-[#474d57] opacity-60 border-[#2b3139] bg-transparent'
                  : 'border-[#2b3139] bg-transparent'
              );
              const iconStyle = cn(
                'h-5 w-5 mb-2',
                isCurrent && step.state === TradeLegState.DISPUTED
                  ? 'text-[#f84960]'
                  : isCurrent && step.state === TradeLegState.CANCELLED
                  ? 'text-[#848e9c]'
                  : isCurrent
                  ? 'text-[#FF6B00]'
                  : isCompleted
                  ? 'text-[#02c076]'
                  : 'text-[#474d57]'
              );

              return (
                <div key={step.state} className={boxStyle}>
                  <Icon className={iconStyle} />
                  <span className="text-[9px] uppercase font-black tracking-widest mb-1">
                    {step.state.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-bold leading-tight uppercase opacity-80">{message}</span>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
      {/* --- End Visual Status Overview --- */}

      {/* Render Timers, Actions, Exceptional Cases, Escrow Details as before */}
      {renderTimers({ trade, userRole })}
      {renderActionButtons({
        availableActions,
        loading,
        localLoading,
        handleAction,
        onCreateEscrow,
        // onFundEscrow, // Pass if needed by actions
        onMarkFiatPaid,
        onReleaseCrypto,
        onDisputeTrade,
        onCancelTrade,
      })}

      <ExceptionalCases
        trade={trade}
        userRole={userRole}
        escrowDetails={escrowDetails}
        balance={balance}
        refreshEscrow={refreshEscrow}
      />

      {trade.leg1_escrow_address && (
        <EscrowDetailsPanel
          escrowAddress={trade.leg1_escrow_address}
          trade={trade}
          userRole={userRole}
        />
      )}
      <TransactionHistory tradeId={trade.id} />
    </div>
  );
};

export default TradeStatusDisplay;
