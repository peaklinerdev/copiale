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
import { Offer } from '@/api';
import { numericValue } from '@/utils/money-display';
import { Zap, Clock, AlertTriangle } from 'lucide-react';

import { useTradeConfirmation } from './useTradeConfirmation';
import { TradeCalculatedValues } from './TradeCalculatedValues';
import { QUICK_PRESETS } from './useAmountInput';
import { useDynamicContext, getNetwork } from '@dynamic-labs/sdk-react-core';
import { getUsdcBalance } from '@/services/chainService';

interface TradeConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer;
  onConfirm: (leg1_offer_id: number, leg1_crypto_amount: string, leg1_fiat_amount: number) => void;
  triggerButton?: React.ReactNode;
}

const TradeConfirmationDialog = ({
  isOpen,
  onOpenChange,
  offer,
  onConfirm,
  triggerButton,
}: TradeConfirmationDialogProps) => {
  const { primaryWallet } = useDynamicContext();
  const isSeller = offer.offer_type === 'BUY' && !!primaryWallet?.address;
  const isBuy = offer.offer_type === 'SELL';

  const {
    balance: usdcBalance,
    loading: usdcLoading,
    error: usdcError,
  } = useSellerUsdcBalance(isSeller ? primaryWallet?.address : undefined, isOpen, '');

  const usdcBalanceNum = usdcBalance !== null ? Number(usdcBalance) / 1e6 : null;
  const maxFromBalance = isSeller && usdcBalanceNum !== null ? Math.floor(usdcBalanceNum * 1e6 / 1.01) / 1e6 : undefined;

  const {
    amount,
    amountError,
    loading,
    error,
    fiatAmount,
    platformFee,
    handleAmountChange,
    setQuickAmount,
    handleConfirm,
  } = useTradeConfirmation(isOpen, offer, onConfirm, maxFromBalance);

  const amountToEscrow = numericValue(amount);
  const insufficient =
    isSeller &&
    usdcBalanceNum !== null &&
    !usdcLoading &&
    !usdcError &&
    amountToEscrow > 0 &&
    usdcBalanceNum < Math.round(amountToEscrow * 1.01 * 1e6) / 1e6;

  const canConfirm = !loading && !amountError && !insufficient && fiatAmount > 0 && amount !== '';
  const rateNum = numericValue(offer.rate_adjustment);
  const rateLabel = rateNum > 1 ? 'above' : rateNum < 1 ? 'below' : 'at';

  const escrowMin = typeof offer.escrow_deposit_time_limit === 'object'
    ? offer.escrow_deposit_time_limit.minutes
    : parseInt(String(offer.escrow_deposit_time_limit)) || 0;
  const payMin = typeof offer.fiat_payment_time_limit === 'object'
    ? offer.fiat_payment_time_limit.minutes
    : parseInt(String(offer.fiat_payment_time_limit)) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className="bg-[#1e2329] border border-[#2b3139] text-[#eaecef] max-w-md w-full rounded-sm p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-sm flex items-center justify-center ${
              isBuy ? 'bg-[#02c076]/10' : 'bg-[#f84960]/10'
            }`}>
              <Zap size={16} className={isBuy ? 'text-[#02c076]' : 'text-[#f84960]'} />
            </div>
            <div>
              <DialogTitle className="text-[#eaecef] text-base font-bold">
                {isBuy ? `Buy ${offer.token}` : `Sell ${offer.token}`}
              </DialogTitle>
              <DialogDescription className="text-[#848e9c] text-xs">
                {isBuy ? 'You pay fiat, you receive crypto' : 'You send crypto, you receive fiat'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 space-y-4 pb-2">
          {/* Rate pill */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#848e9c]">Priced {rateLabel} market</span>
            <span className={`font-bold ${
              rateNum > 1 ? 'text-[#02c076]' : rateNum < 1 ? 'text-[#f84960]' : 'text-[#848e9c]'
            }`}>
              {rateNum > 1
                ? `+${((rateNum - 1) * 100).toFixed(1)}%`
                : rateNum < 1
                ? `-${((1 - rateNum) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>

          {/* Amount input */}
          <div className="space-y-3">
            <div className="relative">
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className={`bg-[#0b0e11] border-2 text-[#eaecef] rounded-sm text-xl font-bold h-14 pl-4 pr-16
                  focus-visible:ring-0 focus-visible:border-[#FF6B00]/50
                  ${amountError ? 'border-[#f84960]' : 'border-[#2b3139]'}`}
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#848e9c]">
                {offer.token}
              </span>
            </div>

            {/* Quick presets */}
            <div className="flex gap-1.5">
              {QUICK_PRESETS.map((pct) => {
                const labels = ['Min', '25%', '50%', '75%', 'Max'];
                const idx = QUICK_PRESETS.indexOf(pct);
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setQuickAmount(pct)}
                    className="flex-1 text-[10px] font-bold text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] bg-[#0b0e11] border border-[#2b3139]/50 rounded-sm py-1.5 transition-colors"
                  >
                    {labels[idx]}
                  </button>
                );
              })}
            </div>

            {/* Balance / error */}
            <div className="min-h-[20px]">
              {isSeller && usdcBalanceNum !== null && (
                <span className="text-[11px] text-[#848e9c]">
                  Balance:{' '}
                  <span className={insufficient ? 'text-[#f84960] font-bold' : 'text-[#eaecef]'}>
                    {usdcBalanceNum.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </span>{' '}
                  {offer.token}
                </span>
              )}
              {amountError && (
                <div className="text-[11px] font-medium text-[#f84960] mt-0.5">{amountError}</div>
              )}
              {insufficient && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-[#f84960]">
                  <AlertTriangle size={12} />
                  Insufficient balance
                </div>
              )}
            </div>
          </div>

          {/* Calculated values card */}
          <TradeCalculatedValues
            offer={offer}
            amount={amount}
            fiatAmount={fiatAmount}
            platformFee={platformFee}
            loading={loading}
            error={error}
          />

          {/* Time limits */}
          <div className="flex items-center gap-4 text-[11px] text-[#848e9c] py-1">
            <Clock size={12} className="shrink-0" />
            <span>Escrow: <span className="text-[#eaecef]">{escrowMin}m</span></span>
            <span>·</span>
            <span>Payment: <span className="text-[#eaecef]">{payMin}m</span></span>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-6 pt-2 flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] hover:text-[#eaecef] rounded-sm font-medium h-11"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 bg-[#FF6B00] hover:opacity-90 disabled:opacity-40 !text-[#0b0e11] rounded-sm font-bold h-11"
          >
            {loading ? 'Loading price…' : 'Confirm Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ── USDC balance fetcher for sellers ── */
function useSellerUsdcBalance(address: string | undefined, open: boolean, amount: string) {
  const [balance, setBalance] = React.useState<bigint | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { primaryWallet } = useDynamicContext();
  const connector = primaryWallet?.connector;

  React.useEffect(() => {
    if (!address || !open) { setBalance(null); setError(null); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        let chainId: number | undefined;
        if (connector) {
          const networkId = await getNetwork(connector);
          chainId = typeof networkId === 'number' ? networkId : undefined;
        }
        const bal = await getUsdcBalance(address, chainId);
        if (!cancelled) setBalance(bal);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [address, open, amount, connector]);

  return { balance, loading, error };
}

export default TradeConfirmationDialog;
