import { useState, useEffect, useCallback, useRef } from 'react';
import { blockchainService } from '../services/blockchainService.js';
import { toast } from 'sonner';

// Define the escrow state type based on the Solana program
export enum EscrowState {
  CREATED = 0,
  FUNDED = 1,
  RELEASED = 2,
  CANCELLED = 3,
  DISPUTED = 4,
  RESOLVED = 5,
}

// Define the escrow details type for Solana
export interface EscrowDetails {
  escrowId: number;
  tradeId: number;
  seller: string;
  buyer: string;
  arbitrator: string;
  amount: string; // Invariant 3: string for interface
  depositDeadline: number;
  fiatDeadline: number;
  state: EscrowState | string; // Allow both enum and string states
  sequential: boolean;
  sequentialEscrowAddress: string;
  fiatPaid: boolean;
  counter: number;
  disputeInitiator: string;
  disputeBondBuyer: string;
  disputeBondSeller: string;
  disputeTimestamp: number;
  disputeEvidenceHash: string;
}

export function useEscrowDetails(escrowAddress: string | null) {
  const [escrowDetails, setEscrowDetails] = useState<EscrowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [balance, setBalance] = useState('0');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const lastAddressRef = useRef<string | null>(null);

  const fetchEscrowDetails = useCallback(
    async (showToast = false) => {
      if (!escrowAddress) {
        setLoading(false);
        return;
      }

      try {
        setIsRefreshing(true);

        const escrowState = await blockchainService.getEscrowStateByAddress(escrowAddress);
        const escrowBalance = await blockchainService.getEscrowBalanceByAddress(escrowAddress);

        const balanceBigInt = BigInt(Math.floor(escrowBalance));
        const balanceString = (Number(balanceBigInt) / 1_000_000).toFixed(6);
        setBalance(balanceString);

        const details: EscrowDetails = {
          escrowId: escrowState.id,
          tradeId: escrowState.tradeId,
          seller: escrowState.sellerAddress,
          buyer: escrowState.buyerAddress,
          arbitrator: escrowState.arbitratorAddress,
          amount: escrowState.amount,
          depositDeadline: escrowState.depositDeadline || 0,
          fiatDeadline: escrowState.fiatDeadline || 0,
          state: escrowState.state,
          sequential: escrowState.sequential || false,
          sequentialEscrowAddress: escrowState.sequentialEscrowAddress || '',
          fiatPaid: escrowState.fiatPaid || false,
          counter: 0,
          disputeInitiator: '',
          disputeBondBuyer: '0',
          disputeBondSeller: '0',
          disputeTimestamp: 0,
          disputeEvidenceHash: '',
        };

        setEscrowDetails(details);
        setLastUpdated(new Date());
        setError(null);

        if (showToast) {
          toast.success('Escrow details refreshed');
        }
      } catch (err) {
        const isNewAddress = escrowAddress !== lastAddressRef.current;
        if (isNewAddress) {
          // Suppress error during initial bootstrap — account may not exist on-chain yet
          return;
        }
        console.error('Error fetching Solana escrow details:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching escrow details'));
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [escrowAddress]
  );

  // Initial fetch with fast retry for new addresses, then steady polling
  useEffect(() => {
    const isNew = escrowAddress !== lastAddressRef.current;
    lastAddressRef.current = escrowAddress;

    setLoading(true);
    setError(null);
    setEscrowDetails(null);

    if (!escrowAddress) {
      setLoading(false);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    let retry = 0;
    const MAX_RETRIES = 8;

    const attempt = () => {
      fetchEscrowDetails().then(() => {
        if (!isNew || retry >= MAX_RETRIES) return;
        // On success, clear any error state (fetchEscrowDetails already handles success)
      }).catch(() => {}).finally(() => {
        if (!isNew || retry >= MAX_RETRIES) return;
        retry++;
        const delay = Math.min(2000 * Math.pow(1.5, retry), 15000);
        timeoutId = setTimeout(attempt, delay);
      });
    };

    attempt();

    const interval = setInterval(() => fetchEscrowDetails(), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [escrowAddress, fetchEscrowDetails]);

  const refresh = useCallback(async () => {
    await fetchEscrowDetails(true);
  }, [fetchEscrowDetails]);

  return {
    escrowDetails,
    loading,
    error,
    balance,
    lastUpdated,
    isRefreshing,
    refresh,
  };
}

// Helper function to convert numeric state to readable name
export function getEscrowStateName(state: number): string {
  const states = ['CREATED', 'FUNDED', 'RELEASED', 'CANCELLED', 'DISPUTED', 'RESOLVED'];
  return states[state] || `UNKNOWN (${state})`;
}
