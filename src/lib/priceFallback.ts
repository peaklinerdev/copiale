import type { PricesResponse } from '@/api';

/**
 * Loads the bundled static price fallback from /prices-fallback.json.
 * Used when the live pricing server is unreachable.
 *
 * The fallback file lives in public/ so it's served by Vite/nginx at runtime
 * (no import-time bundling — keeps the payload fresh on deploy).
 */
export async function loadFallbackPrices(): Promise<PricesResponse> {
  const res = await fetch('/prices-fallback.json');
  if (!res.ok) throw new Error(`Fallback HTTP ${res.status}`);
  const json = await res.json();

  // The fallback shape is the same as the live API response envelope
  if (!json?.data?.USDC) {
    throw new Error('Fallback price data is malformed');
  }

  return json as PricesResponse;
}
