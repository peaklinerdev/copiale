import { Offer } from '@/api';
import { formatNumber } from '@/lib/utils';
import { compareUsdcStrings } from '@/utils/money-display';

interface ValidateTradeResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validate trade parameters before confirming
 */
export const validateTrade = (amount: string, offer: Offer): ValidateTradeResult => {
  const result: ValidateTradeResult = {
    isValid: true,
    error: null,
  };

  if (!amount) {
    result.isValid = false;
    result.error = 'Please enter a valid amount';
    return result;
  }

  // Compare via scaled BigInt — no float drift, exact decimal comparison.
  try {
    if (compareUsdcStrings(amount, '0') <= 0) {
      result.isValid = false;
      result.error = 'Please enter a valid amount';
      return result;
    }
    if (compareUsdcStrings(amount, offer.min_amount) < 0) {
      result.isValid = false;
      result.error = `Amount must be at least ${formatNumber(offer.min_amount)} ${offer.token}`;
      return result;
    }
    if (compareUsdcStrings(amount, offer.max_amount) > 0) {
      result.isValid = false;
      result.error = `Amount cannot exceed ${formatNumber(offer.max_amount)} ${offer.token}`;
      return result;
    }
    if (compareUsdcStrings(amount, offer.total_available_amount) > 0) {
      result.isValid = false;
      result.error = `Amount exceeds available amount of ${formatNumber(
        offer.total_available_amount,
      )} ${offer.token}`;
      return result;
    }
  } catch {
    result.isValid = false;
    result.error = 'Please enter a valid amount';
    return result;
  }

  return result;
};

/**
 * Validate and confirm trade if valid.
 *
 * The amount string has already been validated against the offer bounds
 * via `compareUsdcStrings` (BigInt-scaled exact comparison). Pass it
 * through unchanged — running it through `parseFloat` and `.toString()`
 * here would introduce a float roundtrip the rest of the money path is
 * specifically designed to avoid (Design Invariant 3). Final wire-format
 * conversion happens in `tradeService.ts` via `toUsdcString` /
 * `toFiatString`, which round-trips through bigint-scaled decimals.
 */
export const confirmTrade = (
  amount: string,
  offer: Offer,
  fiatAmount: number,
  onConfirm: (leg1_offer_id: number, leg1_crypto_amount: string, leg1_fiat_amount: number) => void,
  setError: (error: string | null) => void
): boolean => {
  const validation = validateTrade(amount, offer);

  if (!validation.isValid) {
    setError(validation.error);
    return false;
  }

  if (!fiatAmount || fiatAmount <= 0) {
    setError('Calculating trade amounts — please wait a moment and try again.');
    return false;
  }

  // Round fiat to 2 decimals before passing to the wire
  const roundedFiat = Math.round(fiatAmount * 100) / 100;
  onConfirm(offer.id, amount, roundedFiat);
  return true;
};
