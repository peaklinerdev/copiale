// This service used to poll Solana RPC for pending transactions stored in
// localStorage and replay them to /transactions/. It is no longer wired up:
//   - `addPendingTransaction` is never called anywhere in the app, so the
//     queue this service drained is always empty.
//   - The retry path violated Design Invariant 1 by minting a fresh
//     idempotency key on each replay.
// Per Design Invariant 2 the recovery model is now backend-listener-driven
// reconciliation from chain events. This file is kept as no-op stubs so
// existing import sites (TradePage, etc.) continue to compile while the
// dead code is removed.
import { PendingTransaction } from '../utils/pendingTransactions';

export const getPendingTransactionsForTrade = (tradeId: number): PendingTransaction[] => {
  void tradeId;
  return [];
};

export function startVerificationService(): void {}

export function stopVerificationService(): void {}

export function initTransactionVerification(): void {}

export function retryTransactionVerification(txHash: string): void {
  void txHash;
}
