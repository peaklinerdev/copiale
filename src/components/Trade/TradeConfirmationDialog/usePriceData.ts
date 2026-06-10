import { useState, useEffect, useCallback } from 'react';
import { getPrices, PricesResponse } from '@/api';
import { loadFallbackPrices } from '@/lib/priceFallback';

interface UsePriceDataResult {
  priceData: PricesResponse | null;
  loading: boolean;
  error: string | null;
  fetchPriceData: () => Promise<void>;
  isFallback: boolean;
}

/**
 * Custom hook to fetch and manage price data.
 * Falls back to a bundled static JSON when the pricing server is unreachable.
 */
export const usePriceData = (isOpen: boolean): UsePriceDataResult => {
  const [priceData, setPriceData] = useState<PricesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const fetchPriceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsFallback(false);
    try {
      const response = await getPrices();
      if (response?.data?.data?.USDT || response?.data?.data?.USDC) {
        setPriceData(response.data);
        return;
      }
      throw new Error('Invalid price data format');
    } catch (err) {
      console.warn('[usePriceData] Live prices unavailable, trying fallback…', err);
      try {
        const fallback = await loadFallbackPrices();
        setPriceData(fallback);
        setIsFallback(true);
        setError(null);
      } catch (fbErr) {
        console.error('[usePriceData] Fallback also failed:', fbErr);
        setError('Failed to fetch current market prices. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchPriceData();
  }, [isOpen, fetchPriceData]);

  return { priceData, loading, error, fetchPriceData, isFallback };
};
