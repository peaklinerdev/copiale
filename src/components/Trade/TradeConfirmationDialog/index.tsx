import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Offer } from '@/api';
import { formatNumber } from '@/lib/utils';
import { numericValue } from '@/utils/money-display';

// Import our custom hooks and components
import { useTradeConfirmation } from './useTradeConfirmation';
import { TradeCalculatedValues } from './TradeCalculatedValues';
import { useDynamicContext, getNetwork } from '@dynamic-labs/sdk-react-core';

interface TradeConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer;
  onConfirm: (leg1_offer_id: number, leg1_crypto_amount: string, leg1_fiat_amount: number) => void; // Updated parameter names
  triggerButton?: React.ReactNode;
}

const TradeConfirmationDialog = ({
  isOpen,
  onOpenChange,
  offer,
  onConfirm,
  triggerButton,
}: TradeConfirmationDialogProps) => {
  // Use our custom hook that combines all the logic
  const {
    amount,
    amountError,
    priceData,
    loading,
    error,
    fiatAmount,
    platformFee,
    handleAmountChange,
    handleConfirm,
  } = useTradeConfirmation(isOpen, offer, onConfirm);

  // Debug: Log fiat amount when TradeConfirmationDialog loads
  React.useEffect(() => {
    if (isOpen && fiatAmount > 0) {
      console.log('[TradeConfirmationDialog] fiatAmount:', fiatAmount);
      console.log(
        '[TradeConfirmationDialog] fiatAmount rounded to 2 decimals:',
        Math.round(fiatAmount * 100) / 100
      );
    }
  }, [isOpen, fiatAmount]);

  const { primaryWallet } = useDynamicContext();

  // Determine if the current user will be the seller in this trade
  // If offer_type is 'BUY', the counterparty (taker) is the seller
  // If offer_type is 'SELL', the counterparty (taker) is the buyer
  const isSeller = offer.offer_type === 'BUY' && primaryWallet?.address;
  const {
    balance: usdcBalance,
    loading: usdcLoading,
    error: usdcError,
  } = useSellerUsdcBalance(isSeller ? primaryWallet?.address : undefined, isOpen, amount);
  // Display-side numeric values (coercion delegated to money-display helper).
  const amountToEscrow = numericValue(amount);
  const usdcBalanceNum = usdcBalance !== null ? numericValue(usdcBalance) / 1e6 : null;
  const insufficient =
    isSeller &&
    usdcBalanceNum !== null &&
    !usdcLoading &&
    !usdcError &&
    amountToEscrow > 0 &&
    usdcBalanceNum < amountToEscrow;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className="bg-[#1e2329] border-[#2b3139] text-[#eaecef] z-50 max-w-md w-full rounded-sm">
        <DialogHeader className="border-b border-[#2b3139] pb-4">
          <DialogTitle className="text-[#eaecef] font-bold">Confirm Trade Details</DialogTitle>
          <DialogDescription className="text-[#848e9c]">Review the details of this trade before confirming.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mb-4 mt-4">
          {/* Trade Type */}
          <div className="flex justify-between items-center p-3 bg-[#0b0e11] rounded-sm border border-[#2b3139]">
            <span className="text-xs font-bold text-[#848e9c] uppercase">Trade Type</span>
            <span
              className={`px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider ${
                offer.offer_type === 'BUY'
                  ? 'bg-[#f84960]/10 text-[#f84960]'
                  : 'bg-[#02c076]/10 text-[#02c076]'
              }`}
            >
              {offer.offer_type === 'BUY' ? 'Selling USDT/USDC' : 'Buying USDT/USDC'}
            </span>
          </div>

          {/* Token */}
          <div className="flex justify-between items-center p-3 bg-[#0b0e11] rounded-sm border border-[#2b3139]">
            <span className="text-xs font-bold text-[#848e9c] uppercase">Asset</span>
            <span className="text-sm font-bold text-[#fcd535]">{offer.token}</span>
          </div>

          {/* Market Price */}
          {priceData && (
            <div className="flex justify-between items-center p-3 bg-[#0b0e11] rounded-sm border border-[#2b3139]">
              <span className="text-xs font-bold text-[#848e9c] uppercase">Market Price</span>
              <span className="text-sm font-bold">
                {formatNumber(
                  parseFloat(
                    priceData.data.USDC[offer.fiat_currency as keyof typeof priceData.data.USDC]
                      ?.price || '0'
                  )
                )}{' '}
                {offer.fiat_currency}
              </span>
            </div>
          )}

          {/* Rate */}
          <div className="flex flex-col p-3 bg-[#0b0e11] rounded-sm border border-[#2b3139]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#848e9c] uppercase">Rate Adjustment</span>
              <span
                className={`text-sm font-bold ${
                  numericValue(offer.rate_adjustment) > 1
                    ? 'text-[#02c076]'
                    : numericValue(offer.rate_adjustment) < 1
                    ? 'text-[#f84960]'
                    : 'text-[#eaecef]'
                }`}
              >
                {numericValue(offer.rate_adjustment) > 1
                  ? `+${((numericValue(offer.rate_adjustment) - 1) * 100).toFixed(2)}%`
                  : numericValue(offer.rate_adjustment) < 1
                  ? `-${((1 - numericValue(offer.rate_adjustment)) * 100).toFixed(2)}%`
                  : '0%'}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs font-bold text-[#848e9c] uppercase tracking-wider">Amount ({offer.token})</Label>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder={`Min: ${offer.min_amount}`}
                className={`bg-[#0b0e11] border-[#2b3139] text-[#eaecef] rounded-sm focus:ring-0 h-12 pr-16 ${
                  amountError ? 'border-[#f84960] focus:ring-[#f84960]/20' : ''
                }`}
                readOnly={false}
                autoFocus
              />
              <span className="absolute right-3 top-3.5 text-xs font-bold text-[#848e9c]">{offer.token}</span>
            </div>
            <div className="flex flex-col gap-1">
              {isSeller && (
                <span className="text-[#848e9c] text-[10px] font-medium">
                  Available: {' '}
                  {usdcLoading
                    ? '---'
                    : usdcError
                    ? `Error`
                    : usdcBalanceNum?.toLocaleString(undefined, { maximumFractionDigits: 6 }) ??
                      '0.00'}{' '}
                  {offer.token}
                </span>
              )}
              {amountError && <div className="text-[10px] font-bold text-[#f84960] mt-1">{amountError}</div>}
              {isSeller && insufficient && (
                <div className="mt-1 text-[10px] font-bold text-[#f84960] bg-[#f84960]/10 border border-[#f84960]/20 rounded-sm p-3">
                  Warning: Insufficient {offer.token} balance to fund this escrow.
                </div>
              )}
            </div>
          </div>

          <TradeCalculatedValues
            offer={offer}
            amount={amount}
            fiatAmount={fiatAmount}
            platformFee={platformFee}
            loading={loading}
            error={error}
          />

          {/* Time Limits */}
          <div className="text-[10px] text-[#848e9c] font-medium p-3 bg-[#0b0e11] border border-[#2b3139] rounded-sm flex justify-between">
            <span>Escrow: {typeof offer.escrow_deposit_time_limit === 'string'
                ? offer.escrow_deposit_time_limit
                : `${offer.escrow_deposit_time_limit.minutes}m`}</span>
            <span>Payment: {typeof offer.fiat_payment_time_limit === 'string'
                ? offer.fiat_payment_time_limit
                : `${offer.fiat_payment_time_limit.minutes}m`}</span>
          </div>

          {/* Next Steps Note */}
          {!loading && !error && fiatAmount > 0 && (
            <div className="p-3 bg-[#fcd535]/5 border border-[#fcd535]/20 rounded-sm text-[10px] leading-relaxed">
              {offer.offer_type === 'BUY' ? (
                <p className="text-[#fcd535]">
                  <strong>Seller Note:</strong> You must fund the on-chain escrow. 
                  Ensure you have sufficient SOL for gas and {offer.token} for the trade.
                </p>
              ) : (
                <p className="text-[#fcd535]">
                  <strong>Buyer Note:</strong> After the seller funds the escrow, you must 
                  send the fiat payment and confirm on-chain.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="flex-1 border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] rounded-sm font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={Boolean(loading || amountError || insufficient)}
            className="flex-1 bg-[#fcd535] hover:opacity-90 text-[#0b0e11] rounded-sm font-bold"
          >
            Confirm Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function useSellerUsdcBalance(address: string | undefined, open: boolean, amount: string) {
  const [balance, setBalance] = React.useState<bigint | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { primaryWallet } = useDynamicContext();

  React.useEffect(() => {
    if (!address || !open) {
      setBalance(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchBalance = async () => {
      try {
        let chainId: number | undefined = undefined;
        if (primaryWallet?.connector) {
          const networkId = await getNetwork(primaryWallet.connector);
          chainId = typeof networkId === 'number' ? networkId : undefined;
        }
        const bal = await getUsdcBalance(address, chainId);
        if (!cancelled) setBalance(bal);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBalance();

    return () => {
      cancelled = true;
    };
  }, [address, open, amount, primaryWallet]);

  return { balance, loading, error };
}

import { getUsdcBalance } from '@/services/chainService';

export default TradeConfirmationDialog;
