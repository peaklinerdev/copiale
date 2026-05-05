import { useState, useEffect, useCallback } from 'react';
import { Offer } from '@/api';
import { compareUsdcStrings } from '@/utils/money-display';
import { numericValue } from '@/utils/money-display';

interface UseAmountInputResult {
  amount: string;
  amountError: string | null;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setQuickAmount: (pct: number) => void;
  validateAmount: (value: string) => string | null;
}

const QUICK_PRESETS = [0, 0.25, 0.5, 0.75, 1] as const; // 0 = min, 1 = max

/**
 * Custom hook to handle amount input and validation
 * — limited to 2 decimal places for USDC trading amounts
 */
export const useAmountInput = (offer: Offer, isOpen: boolean): UseAmountInputResult => {
  const [amount, setAmount] = useState<string>('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [hasUserEdited, setHasUserEdited] = useState(false);

  const validateAmount = useCallback(
    (value: string): string | null => {
      if (!value) return null;
      try {
        if (compareUsdcStrings(value, '0') <= 0) return 'Enter an amount';
        if (compareUsdcStrings(value, offer.min_amount) < 0) {
          return `Min ${numericValue(offer.min_amount).toFixed(2)} ${offer.token}`;
        }
        if (compareUsdcStrings(value, offer.max_amount) > 0) {
          return `Max ${numericValue(offer.max_amount).toFixed(2)} ${offer.token}`;
        }
        if (compareUsdcStrings(value, offer.total_available_amount) > 0) {
          return `Only ${numericValue(offer.total_available_amount).toFixed(2)} ${offer.token} available`;
        }
      } catch {
        return null;
      }
      return null;
    },
    [offer]
  );

  // Set a quick amount by percentage of min→max range
  const setQuickAmount = useCallback(
    (pct: number) => {
      const min = numericValue(offer.min_amount);
      const max = Math.min(
        numericValue(offer.max_amount),
        numericValue(offer.total_available_amount)
      );
      const val = pct === 0 ? min : pct === 1 ? max : min + (max - min) * pct;
      const rounded = val.toFixed(2);
      setAmount(rounded);
      setAmountError(validateAmount(rounded));
      setHasUserEdited(true);
    },
    [offer, validateAmount]
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHasUserEdited(true);

    if (value === '') {
      setAmount('');
      setAmountError(null);
      return;
    }

    // Only allow digits and one dot, up to 2 decimal places
    if (!/^\d*\.?\d{0,2}$/.test(value)) return;

    setAmount(value);
    setAmountError(validateAmount(value));
  };

  // Set default min amount on open (only if user hasn't edited)
  useEffect(() => {
    if (isOpen && offer?.min_amount) {
      setAmount(offer.min_amount);
      setAmountError(validateAmount(offer.min_amount));
      setHasUserEdited(false);
    }
    if (!isOpen) {
      setAmount('');
      setAmountError(null);
      setHasUserEdited(false);
    }
  }, [isOpen, offer, validateAmount]);

  return {
    amount,
    amountError,
    setAmount,
    handleAmountChange,
    setQuickAmount,
    validateAmount,
  };
};

export { QUICK_PRESETS };
