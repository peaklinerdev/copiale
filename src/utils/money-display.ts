// Display-only money formatters.
//
// Per Design Invariant 3: this file is the ONLY place allowed to call
// `Number(...)`, `parseFloat(...)`, `.toFixed`, or `/1_000_000` on an
// amount value. All inputs are decimal strings; all outputs are decimal
// strings ready to render. Never feed these results back into an API
// request — use utils/amounts.ts for that.

/** Format a token (USDT/USDC) decimal string to N display digits with thousands separators. */
export function formatTokenForDisplay(s: string | null | undefined, dp = 2): string {
  if (s === null || s === undefined || s === '') return '—';
  const n = Number(s); // safe: display only
  if (!Number.isFinite(n)) return s;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

/** Format a fiat decimal string to N display digits. */
export function formatFiatForDisplay(s: string | null | undefined, dp = 2): string {
  if (s === null || s === undefined || s === '') return '—';
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

/** Convert a scaled-micro token value (number or bigint) to display string. */
export function microToDisplay(micro: number | bigint, dp = 2): string {
  if (typeof micro === 'bigint') {
    const n = Number(micro) / 1_000_000;
    return formatTokenForDisplay(n.toString(), dp);
  }
  if (!Number.isFinite(micro)) return '—';
  const v = micro / 1_000_000;
  return formatTokenForDisplay(v.toString(), dp);
}

/**
 * Read an amount that might still be a number from legacy code paths and
 * coerce to a decimal string for display.
 */
export function legacyAmountToDisplay(
  v: string | number | null | undefined,
  dp = 2,
): string {
  if (v === null || v === undefined) return '—';
  return formatTokenForDisplay(typeof v === 'number' ? v.toString() : v, dp);
}

/**
 * Convert a decimal-string amount to a number for display-side comparison.
 */
export function numericValue(
  s: string | number | bigint | null | undefined,
): number {
  if (s === null || s === undefined) return NaN;
  if (typeof s === 'number') return s;
  if (typeof s === 'bigint') return Number(s);
  return Number(s);
}

/**
 * Compare two token decimal strings. Returns -1, 0, or 1.
 */
export function compareTokenStrings(a: string, b: string): -1 | 0 | 1 {
  const toMicro = (s: string): bigint => {
    const [i, f = ''] = s.split('.');
    const padded = f.padEnd(6, '0').slice(0, 6);
    return BigInt(i || '0') * 1_000_000n + BigInt(padded || '0');
  };
  const av = toMicro(a);
  const bv = toMicro(b);
  if (av < bv) return -1;
  if (av > bv) return 1;
  return 0;
}

// Keep backward compatibility for now
export const formatUsdcForDisplay = formatTokenForDisplay;
export const compareUsdcStrings = compareTokenStrings;
