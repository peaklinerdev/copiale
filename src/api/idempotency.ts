// Idempotency key minting + validation.
//
// Per Design Invariant 1: keys are minted at user-intent time
// (in the submit handler / service method), NOT inside the HTTP layer.
// One click = one UUIDv4, used for every retry attempt.
//
// `crypto.randomUUID()` requires a secure context. We provide a v4 fallback
// for non-secure dev previews (older Safari, http://192.x previews) so the
// migration doesn't break in those environments. The fallback shape matches
// the regex enforced by yapbay-api/src/middleware/idempotency.ts:34.

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function randomBytes(n: number): Uint8Array {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return crypto.getRandomValues(new Uint8Array(n));
  }
  // Last-resort fallback. Math.random is NOT cryptographically secure, but
  // an idempotency key only needs to be uniquely random across one user's
  // requests within a 24h TTL — collision probability remains negligible.
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  return out;
}

function fallbackUuidV4(): string {
  const b = randomBytes(16);
  // Per RFC 4122 section 4.4: set version (4) and variant (10).
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex
    .slice(8, 10)
    .join('')}-${hex.slice(10, 16).join('')}`;
}

/**
 * Mint a fresh UUIDv4 idempotency key.
 *
 * Call ONCE per user intent. Reuse the returned key across all retries
 * (network failure, token refresh, tab refresh) for the same intent —
 * the backend dedupes within a 24h TTL.
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return fallbackUuidV4();
}

/**
 * Throws if the key isn't a valid UUIDv4. Use at API call sites that
 * require an idempotency key — surfaces caller bugs early instead of
 * deferring to a 400 from the server.
 */
export function assertIdempotencyKey(key: unknown): asserts key is string {
  if (typeof key !== 'string' || !UUID_V4.test(key)) {
    throw new Error(
      'idempotency key required at call site (UUIDv4). Mint via newIdempotencyKey() in your submit handler.',
    );
  }
}
