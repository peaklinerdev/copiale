// Convert any thrown value to a human-readable error string.
//
// New error envelope from yapbay-api (commit fc47285):
//   { error: { code, message, details: { request_id, ... }, issues?, fields? } }
// Falls back to the legacy `data.message` shape for the migration window
// (axios may still hold legacy errors thrown before M2 landed).

import { ApiError, toApiError } from '../api/errors';

/** User-friendly messages for known error codes (M6). */
const FRIENDLY: Partial<Record<string, string>> = {
  resource_finalized:
    'This trade is already finalized. The page will refresh shortly with the latest state.',
  referenced_resource_missing: 'A referenced item could not be found. Please refresh and retry.',
  retry_conflict: 'The system was busy. Please try again.',
  missing_idempotency_key: 'Internal: missing idempotency key. Please reload the page.',
  rate_limited: 'You are sending requests too quickly. Please wait a moment.',
};

/**
 * Format an error for display. Returns just the message; for richer data
 * (issues[], requestId, retryAfter), use `toApiError(err)` directly.
 */
export function handleApiError(error: unknown, defaultMessage: string): string {
  const apiErr = error instanceof ApiError ? error : toApiError(error);
  const friendly = FRIENDLY[apiErr.code];
  if (friendly) return friendly;
  if (apiErr.message) return apiErr.message;
  return defaultMessage;
}
