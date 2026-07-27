/**
 * OPSEC: Generates a non-sequential display ID from a UUID.
 * Short 8-char hash that cannot be enumerated or guessed.
 * Falls back to the old sequential format only if no UUID available.
 */
export function formatDisplayId(idOrUuid: number | string | null | undefined, prefix: string = 'CP'): string {
  if (!idOrUuid) return `#${prefix}-?????`;
  // UUID string — use first 8 chars for compact, unguessable display
  if (typeof idOrUuid === 'string' && idOrUuid.length > 16) {
    return `#${prefix}-${idOrUuid.slice(0, 8)}`;
  }
  // Sequential integer fallback (internal use only)
  return `#${prefix}-${String(idOrUuid).padStart(5, '0')}`;
}
