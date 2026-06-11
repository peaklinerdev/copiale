// Money primitives for the request boundary.
//
// Per Design Invariant 3: amounts are strings on the money path; numbers
// only inside `utils/money-display.ts`.

const TOKEN_DP = 6; // Standard for USDC/USDT on Solana
const FIAT_DP = 2;
const ESCROW_TOKEN_MAX_MICRO = 10000n * 10n ** BigInt(TOKEN_DP);

const TOKEN_REGEX = /^(0|[1-9]\d*)(\.\d{1,6})?$/;
const FIAT_REGEX = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

function normalizeDecimalString(input: string, decimals: number): string {
  const s = input.trim().replace(/^\+/, '');
  if (s === '' || s === '.' || s.startsWith('-')) {
    throw new RangeError(`amount must be a positive decimal: "${input}"`);
  }
  const [intPart, fracPartRaw = ''] = s.split('.');
  if (intPart.length === 0 || !/^\d+$/.test(intPart)) {
    throw new RangeError(`amount has invalid integer part: "${input}"`);
  }
  const intNorm = intPart.replace(/^0+(\d)/, '$1');
  const fracPart = fracPartRaw.replace(/0+$/, '');
  if (fracPart.length > decimals) {
    throw new RangeError(`amount exceeds ${decimals} decimal places: "${input}"`);
  }
  if (/[eExX]/.test(fracPartRaw)) {
    throw new RangeError(`amount must be plain decimal, not scientific: "${input}"`);
  }
  return fracPart.length > 0 ? `${intNorm}.${fracPart}` : intNorm;
}

function toScaled(s: string, decimals: number): bigint {
  const [intPart, fracPart = ''] = s.split('.');
  const padded = fracPart.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(intPart) * 10n ** BigInt(decimals) + BigInt(padded || '0');
}

/**
 * Convert any reasonable input (string, number, bigint) to a canonical token
 * decimal string suitable for sending to the API.
 */
export function toTokenString(input: string | number | bigint): string {
  let raw: string;
  if (typeof input === 'bigint') {
    raw = input.toString();
  } else if (typeof input === 'number') {
    if (!Number.isFinite(input)) {
      throw new RangeError(`amount must be finite: ${input}`);
    }
    raw = input.toFixed(TOKEN_DP);
  } else {
    raw = input;
  }
  const norm = normalizeDecimalString(raw, TOKEN_DP);
  if (!TOKEN_REGEX.test(norm)) {
    throw new RangeError(`Token amount failed validation: "${input}" -> "${norm}"`);
  }
  if (toScaled(norm, TOKEN_DP) <= 0n) {
    throw new RangeError(`Token amount must be > 0: "${input}"`);
  }
  return norm;
}

/**
 * Same as toTokenString but enforces the escrow contract cap of 10,000.000000.
 */
export function toEscrowTokenString(input: string | number | bigint): string {
  const s = toTokenString(input);
  if (toScaled(s, TOKEN_DP) > ESCROW_TOKEN_MAX_MICRO) {
    throw new RangeError(`escrow amount must be <= 10,000.000000: "${input}"`);
  }
  return s;
}

/** Convert any input to a canonical fiat decimal string (2dp, > 0). */
export function toFiatString(input: string | number | bigint): string {
  let raw: string;
  if (typeof input === 'bigint') {
    raw = input.toString();
  } else if (typeof input === 'number') {
    if (!Number.isFinite(input)) {
      throw new RangeError(`fiat must be finite: ${input}`);
    }
    raw = input.toFixed(FIAT_DP);
  } else {
    raw = input;
  }
  const norm = normalizeDecimalString(raw, FIAT_DP);
  if (!FIAT_REGEX.test(norm)) {
    throw new RangeError(`fiat amount failed validation: "${input}" -> "${norm}"`);
  }
  if (toScaled(norm, FIAT_DP) <= 0n) {
    throw new RangeError(`fiat amount must be > 0: "${input}"`);
  }
  return norm;
}

/**
 * Convert a scaled-micro token bigint to a canonical 6dp decimal string.
 */
export function microToTokenString(micro: bigint): string {
  if (micro < 0n) throw new RangeError('micro token must be non-negative');
  const div = 10n ** BigInt(TOKEN_DP);
  const intPart = micro / div;
  const fracPart = micro % div;
  if (fracPart === 0n) return intPart.toString();
  const fracStr = fracPart.toString().padStart(TOKEN_DP, '0').replace(/0+$/, '');
  return `${intPart}.${fracStr}`;
}

// Keep backward compatibility for now
export const toUsdcString = toTokenString;
export const toEscrowUsdcString = toEscrowTokenString;
export const microToUsdcString = microToTokenString;
