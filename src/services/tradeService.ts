import {
  createTrade,
  Offer,
  Trade,
  recordSolanaEscrow,
  RecordSolanaEscrowRequest,
  markFiatPaid,
  getTradeById,
  recordTransaction,
  getAccountById,
  newIdempotencyKey,
} from '../api';
import { buildTransactionData } from '../utils/transactionUtils.js';
import { toEscrowUsdcString, toUsdcString, toFiatString } from '../utils/amounts';

// Custom interface for create trade request that matches API expectations
interface CreateTradeRequest {
  leg1_offer_id: number;
  /** USDC decimal string (Design Invariant 3). */
  leg1_crypto_amount: string;
  /** Fiat decimal string (Design Invariant 3). */
  leg1_fiat_amount: string;
  from_fiat_currency: string;
  destination_fiat_currency: string;
}

// (Trade response unwrapping is now handled centrally via the typed
// `TradeWrapper` in `src/api/index.ts`; the local response interface
// previously declared here was retired in M5.)

/**
 * Generates a unique escrow ID based on trade ID and sequence
 * This ensures no collisions while maintaining consistency
 */
function generateEscrowId(tradeId: number, sequence: number = 0): number {
  // Use trade ID as base, add sequence
  // This gives us: 123000, 123001, 123002, ... for trade 123
  return tradeId * 1000 + sequence;
}

/**
 * Derives Solana-specific addresses for escrow recording
 */
function deriveSolanaAddresses(tradeId: number, escrowId: number) {
  try {
    // Get program ID from config
    const programIdString = config.networks.solanaDevnet.programId;
    if (!programIdString) {
      throw new Error('Solana program ID not configured');
    }

    const programId = new PublicKey(programIdString);

    // Derive escrow PDA
    const [escrowPda] = PDADerivation.deriveEscrowPDA(programId, escrowId, tradeId);

    // Derive escrow token account PDA
    const [escrowTokenAccount] = PDADerivation.deriveEscrowTokenPDA(programId, escrowPda);

    return {
      program_id: programIdString,
      escrow_pda: escrowPda.toString(),
      escrow_token_account: escrowTokenAccount.toString(),
      trade_onchain_id: tradeId.toString(),
    };
  } catch (error) {
    console.error('[ERROR] Failed to derive Solana addresses:', error);
    // Fallback to placeholder values if derivation fails
    return {
      program_id: 'Copiale-p2pProgramId',
      escrow_pda: 'EscrowPDAAddress',
      escrow_token_account: 'TokenAccountAddress',
      trade_onchain_id: tradeId.toString(),
    };
  }
}
import { formatNumber } from '../lib/utils';
import { handleApiError } from '../utils/errorHandling';
import { toast } from 'sonner';
import { config } from '../config';
import { PDADerivation } from '../blockchain/utils/pda';
import { PublicKey } from '@solana/web3.js';
import {
  createEscrowTransaction,
  markFiatPaidTransaction,
  checkAndFundEscrow,
  releaseEscrowTransaction,
  disputeEscrowTransaction,
  cancelEscrowTransaction,
  checkEscrowState,
} from './chainService';
// Removed unused imports

interface StartTradeParams {
  offerId: number;
  amount?: string;
  fiatAmount?: number;
  offer: Offer;
  primaryWallet: { address?: string } | null;
  onSuccess: (tradeId: number) => void;
  onError: (error: Error) => void;
}

interface TransactionResult {
  txHash: string;
  blockNumber?: number;
  escrowId?: string;
  escrowAddress?: string;
}

/**
 * Initiates a new trade based on an offer
 */
export const startTrade = async ({
  offerId,
  amount = '1000000',
  fiatAmount = 0,
  offer,
  primaryWallet,
  onSuccess,
  onError,
}: StartTradeParams): Promise<void> => {
  try {
    if (!offer) throw new Error('Offer not found');

    const tradeData: CreateTradeRequest = {
      leg1_offer_id: offerId,
      leg1_crypto_amount: toUsdcString(amount),
      leg1_fiat_amount: toFiatString(fiatAmount),
      from_fiat_currency: offer.fiat_currency,
      destination_fiat_currency: offer.fiat_currency,
    };

    const tradeResponse = await createTrade(
      tradeData as unknown as Parameters<typeof createTrade>[0]
    );

    const tradeId = tradeResponse.data.trade.id;

    if (primaryWallet) {
      onSuccess(tradeId);
    } else {
      alert(`Trade ${formatNumber(tradeId)} started, but no wallet connected`);
      onError(new Error('No wallet connected'));
    }
  } catch (err) {
    console.error('[TradeService] Trade failed:', err);
    // Pass through the ApiError which now has the real server message
    onError(err instanceof Error ? err : new Error('Unknown error'));
  }
};

