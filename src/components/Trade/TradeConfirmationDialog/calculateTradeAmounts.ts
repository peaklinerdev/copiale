import { Offer, PricesResponse } from '@/api';
import { numericValue } from '@/utils/money-display';

interface CalculateTradeAmountsResult {
  fiatAmount: number;
  platformFee: number;
  error: string | null;
}

/**
 * Calculate fiat amount and platform fee based on token amount and offer details
 */
export const calculateTradeAmounts = (
  amount: string,
  offer: Offer,
  priceData: PricesResponse | null
): CalculateTradeAmountsResult => {
  const result: CalculateTradeAmountsResult = {
    fiatAmount: 0,
    platformFee: 0,
    error: null,
  };

  if (!priceData || !amount) return result;

  try {
    const numAmount = numericValue(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return result;
    }

    // Use the offer's token to look up the price (USDT or USDC)
    const tokenKey = (offer.token === 'USDT' || offer.token === 'USDC') ? offer.token : 'USDT';
    const tokenPrices = priceData.data[tokenKey as keyof typeof priceData.data];
    if (!tokenPrices) {
      result.error = `Price data not available for ${offer.token}`;
      return result;
    }

    const basePrice =
      tokenPrices[offer.fiat_currency as keyof typeof tokenPrices]?.price;
    if (!basePrice) {
      result.error = `Price data not available for ${offer.fiat_currency}`;
      return result;
    }

    // Apply rate adjustment from the offer.
    const baseNum = numericValue(basePrice);
    const rateNum = numericValue(offer.rate_adjustment);
    if (!Number.isFinite(baseNum) || !Number.isFinite(rateNum)) {
      result.error = 'Offer is missing a rate or price — refresh and try again.';
      return result;
    }
    const adjustedPrice = baseNum * rateNum;

    // Calculate fiat amount
    result.fiatAmount = numAmount * adjustedPrice;

    // Calculate platform fee - always 1% of token amount
    result.platformFee = numAmount * 0.01;

    return result;
  } catch (error) {
    console.error('Error calculating amounts:', error);
    result.error = 'Error calculating trade amounts. Please try again.';
    return result;
  }
};
