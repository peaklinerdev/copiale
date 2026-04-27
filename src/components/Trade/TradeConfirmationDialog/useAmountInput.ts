import { useState, useEffect, useCallback } from 'react';
import { Offer } from '@/api';
import { formatNumber } from '@/lib/utils';
import { compareUsdcStrings } from '@/utils/money-display';

interface UseAmountInputResult {
  amount: string;
  amountError: string | null;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validateAmount: (value: string) => string | null;
}

/**
 * Custom hook to handle amount input and validation
 */
export const useAmountInput = (offer: Offer, isOpen: boolean): UseAmountInputResult => {
  const [amount, setAmount] = useState<string>('');
  const [amountError, setAmountError] = useState<string | null>(null);

  // Validate amount against min/max/total limits
  const validateAmount = useCallback(
    (value: string): string | null => {
      if (!value) return null;

      // Normalize the user's input to a decimal string and compare exactly
      // against offer min/max/total via scaled BigInt — no float drift.
      // If the input isn't a valid decimal, defer error to form validation.
      try {
        if (compareUsdcStrings(value, offer.min_amount) < 0) {
          return `Amount must be at least ${formatNumber(offer.min_amount)} ${offer.token}`;
        }
        if (compareUsdcStrings(value, offer.max_amount) > 0) {
          return `Amount cannot exceed ${formatNumber(offer.max_amount)} ${offer.token}`;
        }
        if (compareUsdcStrings(value, offer.total_available_amount) > 0) {
          return `Amount exceeds available amount of ${formatNumber(offer.total_available_amount)} ${
            offer.token
          }`;
        }
      } catch {
        // Malformed string; let the form-level regex error path handle it.
        return null;
      }

      return null;
    },
    [offer]
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty input for user to clear and type a new value
    if (value === '') {
      setAmount(value);
      setAmountError(null);
      return;
    }

    // Validate that input is a number with up to 2 decimal places
    const regex = /^\d*\.?\d{0,2}$/;
    if (!regex.test(value)) {
      return;
    }

    // Update the amount state
    setAmount(value);

    // Validate against min/max/total limits
    const error = validateAmount(value);
    setAmountError(error);
  };

  // Set a default amount when the dialog opens
  useEffect(() => {
    if (isOpen && offer && offer.min_amount) {
      setAmount(offer.min_amount);
      setAmountError(validateAmount(offer.min_amount));
    }
  }, [isOpen, offer, validateAmount]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setAmountError(null);
    }
  }, [isOpen]);

  return {
    amount,
    amountError,
    setAmount,
    handleAmountChange,
    validateAmount,
  };
};