/**
 * Parameters for creating an escrow
 */
interface CreateEscrowParams {
  trade: Trade;
  primaryWallet: {
    address?: string;
  };
  buyerAddress: string;
  sellerAddress: string;
}

/**
 * Creates an escrow for a trade on the Solana blockchain and records it in the backend
 */
export const createTradeEscrow = async ({
  trade,
  primaryWallet,
  buyerAddress,
  sellerAddress,
}: CreateEscrowParams) => {
  // One key per user intent — reused across both POSTs in this flow.
  // Backend disambiguates by (METHOD, URL, body fingerprint).
  const idempotencyKey = newIdempotencyKey();
  try {
    // Show notification message using toast
    toast('Creating escrow on Solana blockchain...', {
      description: 'Please approve the transaction in your wallet.',
    });

    // Generate unique escrow ID (first escrow for this trade)
    const escrowId = generateEscrowId(trade.id, 0);

    // Create the escrow transaction on the Solana blockchain.
    // Validate amount as a string at the boundary, then coerce to number
    // for the on-chain BN; under the 100 USDC escrow cap precision is safe.
    const txResult = await createEscrowTransaction(primaryWallet, {
      tradeId: trade.id,
      escrowId: escrowId, // Pass the pre-generated ID
      buyer: buyerAddress,
      amount: Number(toEscrowUsdcString(trade.leg1_crypto_amount || '0')),
      sequential: false,
      sequentialEscrowAddress: undefined,
      arbitrator: undefined, // Solana program handles arbitrator internally
    });

    // Record the escrow in our backend (Solana variant — Design Invariant 5).
    // escrow_id and amount serialized as decimal strings per Invariants 3+4.
    // The on-chain numeric escrowId is preserved locally for PDA derivation;
    // only the wire body uses strings.
    const solanaAddresses = deriveSolanaAddresses(trade.id, escrowId);
    const recordEscrowData: RecordSolanaEscrowRequest = {
      trade_id: trade.id,
      signature: txResult.txHash,
      escrow_id: escrowId.toString(),
      seller: sellerAddress,
      buyer: buyerAddress,
      amount: toEscrowUsdcString(trade.leg1_crypto_amount || '0'),
      sequential: false,
      sequential_escrow_address: '11111111111111111111111111111111', // System Program address for non-sequential escrows
      program_id: solanaAddresses.program_id,
      escrow_pda: solanaAddresses.escrow_pda,
      escrow_token_account: solanaAddresses.escrow_token_account,
      trade_onchain_id: solanaAddresses.trade_onchain_id,
    };

    await recordSolanaEscrow(recordEscrowData, idempotencyKey);

    // Pass amount as canonical decimal string into the transaction record.
    const leg1CryptoToken = trade.leg1_crypto_token || 'USDC';

    // Record the transaction using the utility function for correct field mapping
    const transactionData = buildTransactionData({
      trade_id: trade.id,
      escrow_id: escrowId, // Use the pre-generated ID
      signature: txResult.txHash, // Use txHash as signature for Solana
      transaction_type: 'CREATE_ESCROW',
      from_address: sellerAddress,
      to_address: recordEscrowData.escrow_pda, // Use the escrow PDA as the destination
      amount: toEscrowUsdcString(trade.leg1_crypto_amount || '0'),
      token_type: leg1CryptoToken,
      status: 'SUCCESS',
      slot: Number(txResult.blockNumber), // Use blockNumber as slot for Solana
      metadata: {
        escrow_id: escrowId.toString(),
        seller: sellerAddress,
        buyer: buyerAddress,
      },
    });
    await recordTransaction(transactionData, idempotencyKey);

    // Show success message
    toast.success('Escrow created successfully!', {
      description: `Escrow ID: ${escrowId}`,
    });

    return {
      txHash: txResult.txHash,
      blockNumber: txResult.blockNumber,
      success: true,
      message: `Escrow created with ID: ${escrowId}`,
      escrowId: escrowId.toString(),
    };
  } catch (err) {
    console.error('Error creating Solana escrow:', err);
    const errorMessage = handleApiError(err, 'Failed to create escrow: Unknown error');
    toast.error(errorMessage);
    throw err;
  }
};

