// Structured API error from copiale-p2p-api's new error envelope:
//   { error: { code, message, details: { request_id, ... }, issues?, fields? } }
//
// Use `toApiError(err)` to turn an unknown thrown value (axios error, network
// failure, etc.) into an ApiError; use `issuesByField(err)` to render
// per-field validation errors from the Zod issues array.

import type { AxiosError } from 'axios';

export type ApiErrorCode =
  | 'validation_error'
  | 'missing_idempotency_key'
  | 'idempotency_key_conflict'
  | 'resource_finalized'
  | 'referenced_resource_missing'
  | 'retry_conflict'
  | 'conflict'
  | 'invalid_value'
  | 'missing_field'
  | 'not_found'
  | 'unauthorized'
  | 'forbidden'
  | 'rate_limited'
  | 'unknown';

export interface ApiIssue {
  code: string;
  message: string;
  /** e.g. "body.amount", "query.limit", "params.id". */
  path: string;
  expected?: string;
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: {
      request_id?: string;
      timestamp?: string;
      path?: string;
      method?: string;
      retry_after?: number | null;
    };
    issues?: ApiIssue[];
    fields?: string[];
  };
  // Legacy shape, kept as fallback during the migration window.
  message?: string;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number | undefined;
  readonly requestId: string | undefined;
  readonly issues: ApiIssue[];
  readonly fields: string[];
  readonly retryAfter: number | undefined;

  constructor(opts: {
    code: ApiErrorCode;
    message: string;
    status?: number;
    requestId?: string;
    issues?: ApiIssue[];
    fields?: string[];
    retryAfter?: number;
  }) {
    super(opts.message);
    this.name = 'ApiError';
    this.code = opts.code;
    this.status = opts.status;
    this.requestId = opts.requestId;
    this.issues = opts.issues ?? [];
    this.fields = opts.fields ?? [];
    this.retryAfter = opts.retryAfter;
  }
}

function isApiErrorBody(v: unknown): v is ApiErrorBody {
  return typeof v === 'object' && v !== null;
}

/**
 * Convert any thrown value (axios error, generic Error, string) into an
 * ApiError. Reads the new error envelope first; falls back to legacy
 * `data.message` for the migration window.
 */
export function toApiError(err: unknown): ApiError {
  // Already an ApiError — pass through.
  if (err instanceof ApiError) return err;

  // Axios error.
  const ax = err as AxiosError<ApiErrorBody>;
  if (ax && typeof ax === 'object' && 'isAxiosError' in ax && ax.isAxiosError) {
    const status = ax.response?.status;
    const headers = ax.response?.headers as Record<string, string | undefined> | undefined;
    const requestId =
      headers?.['x-request-id'] ?? headers?.['X-Request-Id'] ?? undefined;
    const body = ax.response?.data;
    const e = isApiErrorBody(body) ? body.error : undefined;

    // e can be a string (e.g. { error: "No token provided" }) or an object with .message
    const errMsg: string | undefined =
      typeof e === 'string' ? e : e?.message;
    const message =
      errMsg ?? (isApiErrorBody(body) ? body.message : undefined) ?? ax.message ?? 'Request failed';
    const code =
      (typeof e === 'object' ? (e?.code as ApiErrorCode | undefined) : undefined)
      ?? statusToCode(status) ?? 'unknown';

    let retryAfter: number | undefined =
      typeof e?.details?.retry_after === 'number' ? e.details.retry_after : undefined;
    const headerRetry = headers?.['retry-after'];
    if (retryAfter === undefined && headerRetry) {
      const n = Number(headerRetry);
      if (Number.isFinite(n)) retryAfter = n;
    }

    return new ApiError({
      code,
      message,
      status,
      requestId,
      issues: e?.issues,
      fields: e?.fields,
      retryAfter,
    });
  }

  if (err instanceof Error) {
    return new ApiError({ code: 'unknown', message: err.message });
  }

  return new ApiError({ code: 'unknown', message: String(err) });
}

function statusToCode(status: number | undefined): ApiErrorCode | undefined {
  switch (status) {
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 429:
      return 'rate_limited';
    default:
      return undefined;
  }
}

/**
 * Group Zod validation issues by their target field, stripping the
 * `body.|query.|params.|headers.` prefix so forms can match by field name.
 *
 * Example: `body.min_amount` -> `{ min_amount: ['must be a string', ...] }`.
 */
export function issuesByField(err: ApiError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const stripped = issue.path.replace(/^(body|query|params|headers)\./, '');
    const key = stripped || '_root';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
