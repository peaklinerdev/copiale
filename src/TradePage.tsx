import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import ChatSection from '@/components/Trade/ChatSection';
import ParticipantsSection from '@/components/Trade/ParticipantsSection';
import { formatNumber } from '@/lib/utils';
import { formatDisplayId } from '@/utils/displayId';
import { useTradeParticipants } from './hooks/useTradeParticipants';
import { useTradeUpdates } from './hooks/useTradeUpdates';
import { useEscrowDetails } from './hooks/useEscrowDetails';
import { useTradeDetails } from './hooks/useTradeDetails';
import { useTradeActions } from './hooks/useTradeActions';
import { TradeHeader } from './components/Trade/TradeHeader';
import { TradeStatusCard } from './components/Trade/TradeStatusCard';
import { TradeNavigation } from './components/Trade/TradeNavigation';
import { LoadingIndicator } from './components/Trade/LoadingIndicator';
import { TradeNotFoundAlert } from './components/Trade/TradeNotFoundAlert';
import { refreshTrade } from './services/tradeService';
import {
  getPendingTransactionsForTrade,
  retryTransactionVerification,
} from './services/transactionVerificationService';
import { toast } from 'sonner';
import {
  AUTH_STATE_CHANGE_EVENT,
  TRADE_REFRESH_EVENT,
  TRADE_STATE_CHANGE_EVENT,
  NEW_TRANSACTION_EVENT,
  CRITICAL_STATE_CHANGE_EVENT,
} from './utils/events';

// Helper function to convert escrow state string to numeric value
const escrowStateToNumber = (state: string | number): number => {
  if (typeof state === 'number') return state;

  switch (state) {
    case 'CREATED':
      return 0;
    case 'FUNDED':
      return 1;
    case 'RELEASED':
      return 2;
    case 'CANCELLED':
      return 3;
    case 'DISPUTED':
      return 4;
    case 'RESOLVED':
      return 5;
    default:
      return 0;
  }
};

