import { useState } from 'react';
import { Trade, Account } from '../api';
import {
  markTradeFiatPaid,
  releaseTradeCrypto,
  disputeTrade,
  cancelTrade,
  createAndFundTradeEscrow,
} from '../services/tradeService';
import { blockchainService } from '../services/blockchainService';

interface UseTradeActionsProps {
  trade: Trade | null;
  primaryWallet: {
    address?: string;
  };
  counterparty: Account | null;
  userRole: string;
  onRefresh: () => void;
}

interface UseTradeActionsResult {
  createEscrow: () => Promise<void>;
  markFiatPaid: () => Promise<void>;
  releaseCrypto: () => Promise<void>;
  disputeTrade: () => Promise<void>;
  cancelTrade: () => Promise<void>;
  actionLoading: boolean;
}

/**
 * Custom hook to handle trade-related actions
 */
export function useTradeActions({
  trade,
  primaryWallet,
  counterparty,
  onRefresh,
}: UseTradeActionsProps): UseTradeActionsResult {
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Create an escrow for the trade
   */
  const createEscrow = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      // Update the blockchain service with the current wallet
      blockchainService.updateWallet(primaryWallet);
      blockchainService.setWalletAddress(primaryWallet.address);

      // Get fresh account data for both buyer and seller
      const buyerId = trade.leg1_buyer_account_id;
      const sellerId = trade.leg1_seller_account_id;

      if (!buyerId || !sellerId) {
        throw new Error('Missing buyer or seller account ID in trade data');
      }

      // Use the addresses from the trade data
      const buyerAddress = counterparty?.wallet_address || '';
      const sellerAddress = primaryWallet.address;

      if (!buyerAddress) {
        throw new Error(`Missing buyer wallet address`);
      }

      if (!sellerAddress) {
        throw new Error(`Missing seller wallet address`);
      }

      // Check seller has enough USDT to cover principal + 1% fee
      const amount = Number(trade.leg1_crypto_amount || '0');
      const fee = amount * 0.01; // 1% platform fee
      const required = amount + fee;
      const balance = await blockchainService.getWalletBalance();
      const balanceDisplay = balance / 1_000_000; // USDT has 6 decimals

      if (balanceDisplay < required) {
        const shortfall = (required - balanceDisplay).toFixed(2);
        throw new Error(
          `Insufficient USDT balance. You need ${required.toFixed(2)} USDT (${amount.toFixed(2)} trade + ${fee.toFixed(2)} fee) but only have ${balanceDisplay.toFixed(2)} USDT. Shortfall: ${shortfall} USDT.`
        );
      }

      // Use the combined create and fund function with the Solana-compatible wallet
      await createAndFundTradeEscrow({
        trade,
        primaryWallet,
        buyerAddress,
        sellerAddress,
      });

      // Refresh the trade data
      onRefresh();
    } catch (err) {
      console.error('Error creating escrow:', err);
      // Error handling is done in the service
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Mark fiat as paid for the trade
   */
  const markFiatPaid = async () => {
    if (!trade || !primaryWallet?.address || !trade.leg1_escrow_onchain_id) return;

    setActionLoading(true);
    try {
      // Update the blockchain service with the current wallet
      blockchainService.updateWallet(primaryWallet);
      blockchainService.setWalletAddress(primaryWallet.address);

      await markTradeFiatPaid({
        trade,
        primaryWallet,
      });

      // Refresh the trade data
      onRefresh();
    } catch (err) {
      console.error('Error marking fiat as paid:', err);
      // Error handling is done in the service
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Release crypto for the trade
   */
  const releaseCrypto = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      // Update the blockchain service with the current wallet
      blockchainService.updateWallet(primaryWallet);
      blockchainService.setWalletAddress(primaryWallet.address);

      await releaseTradeCrypto({
        trade,
        primaryWallet,
      });

      // Refresh the trade data
      onRefresh();
    } catch (err) {
      console.error('Error releasing crypto:', err);
      // Error handling is done in the service
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Dispute the trade
   */
  const handleDisputeTrade = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      // Update the blockchain service with the current wallet
      blockchainService.updateWallet(primaryWallet);
      blockchainService.setWalletAddress(primaryWallet.address);

      await disputeTrade({
        trade,
        primaryWallet,
      });

      // Refresh the trade data
      onRefresh();
    } catch (err) {
      console.error('Error disputing trade:', err);
      // Error handling is done in the service
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Cancel the trade
   */
  const handleCancelTrade = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      // Update the blockchain service with the current wallet
      blockchainService.updateWallet(primaryWallet);
      blockchainService.setWalletAddress(primaryWallet.address);

      await cancelTrade({
        trade,
        primaryWallet,
      });

      // Refresh the trade data
      onRefresh();
    } catch (err) {
      console.error('Error cancelling trade:', err);
      // Error handling is done in the service
    } finally {
      setActionLoading(false);
    }
  };

  return {
    createEscrow,
    markFiatPaid,
    releaseCrypto,
    disputeTrade: handleDisputeTrade,
    cancelTrade: handleCancelTrade,
    actionLoading,
  };
}