/**
 * Creates an escrow for a trade and immediately prompts to fund it
 * This combines the escrow creation and funding steps into one flow
 */
export const createAndFundTradeEscrow = async ({
  trade,
  primaryWallet,
  buyerAddress,
  sellerAddress,
}: CreateEscrowParams) => {
  // One key per user intent, reused across recordEscrow + recordTransaction.
  const idempotencyKey = newIdempotencyKey();
  let escrowResult;
  let fundResult;

  try {
    // First create the escrow
    escrowResult = await createTradeEscrow({
      trade,
      primaryWallet,
      buyerAddress,
      sellerAddress,
    });

    // Verify we have a valid escrow ID before proceeding
    if (!escrowResult.escrowId || escrowResult.escrowId === '0') {
      throw new Error('Invalid escrow ID. Cannot proceed with funding.');
    }

    // Then check and fund it with the confirmed escrow ID.
    // Validate amount as a string at the boundary; chainService coerces to
    // number for the on-chain BN.
    fundResult = await checkAndFundEscrow(primaryWallet, escrowResult.escrowId, {
      id: trade.id,
      leg1_crypto_amount: Number(toEscrowUsdcString(trade.leg1_crypto_amount || '0')),
    });

    // Convert result to expected format
    const txResult: TransactionResult =
      typeof fundResult === 'string' ? { txHash: fundResult } : (fundResult as TransactionResult);

    // Record the funding transaction
    if (txResult && 'txHash' in txResult && txResult.txHash) {
      try {
        // Derive the escrow PDA to use as to_address
        const solanaAddresses = deriveSolanaAddresses(trade.id, parseInt(escrowResult.escrowId));

        const transactionData = buildTransactionData({
          trade_id: trade.id,
          escrow_id: escrowResult.escrowId ? parseInt(escrowResult.escrowId) : 0,
          signature: String(txResult.txHash), // Use txHash as signature for Solana
          transaction_type: 'FUND_ESCROW',
          from_address: sellerAddress,
          to_address: solanaAddresses.escrow_pda, // Use the escrow PDA as the destination
          amount: toEscrowUsdcString(trade.leg1_crypto_amount || '0'),
          token_type: trade.leg1_crypto_token || 'USDC',
          status: 'SUCCESS',
          slot: Number(txResult.blockNumber), // Use blockNumber as slot for Solana
          metadata: {
            escrow_id: escrowResult.escrowId || '0',
            seller: sellerAddress,
            buyer: buyerAddress,
          },
        });
        await recordTransaction(transactionData, idempotencyKey);
      } catch (recordError) {
        // On-chain succeeded but recording POST failed.
        // Per Design Invariant 2: do not retry past one bounded attempt
        // (the axios interceptor handles 409 retry_conflict). The
        // backend listener reconciles missing transaction rows from
        // chain events, so we surface a soft warning here and proceed.
        console.error(
          'Failed to record transaction; on-chain confirmed. Listener will reconcile.',
          recordError,
        );
        toast.warning(
          'Transaction completed on blockchain. Recording will reconcile shortly.',
        );
      }
    }

    return { escrow: escrowResult, fund: txResult };
  } catch (err) {
    console.error('Error in create and fund escrow flow:', err);
    // Partial-state recovery is now driven by the on-chain listener
    // (Design Invariant 2). No localStorage fallback.
    const errorMessage = handleApiError(err, 'Failed to create and fund escrow');
    toast.error(errorMessage);
    throw err;
  }
};

// NOTE: the previous storeTransactionLocally / storeIncompleteEscrowLocally /
// retryPendingTransactions trio (along with the page-load setTimeout) was
// designed around a two-step server-signed escrow flow that never existed
// in this backend (verified via `git log -S` across copiale-p2p-api). Per
// Design Invariant 2 the recovery model is now: chain-confirmed actions
// whose recording POST fails are reconciled by the backend listener from
// chain events. No client-side localStorage queue, no setTimeout retry.

