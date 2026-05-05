import React from 'react';
import { Offer } from '@/api';
import { numericValue } from '@/utils/money-display';
import { ArrowDown } from 'lucide-react';

interface TradeCalculatedValuesProps {
  offer: Offer;
  amount: string;
  fiatAmount: number;
  platformFee: number;
  loading: boolean;
  error: string | null;
}

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Modern swap-style summary — "You pay → You receive" with rate and fee inline
 */
export const TradeCalculatedValues: React.FC<TradeCalculatedValuesProps> = ({
  offer,
  amount,
  fiatAmount,
  platformFee,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className="rounded-sm bg-[#0b0e11]/60 border border-[#2b3139]/30 p-4 space-y-3 animate-pulse">
        <div className="h-4 bg-[#2b3139] rounded w-1/3" />
        <div className="h-8 bg-[#2b3139] rounded" />
        <div className="h-4 bg-[#2b3139] rounded w-2/3" />
      </div>
    );
  }

  if (error || fiatAmount <= 0) return null;

  const feeFlag = import.meta.env.VITE_FEE_FLAG === 'true';
  const amountNum = numericValue(amount);
  const escrowAmount = amountNum + (feeFlag && offer.offer_type === 'BUY' ? platformFee : 0);
  const rate = amountNum > 0 ? fiatAmount / amountNum : 0;
  const isSell = offer.offer_type === 'BUY';

  return (
    <div className="rounded-sm bg-[#0b0e11]/60 border border-[#2b3139]/30 overflow-hidden">
      {/* Rate bar */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#2b3139]/20">
        <span className="text-xs font-medium text-[#848e9c] uppercase tracking-wider">Rate</span>
        <span className="text-xs font-bold text-[#eaecef]">
          1 {offer.token} ≈ {fmt(rate, 4)} {offer.fiat_currency}
        </span>
      </div>

      {/* Swap-style pay/receive */}
      <div className="p-4 space-y-3">
        {/* You pay */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#848e9c]">
            {isSell ? 'You send' : 'You pay'}
          </span>
          <span className="text-sm font-bold text-[#eaecef]">
            {isSell ? `${fmt(amountNum)} ${offer.token}` : `${fmt(fiatAmount)} ${offer.fiat_currency}`}
          </span>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-6 h-6 rounded-full bg-[#2b3139]/50 flex items-center justify-center border border-[#2b3139]/30">
            <ArrowDown size={12} className="text-[#848e9c]" />
          </div>
        </div>

        {/* You receive */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#848e9c]">You receive</span>
          <span className="text-sm font-bold text-[#02c076]">
            {isSell ? `${fmt(fiatAmount)} ${offer.fiat_currency}` : `${fmt(amountNum)} ${offer.token}`}
          </span>
        </div>

        {/* Fee row */}
        {feeFlag && platformFee > 0 && (
          <div className="flex justify-between items-center pt-2 border-t border-[#2b3139]/20">
            <span className="text-xs text-[#848e9c]">
              Platform fee {isSell ? `(${fmt(platformFee)} ${offer.token})` : '(paid by seller)'}
            </span>
            <span className="text-xs text-[#848e9c]">1%</span>
          </div>
        )}

        {/* Escrow note for sellers */}
        {isSell && feeFlag && (
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-[#848e9c]/70">Total escrowed</span>
            <span className="text-[#848e9c]/70">{fmt(escrowAmount)} {offer.token}</span>
          </div>
        )}
      </div>
    </div>
  );
};