function TradePage() {
  const { id } = useParams<{ id: string }>();
  const { primaryWallet } = useDynamicContext();
  const tradeId = id ? parseInt(id) : 0;

  // Custom hooks
  const { trade, offer, creator, buyerAccount, sellerAccount, loading, setTrade } =
    useTradeDetails(tradeId);

  const { userRole, currentAccount, counterparty } = useTradeParticipants(trade);

  // Use enhanced trade updates hook with smart polling
  const { trade: tradeUpdates, forceRefresh: forceTradeRefresh } = useTradeUpdates(tradeId);

  const {
    escrowDetails,
    loading: escrowLoading,
    error: escrowError,
    balance,
    refresh: refreshEscrow,
  } = useEscrowDetails(trade?.leg1_escrow_address ?? null);

  // Function to refresh trade data
  const handleRefreshTrade = useCallback(() => {
    if (!tradeId) return;

    // Use the forceRefresh function to clear cache and force fresh fetch
    forceTradeRefresh();

    // Keep the original refresh for backward compatibility
    refreshTrade(tradeId, setTrade).catch(error => {
      console.error('Error refreshing trade:', error);
    });
  }, [tradeId, setTrade, forceTradeRefresh]);

  const { createEscrow, markFiatPaid, releaseCrypto, disputeTrade, cancelTrade, actionLoading } =
    useTradeActions({
      trade,
      primaryWallet: primaryWallet || { address: undefined },
      counterparty,
      userRole,
      onRefresh: handleRefreshTrade,
    });

  const [pendingTxs, setPendingTxs] = useState<any[]>([]);

  // Use ref to store pending transactions to avoid re-renders
  const pendingTxsRef = useRef<any[]>([]);

  // Create a stable reference to the loadPendingTransactions function
  const loadPendingTransactions = useCallback(() => {
    if (!tradeId) return;
    const pending = getPendingTransactionsForTrade(tradeId);

    // Only update state if the pending transactions have actually changed
    if (JSON.stringify(pending) !== JSON.stringify(pendingTxsRef.current)) {
      pendingTxsRef.current = pending;
      setPendingTxs(pending);
    }
  }, [tradeId]);

  // Load pending transactions on component mount
  useEffect(() => {
    // Initial load
    loadPendingTransactions();

    // Refresh pending transactions every 15 seconds
    const interval = setInterval(loadPendingTransactions, 15000);

    // Listen for trade refresh events
    const handleRefreshEvent = (e: CustomEvent) => {
      if (e.detail?.tradeId === tradeId) {
        handleRefreshTrade();
      }
    };

    // Listen for trade state change events
    const handleTradeStateChange = (e: CustomEvent) => {
      if (e.detail?.tradeId === tradeId) {
        handleRefreshTrade();
      }
    };

    // Listen for new transaction events
    const handleNewTransaction = () => {
      loadPendingTransactions();
    };

    // Add event listeners
    window.addEventListener(TRADE_REFRESH_EVENT, handleRefreshEvent as EventListener);
    window.addEventListener(TRADE_STATE_CHANGE_EVENT, handleTradeStateChange as EventListener);
    window.addEventListener(NEW_TRANSACTION_EVENT, handleNewTransaction);

    // Listen for auth state change events (wallet connection/disconnection)
    const handleAuthStateChange = (e: CustomEvent) => {
      // Refresh trade data when wallet is connected
      if (e.detail?.authenticated) {
        handleRefreshTrade();
        refreshEscrow();
        loadPendingTransactions();

        // Show notification
        toast.success('Wallet connected. Trade data refreshed.');
      } else {
        // Handle wallet disconnection
        // Redirect to home page
        window.location.href = '/';
        // Show notification
        toast.info('Wallet disconnected. Redirecting to home page.');
      }
    };

    // Add auth state change event listener
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange as EventListener);

    // Clean up event listeners on component unmount
    return () => {
      clearInterval(interval);
      window.removeEventListener(TRADE_REFRESH_EVENT, handleRefreshEvent as EventListener);
      window.removeEventListener(TRADE_STATE_CHANGE_EVENT, handleTradeStateChange as EventListener);
      window.removeEventListener(NEW_TRANSACTION_EVENT, handleNewTransaction);
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange as EventListener);
    };
  }, [tradeId, handleRefreshTrade, loadPendingTransactions, refreshEscrow]);

  // Handle retrying transaction verification
  const handleRetryVerification = (txHash: string) => {
    retryTransactionVerification(txHash);
    toast.info('Retrying transaction verification...');
  };

  // Render pending transactions UI
  const renderPendingTransactions = () => {
    if (pendingTxs.length === 0) return null;

    return (
      <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-sm p-4 mb-4">
        <h3 className="text-lg font-semibold text-[#FF6B00] mb-2">Pending Transactions</h3>
        <div className="space-y-2">
          {pendingTxs.map(tx => (
            <div
              key={tx.txHash}
              className="flex items-center justify-between bg-[#FF6B00]/10 p-2 rounded-sm"
            >
              <div className="flex items-center">
                <div className="animate-spin mr-2">⟳</div>
                <div>
                  <p className="text-sm text-[#FF6B00]">
                    {tx.type.replace(/_/g, ' ').toLowerCase()} - Transaction {tx.txHash.slice(0, 6)}
                    ...{tx.txHash.slice(-4)}
                  </p>
                  <p className="text-xs text-[#848e9c]">
                    Submitted {new Date(tx.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {tx.attempts > 10 && (
                <button
                  onClick={() => handleRetryVerification(tx.txHash)}
                  className="px-3 py-1 bg-[#FF6B00]/20 text-[#FF6B00] rounded-sm hover:bg-[#FF6B00]/30"
                >
                  Retry
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-[#848e9c]">
          Your transaction has been submitted to the blockchain and is being processed. You can
          continue using the app while we wait for confirmation.
        </p>
      </div>
    );
  };

  // Update trade data when we receive updates via polling
  useEffect(() => {
    if (tradeUpdates) {
      // Check if the data is actually different
      const isDataDifferent =
        !trade ||
        trade.id !== tradeUpdates.id ||
        trade.leg1_state !== tradeUpdates.leg1_state ||
        trade.updated_at !== tradeUpdates.updated_at;

      if (isDataDifferent) {
        setTrade(tradeUpdates);
      }
    }
  }, [tradeUpdates, setTrade, tradeId, trade]);



  // Reset trade state when trade ID changes
  useEffect(() => {
    setTrade(null);
  }, [tradeId, setTrade]);

  // Listen for critical state changes (like fiat paid) that require immediate refresh
  useEffect(() => {
    const handleCriticalStateChange = () => {
      if (tradeId) {
        // Force refresh trade data
        handleRefreshTrade();
        // Also reload pending transactions
        loadPendingTransactions();
      }
    };

    // Add event listener for critical state changes
    window.addEventListener(CRITICAL_STATE_CHANGE_EVENT, handleCriticalStateChange);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener(CRITICAL_STATE_CHANGE_EVENT, handleCriticalStateChange);
    };
  }, [tradeId, handleRefreshTrade, loadPendingTransactions]);

  if (loading) {
    return <LoadingIndicator message="Loading trade details..." />;
  }

  if (!trade) {
    return <TradeNotFoundAlert />;
  }

  const token = trade.leg1_crypto_token || offer?.token || 'USDT';
  const action = userRole === 'buyer' ? 'buying' : 'selling';

  const isActiveState =
    trade.leg1_state !== 'COMPLETED' &&
    trade.leg1_state !== 'RELEASED' &&
    trade.leg1_state !== 'CANCELLED';

  const showEscrowContext =
    isActiveState &&
    trade.leg1_state !== 'CREATED' &&
    balance &&
    (parseFloat(balance) === 0);

  return (
    <div className="flex gap-4 min-h-[calc(100vh-80px)]" style={{ background: '#0a0a0a' }}>
      {/* Left panel */}
      <div className="w-[400px] shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <TradeHeader userRole={userRole} />
          <span className="text-[11px] font-mono text-[#6b7280] tracking-wider">
            #{formatDisplayId(trade.id)}
          </span>
        </div>

        <ParticipantsSection
          buyerAccount={buyerAccount}
          sellerAccount={sellerAccount}
          currentAccount={currentAccount}
          creator={creator}
          trade={trade}
          userRole={userRole}
        />

        {/* Trade details */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-[0.15em] text-[#6b7280] uppercase">
              Status
            </span>
            <span
              className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-[2px] uppercase tracking-wider"
              style={{
                color: '#f97316',
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
              }}
            >
              {trade.leg1_state.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-base font-mono font-bold text-[#ffffff]">
              {formatNumber(trade.leg1_crypto_amount || 0)} {token}
            </p>
            {trade.leg1_fiat_amount && (
              <p className="text-sm font-mono text-[#6b7280]">
                = {formatNumber(parseFloat(trade.leg1_fiat_amount))} {trade.from_fiat_currency}
              </p>
            )}
          </div>

          <div className="border-t border-[#1f1f1f] pt-3">
            <span className="text-[10px] font-mono font-bold tracking-[0.15em] text-[#6b7280] uppercase">
              Rate
            </span>
            <p className="text-sm font-mono font-medium text-[#ffffff] mt-0.5">
              {formatNumber(
                trade.leg1_fiat_amount && trade.leg1_crypto_amount
                  ? parseFloat(trade.leg1_fiat_amount) / parseFloat(trade.leg1_crypto_amount)
                  : 0
              )}{' '}
              <span className="text-[#6b7280]">{trade.from_fiat_currency}/{token}</span>
            </p>
          </div>

          {offer && (
            <div className="border-t border-[#1f1f1f] pt-2">
              <a
                href={`/offer/${offer.id}`}
                className="text-[11px] font-mono text-[#f97316] hover:opacity-80 tracking-wider"
              >
                View offer →
              </a>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="border-b border-[#1f1f1f]" />

        {/* Escrow / Actions section */}
        <TradeStatusCard
          trade={trade}
          userRole={userRole}
          actions={{
            createEscrow,
            markFiatPaid,
            releaseCrypto,
            disputeTrade,
            cancelTrade,
          }}
          actionLoading={actionLoading}
          escrowDetails={
            escrowDetails
              ? {
                  escrow_id: BigInt(escrowDetails.escrowId),
                  amount: BigInt(escrowDetails.amount.toString()),
                  state: BigInt(escrowStateToNumber(escrowDetails.state)),
                }
              : undefined
          }
          escrowLoading={escrowLoading}
          escrowError={escrowError}
          balance={balance}
          refreshEscrow={refreshEscrow}
        />

        {showEscrowContext && (
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-sm px-4 py-2">
            <p className="text-[11px] font-mono text-[#6b7280]">
              Funds held in escrow
            </p>
          </div>
        )}

        {renderPendingTransactions()}

        {/* Awaiting state */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-sm p-4">
          <div className="text-center">
            <p className="text-[11px] font-mono text-[#6b7280] tracking-wider">
              {action === 'buying' ? 'Waiting for seller' : 'Waiting for buyer'}
            </p>
            <div className="mt-1.5 flex justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#f97316] rounded-[1px] animate-pulse" />
              <span className="w-1.5 h-1.5 bg-[#f97316] rounded-[1px] animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-1.5 h-1.5 bg-[#f97316] rounded-[1px] animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>

        <TradeNavigation />
      </div>

      {/* Right panel - Chat */}
      <div className="flex-1 flex flex-col">
        <ChatSection counterparty={counterparty} className="flex-1" />
      </div>
    </div>
  );
}

export default TradePage;