/**
 * Marks fiat as paid for a trade
 */
export const markTradeFiatPaid = async ({
  trade,
  primaryWallet,
}: {
  trade: Trade;
  primaryWallet: { address?: string };
}) => {
  const idempotencyKey = newIdempotencyKey();
  try {
    if (!trade.leg1_escrow_address) {
      throw new Error('No escrow address found for this trade');
    }

    // Check the current state of the escrow
    try {
      // Just check if the escrow exists, we don't need to use the state value
      await checkEscrowState(primaryWallet, trade.leg1_escrow_address);

      // Show notification message using toast
      toast('Marking fiat as paid...', {
        description: 'Please approve the transaction in your wallet.',
      });

      try {
        // Execute the blockchain transaction
        const result = await markFiatPaidTransaction(primaryWallet, trade.leg1_escrow_address);

        // Only record the transaction if the blockchain transaction was successful
        if (result) {
          // Record the transaction details via the recordTransaction API
          const transactionData = buildTransactionData({
            trade_id: trade.id,
            escrow_id: Number(trade.leg1_escrow_onchain_id || 0),
            signature: result, // Use result as signature for Solana
            transaction_type: 'MARK_FIAT_PAID',
            from_address: primaryWallet.address || '',
            status: 'SUCCESS',
            metadata: {
              buyer: trade.leg1_buyer_account_id ? trade.leg1_buyer_account_id.toString() : '',
            },
          });

          await recordTransaction(transactionData, idempotencyKey);

          // Call the backend API to update the trade status
          await markFiatPaid(trade.id);
        } else {
          throw new Error('Blockchain transaction failed - no signature returned');
        }

        // Dispatch a global event to notify all open tabs/windows about this critical state change
        const event = new CustomEvent('copiale-p2p:critical-state-change', {
          detail: {
            tradeId: trade.id,
            newState: 'FIAT_PAID',
            timestamp: new Date().toISOString(),
          },
        });
        window.dispatchEvent(event);

        // Force an immediate refresh for all clients by invalidating cache
        localStorage.setItem('copiale-p2p_last_trade_update', new Date().toISOString());

        toast.success('Fiat payment marked as complete');
      } catch (error: unknown) {
        const err = error as Error;
        // Handle specific blockchain errors with user-friendly messages
        if (err.message.includes('User rejected the request')) {
          toast.error('Transaction cancelled', {
            description: 'You cancelled the transaction in your wallet.',
          });
        } else if (err.message.includes('reverted')) {
          toast.error('Transaction failed', {
            description:
              'The blockchain rejected this transaction. The escrow may be in an invalid state or you may not have permission to mark it as paid.',
          });
        } else {
          // Generic error handling
          toast.error('Failed to mark fiat as paid', {
            description: err.message || 'An unexpected error occurred',
          });
        }
        throw error;
      }
    } catch (error) {
      // This catch block handles errors from checkEscrowState
      if (error instanceof Error && error.message.includes('Escrow not found')) {
        toast.error('Escrow not found', {
          description: 'The escrow could not be found on the blockchain.',
        });
      }
      throw error;
    }
  } catch (err) {
    console.error('Error marking fiat as paid:', err);
    // Don't show another toast here since we've already shown specific ones above
    throw err;
  }
};

/**
 * Parameters for releasing crypto
 */
interface ReleaseCryptoParams {
  trade: Trade;
  primaryWallet: {
    address?: string;
  };
}

/**
 * Releases crypto for a trade
 */
