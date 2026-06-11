import { useCallback, useRef } from 'react';
import { Trade, getTradeById } from '@/api';
import { useSmartPolling } from './useSmartPolling';
import { toast } from 'sonner';

const TERMINAL_STATES = ['COMPLETED', 'RELEASED', 'CANCELLED'];
const STATE_LABELS: Record<string, string> = {
  COMPLETED: 'Trade completed',
  RELEASED: 'Crypto released',
  CANCELLED: 'Trade cancelled',
};

export function useTradeUpdates(tradeId: number) {
  // Keep track of the previous data and ETag
  const previousDataRef = useRef<Trade | null>(null);
  const etagRef = useRef<string | null>(null);

  // Memoize fetch function to avoid recreating it on each render
  const fetchTrade = useCallback(async (): Promise<Trade | null> => {
    if (tradeId === null || tradeId === undefined) {
      return null;
    }


    try {
      const response = await getTradeById(tradeId);

      // Extract trade object from response - handle both old and new API response formats
      const tradeData = (response.data as any).trade || response.data;

      // Validate that we have a proper trade object
      if (!tradeData || typeof tradeData !== 'object') {
        console.error('[useTradeUpdates] Invalid trade data received:', response.data);
        throw new Error('Invalid trade data received from API');
      }

      if (!tradeData.id) {
        console.error('[useTradeUpdates] Trade data missing ID:', tradeData);
        throw new Error('Trade data missing required ID field');
      }

      // Compare with previous data to detect changes
      const previousData = previousDataRef.current;
      const hasStateChanged = previousData && previousData.leg1_state !== tradeData.leg1_state;

      // Store the trade data for future conditional requests
      previousDataRef.current = tradeData;
      return tradeData;
    } catch (err) {
      console.error(`[useTradeUpdates] Error fetching trade ${tradeId}:`, err);
      throw err instanceof Error ? err : new Error('Fetch error');
    }
  }, [tradeId]);

  // Handle trade state changes
  const handleTradeStateChange = (newTrade: Trade) => {
    const newState = newTrade.leg1_state;
    
    // Show toast when trade reaches a terminal state
    if (newState && TERMINAL_STATES.includes(newState)) {
      const label = STATE_LABELS[newState] || newState;
      const isGood = newState === 'COMPLETED' || newState === 'RELEASED';
      isGood
        ? toast.success(label, { description: `Trade #${tradeId} has been ${newState.toLowerCase()}.`, duration: 8000 })
        : toast.warning(label, { description: `Trade #${tradeId} has been cancelled.` });
    }
    
    // Dispatch a custom event to notify other components
    const event = new CustomEvent('copiale-p2p:trade-state-changed', {
      detail: { tradeId, newState: newTrade.leg1_state },
    });
    window.dispatchEvent(event);

    // Also dispatch the existing refresh event for backward compatibility
    const refreshEvent = new CustomEvent('copiale-p2p:refresh-trade', {
      detail: { tradeId },
    });
    window.dispatchEvent(refreshEvent);
  };

  // Use smart polling
  const polling = useSmartPolling(fetchTrade, [tradeId], {
    initialInterval: 15000,
    minInterval: 5000,
    maxInterval: 30000,
    inactivityThreshold: 5 * 60 * 1000,
    tradeStateChangeCallback: handleTradeStateChange,
  });

  // Function to force a fresh fetch by clearing cache
  const forceRefresh = useCallback(() => {
    previousDataRef.current = null;
    etagRef.current = null;
    polling.forcePoll();
  }, [tradeId, polling]);

  // Log polling status only when there are errors
  if (polling.error) {
    console.error(`[useTradeUpdates] Polling error for trade ${tradeId}:`, polling.error.message);
  }

  return {
    trade: polling.data,
    error: polling.error,
    isPolling: polling.isPolling,
    currentInterval: polling.currentInterval,
    pausePolling: polling.pausePolling,
    resumePolling: polling.resumePolling,
    forcePoll: polling.forcePoll,
    forceRefresh,
    isConnected: !!polling.data && !polling.error,
  };
}

export function isDeadlineExpired(deadline: string | null): boolean {
  if (!deadline) return false;
  const deadlineTime = new Date(deadline).getTime();
  const currentTime = new Date().getTime();
  return currentTime > deadlineTime;
}
