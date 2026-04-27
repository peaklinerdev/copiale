// Money primitives for the request boundary.
//
// Per Design Invariant 3: amounts are strings on the money path; numbers
// only inside `utils/money-display.ts`. The backend Zod schemas at
// yapbay-api/src/schemas/primitives/amounts.ts enforce:
//   - USDC: regex /^(0|[1-9]\d*)(\.\d{1,6})?$/, > 0
//   - escrow USDC: same plus <= 100.000000
//   - fiat:  regex /^(0|[1-9]\d*)(\.\d{1,2})?$/, > 0
//
// These helpers normalize at the boundary. Pass the result straight into
// the request body.

const USDC_DP = 6;
const FIAT_DP = 2;
const ESCROW_USDC_MAX_MICRO = 100n * 10n ** BigInt(USDC_DP);

const USDC_REGEX = /^(0|[1-9]\d*)(\.\d{1,6})?$/;
const FIAT_REGEX = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

function normalizeDecimalString(input: string, decimals: number): string {
  // Strip leading + and any whitespace; reject if it looks malformed.
  const s = input.trim().replace(/^\+/, '');
  if (s === '' || s === '.' || s.startsWith('-')) {
    throw new RangeError(`amount must be a positive decimal: "${input}"`);
  }
  const [intPart, fracPartRaw = ''] = s.split('.');
  if (intPart.length === 0 || !/^\d+$/.test(intPart)) {
    throw new RangeError(`amount has invalid integer part: "${input}"`);
  }
  // Strip leading zeros except the single "0" before a decimal.
  const intNorm = intPart.replace(/^0+(\d)/, '$1');
  const fracPart = fracPartRaw.replace(/0+$/, '');
  if (fracPart.length > decimals) {
    throw new RangeError(`amount exceeds ${decimals} decimal places: "${input}"`);
  }
  // Disallow scientific notation, hex, etc.
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
 * Convert any reasonable input (string, number, bigint) to a canonical USDC
 * decimal string suitable for sending to the API.
 *
 * Throws at the boundary on malformed/zero/negative input — callers should
 * validate at form level and only call this when ready to send.
 */
export function toUsdcString(input: string | number | bigint): string {
  let raw: string;
  if (typeof input === 'bigint') {
    raw = input.toString();
  } else if (typeof input === 'number') {
    if (!Number.isFinite(input)) {
      throw new RangeError(`amount must be finite: ${input}`);
    }
    // Format with full 6dp precision then trim trailing zeros via normalize.
    raw = input.toFixed(USDC_DP);
  } else {
    raw = input;
  }
  const norm = normalizeDecimalString(raw, USDC_DP);
  if (!USDC_REGEX.test(norm)) {
    throw new RangeError(`USDC amount failed validation: "${input}" -> "${norm}"`);
  }
  if (toScaled(norm, USDC_DP) <= 0n) {
    throw new RangeError(`USDC amount must be > 0: "${input}"`);
  }
  return norm;
}

/**
 * Same as toUsdcString but enforces the escrow contract cap of 100.000000.
 * Use for any field destined for the escrows table (record-escrow amount,
 * etc.).
 */
export function toEscrowUsdcString(input: string | number | bigint): string {
  const s = toUsdcString(input);
  if (toScaled(s, USDC_DP) > ESCROW_USDC_MAX_MICRO) {
    throw new RangeError(`escrow USDC amount must be <= 100.000000: "${input}"`);
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
 * Convert a scaled-micro USDC bigint (e.g. on-chain balance, 1.5 USDC = 1_500_000n)
 * to a canonical 6dp decimal string.
 */
export function microToUsdcString(micro: bigint): string {
  if (micro < 0n) throw new RangeError('micro USDC must be non-negative');
  const div = 10n ** BigInt(USDC_DP);
  const intPart = micro / div;
  const fracPart = micro % div;
  if (fracPart === 0n) return intPart.toString();
  const fracStr = fracPart.toString().padStart(USDC_DP, '0').replace(/0+$/, '');
  return `${intPart}.${fracStr}`;
}