export const releaseTradeCrypto = async ({
  trade,
  primaryWallet,
}: ReleaseCryptoParams): Promise<void> => {
  if (!trade || !primaryWallet?.address || !trade.leg1_escrow_address) return;
  const idempotencyKey = newIdempotencyKey();

  try {
    toast('Releasing crypto on Solana blockchain...', {
      description: 'Please approve the transaction in your wallet.',
    });

    // Execute the blockchain transaction
    const txResult = await releaseEscrowTransaction(primaryWallet, trade.leg1_escrow_address);

    // Only record the transaction if the blockchain transaction was successful
    if (txResult.txHash) {
      // Fetch the buyer's wallet address from the account ID
      let buyerWalletAddress = '';
      if (trade.leg1_buyer_account_id) {
        try {
          const buyerAccountResponse = await getAccountById(trade.leg1_buyer_account_id);
          buyerWalletAddress = buyerAccountResponse.data.wallet_address;
        } catch (error) {
          console.error('[ERROR] Failed to fetch buyer account:', error);
          // Fallback to empty string if we can't fetch the buyer address
          buyerWalletAddress = '';
        }
      }

      // Record the transaction details via the recordTransaction API
      const transactionData = buildTransactionData({
        trade_id: trade.id,
        escrow_id: Number(trade.leg1_escrow_onchain_id),
        signature: txResult.txHash, // Use txHash as signature for Solana
        transaction_type: 'RELEASE_ESCROW',
        from_address: primaryWallet.address,
        to_address: buyerWalletAddress,
        amount: trade.leg1_crypto_amount
          ? toUsdcString(trade.leg1_crypto_amount)
          : undefined,
        token_type: trade.leg1_crypto_token,
        status: 'SUCCESS',
        slot: Number(txResult.blockNumber), // Use blockNumber as slot for Solana
      });

      await recordTransaction(transactionData, idempotencyKey);
    } else {
      throw new Error('Blockchain transaction failed - no signature returned');
    }

    toast.success('Crypto released successfully!');
  } catch (error: unknown) {
    console.error('Error releasing crypto:', error);

    // Extract a more user-friendly error message
    let errorMessage = 'Failed to release crypto. Please try again.';

    if (error instanceof Error && error.message) {
      if (error.message.includes('User rejected the request')) {
        errorMessage = 'Transaction was rejected in your wallet.';
      } else if (error.message.includes('reverted')) {
        // Extract the specific revert reason if available
        if (error.message.includes('Release escrow transaction reverted:')) {
          const revertReason = error.message
            .split('Release escrow transaction reverted:')[1]
            .trim();
          errorMessage = `Transaction failed: ${revertReason}`;
        } else {
          errorMessage =
            'Transaction failed on the blockchain. This could be due to contract restrictions or network issues.';
        }
      } else if (error.message.includes('no funds')) {
        errorMessage = 'This escrow has no funds to release.';
      }
    }

    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Parameters for disputing a trade
 */
interface DisputeTradeParams {
  trade: Trade;
  primaryWallet: {
    address?: string;
  };
}

/**
 * Disputes a trade
 */
export const disputeTrade = async ({ trade, primaryWallet }: DisputeTradeParams): Promise<void> => {
  if (!trade || !primaryWallet?.address || !trade.leg1_escrow_address) return;
  const idempotencyKey = newIdempotencyKey();

  try {
    toast('Opening dispute on Solana blockchain...', {
      description: 'Please approve the transaction in your wallet.',
    });

    // Generate a dummy evidence hash for now - in production this would be a real hash of evidence
    const evidenceHash = 'dispute_evidence_' + Date.now().toString();

    try {
      // Execute the blockchain transaction
      const txResult = await disputeEscrowTransaction(
        primaryWallet,
        trade.leg1_escrow_onchain_id || 0,
        evidenceHash
      );

      // Record the transaction details via the recordTransaction API
      const transactionData = buildTransactionData({
        trade_id: trade.id,
        escrow_id: Number(trade.leg1_escrow_onchain_id || 0),
        signature: txResult.txHash, // Use txHash as signature for Solana
        transaction_type: 'DISPUTE_ESCROW',
        from_address: primaryWallet.address,
        status: 'SUCCESS',
        slot: Number(txResult.blockNumber), // Use blockNumber as slot for Solana
        metadata: {
          disputing_party: primaryWallet.address,
          evidence_hash: evidenceHash,
        },
      });
      await recordTransaction(transactionData, idempotencyKey);

      toast.success('Trade disputed successfully');
    } catch (error: unknown) {
      const err = error as Error;
      // Handle specific blockchain errors with user-friendly messages
      if (err.message.includes('User rejected the request')) {
        toast.error('Transaction cancelled', {
          description: 'You cancelled the transaction in your wallet.',
        });
      } else if (err.message.includes('reverted')) {
        toast.error('Transaction failed', {
          description:
            'The blockchain rejected this transaction. The escrow may be in an invalid state for disputes or you may not have permission.',
        });
      } else if (err.message.includes('insufficient funds')) {
        toast.error('Insufficient funds', {
          description:
            'You do not have enough funds to open a dispute. Disputes may require a bond payment.',
        });
      } else {
        // Generic error handling
        toast.error('Failed to open dispute', {
          description: err.message || 'An unexpected error occurred',
        });
      }
      throw error;
    }
  } catch (err) {
    console.error('Error disputing trade:', err);
    // Don't show another toast here since we've already shown specific ones above
    throw err;
  }
};

/**
 * Interface for cancel trade parameters
 */
interface CancelTradeParams {
  trade: Trade;
  primaryWallet: {
    address?: string;
  };
}

/**
 * Cancels a trade
 */
export const cancelTrade = async ({ trade, primaryWallet }: CancelTradeParams): Promise<void> => {
  if (!trade || !primaryWallet?.address || !trade.leg1_escrow_address) return;
  const idempotencyKey = newIdempotencyKey();

  try {
    toast('Checking escrow state...', {
      description: 'Verifying that the escrow has no funds before cancellation.',
    });

    try {
      const escrowState = await checkEscrowState(primaryWallet, trade.leg1_escrow_address);

      // If the escrow has funds, we cannot cancel it
      if (escrowState.hasFunds) {
        toast.error('Cannot cancel trade', {
          description:
            'The escrow still has funds. The funds must be released or refunded before cancellation.',
        });
        throw new Error('Escrow has funds. Cannot cancel.');
      }

      toast('Cancelling trade on Solana blockchain...', {
        description: 'Please approve the transaction in your wallet.',
      });

      try {
        // Execute the blockchain transaction
        const txResult = await cancelEscrowTransaction(
          primaryWallet,
          trade.leg1_escrow_onchain_id || 0
        );

        // Record the transaction details via the recordTransaction API
        const transactionData = buildTransactionData({
          trade_id: trade.id,
          escrow_id: Number(trade.leg1_escrow_onchain_id || 0),
          signature: String(txResult.txHash), // Use txHash as signature for Solana
          transaction_type: 'CANCEL_ESCROW',
          from_address: primaryWallet.address,
          status: 'SUCCESS',
          slot: Number(txResult.blockNumber), // Use blockNumber as slot for Solana
          metadata: {
            seller: trade.leg1_seller_account_id ? trade.leg1_seller_account_id.toString() : '',
            authority: primaryWallet.address,
          },
        });
        await recordTransaction(transactionData, idempotencyKey);

        toast.success('Trade cancelled successfully');
      } catch (error: unknown) {
        const err = error as Error;
        // Handle specific blockchain errors with user-friendly messages
        if (err.message.includes('User rejected the request')) {
          toast.error('Transaction cancelled', {
            description: 'You cancelled the transaction in your wallet.',
          });
        } else if (err.message.includes('reverted')) {
          toast.error('Transaction failed', {
            description:
              'The blockchain rejected this transaction. The escrow may be in an invalid state or you may not have permission to cancel it.',
          });
        } else if (err.message.includes('Escrow has funds')) {
          toast.error('Cannot cancel trade', {
            description:
              'The escrow still has funds. The funds must be released or refunded before cancellation.',
          });
        } else {
          // Generic error handling
          toast.error('Failed to cancel trade', {
            description: err.message || 'An unexpected error occurred',
          });
        }
        throw error;
      }
    } catch (error) {
      // This catch block handles errors from checkEscrowState
      if (error instanceof Error && error.message.includes('Escrow not found')) {
        toast.error('Escrow not found', {
          description: 'The escrow could not be found on the blockchain.',
        });
      }
      throw error;
    }
  } catch (err) {
    console.error('Error cancelling trade:', err);
    // Don't show another toast here since we've already shown specific ones above
    throw err;
  }
};

/**
 * Refreshes trade data
 */
export const refreshTrade = async (
  tradeId: number,
  setTrade: (trade: Trade) => void
): Promise<void> => {
  try {
    const updatedTrade = await getTradeById(tradeId);
    // M5: response shape is `{ network, trade }`.
    setTrade(updatedTrade.data.trade);
  } catch (err) {
    console.error('Error refreshing trade:', err);
    const errorMessage = handleApiError(err, 'Failed to refresh trade data');
    toast.error(errorMessage);
  }
};
