import { useState, useEffect, useCallback } from 'react';
import { Offer, PricesResponse } from '@/api';
import { usePriceData } from './usePriceData';
import { useAmountInput } from './useAmountInput';
import { calculateTradeAmounts } from './calculateTradeAmounts';
import { confirmTrade } from './validateAndConfirmTrade';

interface UseTradeConfirmationResult {
  amount: string;
  amountError: string | null;
  priceData: PricesResponse | null;
  loading: boolean;
  error: string | null;
  fiatAmount: number;
  platformFee: number;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setQuickAmount: (pct: number) => void;
  handleConfirm: () => void;
  setError: (error: string | null) => void;
}

export const useTradeConfirmation = (
  isOpen: boolean,
  offer: Offer,
  onConfirm: (leg1_offer_id: number, leg1_crypto_amount: string, leg1_fiat_amount: number) => void
): UseTradeConfirmationResult => {
  const { priceData, loading, error } = usePriceData(isOpen);
  const { amount, amountError, handleAmountChange, setQuickAmount } = useAmountInput(offer, isOpen);

  const [fiatAmount, setFiatAmount] = useState<number>(0);
  const [platformFee, setPlatformFee] = useState<number>(0);
  const [localError, setLocalError] = useState<string | null>(null);

  const combinedError = error || localError;

  const calculateAmounts = useCallback(() => {
    if (!priceData || !amount) return;
    const result = calculateTradeAmounts(amount, offer, priceData);
    setFiatAmount(result.fiatAmount);
    setPlatformFee(result.platformFee);
    if (result.error) setLocalError(result.error);
  }, [amount, priceData, offer]);

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      calculateAmounts();
    }
  }, [amount, priceData, calculateAmounts]);

  const handleConfirm = () => {
    confirmTrade(amount, offer, fiatAmount, onConfirm, setLocalError);
  };

  return {
    amount,
    amountError,
    priceData,
    loading,
    error: combinedError,
    fiatAmount,
    platformFee,
    handleAmountChange,
    setQuickAmount,
    handleConfirm,
    setError: setLocalError,
  };
};
