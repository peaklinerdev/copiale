import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { config } from '../config';
import type {
  Account,
  Offer,
  Trade,
  Escrow,
  PricesResponse,
  TransactionRecord,
  HealthResponse,
} from '../types';
import { assertIdempotencyKey } from './idempotency';
import { toApiError } from './errors';

export { newIdempotencyKey } from './idempotency';
export { ApiError, toApiError, issuesByField } from './errors';
export type { ApiErrorCode, ApiIssue } from './errors';

// Use the API URL from the config file
const API_URL = config.apiUrl;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Optional: Add interceptors for logging or error handling if needed
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // console.log("API Request:", config.method?.toUpperCase(), config.url);
    // Automatically add token from localStorage if available
    const token = localStorage.getItem('jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Mark a request config as already-retried so we don't loop on the same
// 409 retry_conflict more than once.
type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (
      import.meta.env.VITE_DEBUG_IDEMPOTENCY === 'true' &&
      response.headers['idempotent-replayed'] === 'true'
    ) {
      console.debug('[idempotency] replayed cached response for', response.config.url);
    }
    return response;
  },
  async (error: unknown) => {
    const ax = error as AxiosError;
    const status = ax.response?.status;
    const url = ax.config?.url;

    // Suppress noise for the expected /accounts/me 404.
    if (status === 404 && url?.includes('/accounts/me')) {
      console.warn('Account not found - user needs to create their account first');
      return Promise.reject(toApiError(error));
    }

    // 409 retry_conflict: the backend hit a transient pg deadlock and asked
    // us to retry. Honor Retry-After (default 1s), but do it ONCE — same
    // body, same Idempotency-Key (already on the config), no extra
    // amplification.
    const apiErr = toApiError(error);
    if (
      status === 409 &&
      apiErr.code === 'retry_conflict' &&
      ax.config &&
      !(ax.config as RetryableConfig)._retried
    ) {
      const cfg = ax.config as RetryableConfig;
      cfg._retried = true;
      const waitMs = (apiErr.retryAfter ?? 1) * 1000;
      await new Promise((r) => setTimeout(r, waitMs));
      return api.request(cfg);
    }

    // Global toast surfaces (M6). Inline form errors are still rendered by
    // ErrorBanner / issuesByField at the call site; these toasts are for
    // truly cross-cutting failures.
    if (status === 429) {
      const retrySec = apiErr.retryAfter ?? 60;
      toast.error('Rate limit hit', {
        description: `Try again in ${retrySec}s. (ref: ${apiErr.requestId ?? '—'})`,
      });
    } else if (status === 409 && apiErr.code === 'idempotency_key_conflict') {
      // This indicates a frontend bug: same key, different body. Surface
      // loudly so we catch it in dev.
      console.error(
        '[idempotency] key reused with different body — frontend bug',
        apiErr.requestId,
      );
      toast.error('A duplicate request was detected', {
        description: 'Please reload the page.',
      });
    }
    // 409 resource_finalized is left to the calling component to handle
    // (e.g. refetch + navigate); a global toast would be too aggressive
    // since the UI typically updates the underlying state itself.

    console.error('API Error:', status, apiErr.code, apiErr.message, url, apiErr.requestId);
    return Promise.reject(apiErr);
  }
);

// Function to manually set the auth token (if needed elsewhere, though interceptor handles it)
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('jwt_token', token); // Also store in localStorage
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('jwt_token');
  }
};

/**
 * Build a per-request axios config carrying the X-Network-Name header.
 *
 * Network selection used to be a global mutation of
 * `api.defaults.headers.common['X-Network-Name']` wrapped in a try/finally.
 * That raced under concurrent calls — a sibling `withNetworkContext` could
 * overwrite the header mid-flight, and 409 retries dispatched after the
 * await would re-merge from defaults at whatever value happened to be set.
 * The header is now passed per-request so concurrent network-aware calls
 * can't trample each other.
 */
const networkHeaders = (networkName: string) => ({
  headers: { 'X-Network-Name': networkName },
});

// --- Re-export types for backward compatibility ---
export type {
  Account,
  Offer,
  Trade,
  Escrow,
  PriceData,
  PricesResponse,
  Dispute,
  TransactionRecord,
  NetworkStatus,
  ApiVersion,
  HealthResponse,
} from '../types';

// --- API Functions ---

// Accounts API
export const createAccount = (
  data: Partial<Pick<Account, 'wallet_address' | 'username' | 'email'>>
) => api.post<Account>('/accounts', data); // Return full Account object

export const getAccountById = (
  id: number // Use number ID to match actual API
) => api.get<Account>(`/accounts/${id}`);

export const getAccount = () =>
  // Renamed from getMyAccount
  api.get<Account>('/accounts/me');

export const updateAccount = (
  id: number,
  data: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at' | 'wallet_address'>>
) => api.put<Account>(`/accounts/${id}`, data); // Return full Account object

// Offers API
/**
 * Request body for POST /offers per yapbay-api/src/schemas/offers.ts:
 *   - amounts are decimal strings
 *   - rate_adjustment is number on request (responses widen to string)
 *   - creator_account_id REQUIRED
 */
export type CreateOfferRequest = {
  creator_account_id: number;
  offer_type: 'BUY' | 'SELL';
  token?: string;
  fiat_currency?: string;
  min_amount: string;
  max_amount?: string;
  total_available_amount?: string;
  rate_adjustment?: number;
  terms?: string;
  escrow_deposit_time_limit?: string | { minutes: number };
  fiat_payment_time_limit?: string | { minutes: number };
};

export const createOffer = (data: CreateOfferRequest) =>
  api.post<CreateOfferResponse>('/offers', data);

// Define the actual API response structure
interface OffersResponse {
  network: string;
  offers: Offer[];
}

// Define the create offer response structure
interface CreateOfferResponse {
  network: string;
  offer: Offer;
}

// Define the get offer response structure
interface GetOfferResponse {
  network: string;
  offer: Offer;
}

// Define the update offer response structure
interface UpdateOfferResponse {
  network: string;
  offer: Offer;
}

// Define the trades response structure
interface TradesResponse {
  network: string;
  trades: Trade[];
}

/**
 * GET /offers — list offers with optional filters and pagination.
 *
 * Pagination params per yapbay-api/src/schemas/primitives/pagination.ts:
 *   limit: 1..100 (default 25), offset: 0..100_000 (default 0).
 */
export const getOffers = (params?: {
  type?: string;
  token?: string;
  owner?: string;
  limit?: number;
  offset?: number;
}) => api.get<OffersResponse>('/offers', { params });

export const getOfferById = (
  id: number // Use number ID to match actual API
) => api.get<GetOfferResponse>(`/offers/${id}`);

/**
 * Request body for PUT /offers/:id per yapbay-api/src/schemas/offers.ts.
 * All fields optional; backend strict-rejects creator_account_id, id,
 * timestamps, network_id (use COALESCE on supplied fields only).
 */
export type UpdateOfferRequest = Partial<Omit<CreateOfferRequest, 'creator_account_id'>> & {
  offer_type?: 'BUY' | 'SELL';
};

export const updateOffer = (id: number, data: UpdateOfferRequest) =>
  api.put<UpdateOfferResponse>(`/offers/${id}`, data);

export const deleteOffer = (
  id: number // Use number ID to match actual API
) => api.delete<{ message: string }>(`/offers/${id}`);

// Network-aware offer API functions. Each one carries X-Network-Name as a
// per-request header so concurrent callers with different networks can't
// race on a shared default (see networkHeaders comment above).
export const createOfferWithNetwork = (networkName: string, data: CreateOfferRequest) =>
  api.post<CreateOfferResponse>('/offers', data, networkHeaders(networkName));

export const getOffersWithNetwork = (
  networkName: string,
  params?: { type?: string; token?: string; owner?: string; limit?: number; offset?: number }
) => api.get<OffersResponse>('/offers', { params, ...networkHeaders(networkName) });

export const getOfferByIdWithNetwork = (networkName: string, id: number) =>
  api.get<GetOfferResponse>(`/offers/${id}`, networkHeaders(networkName));

export const updateOfferWithNetwork = (
  networkName: string,
  id: number,
  data: UpdateOfferRequest,
) => api.put<UpdateOfferResponse>(`/offers/${id}`, data, networkHeaders(networkName));

export const deleteOfferWithNetwork = (networkName: string, id: number) =>
  api.delete<{ message: string }>(`/offers/${id}`, networkHeaders(networkName));

// Trades API
//
// Response shapes per yapbay-api/src/schemas/trades.ts:
//   POST /trades     -> 201 { network, trade }
//   GET  /trades/:id ->     { network, trade }
//   GET  /trades/my  ->     { network, trades }
type TradeCreateData = { leg1_offer_id: number } & Partial<
  Omit<Trade, 'id' | 'created_at' | 'updated_at'>
>;

interface TradeWrapper {
  network: string;
  trade: Trade;
}

export const createTrade = (data: TradeCreateData) =>
  api.post<TradeWrapper>('/trades', data);

export const getTrades = (params?: { status?: string; user?: string }) =>
  api.get<Trade[]>('/trades', { params });

/** GET /trades/my — paginated; defaults limit=25, offset=0. */
export const getMyTrades = (params?: { limit?: number; offset?: number }) =>
  api.get<TradesResponse>('/trades/my', { params });

export const getTradeById = (id: number) => api.get<TradeWrapper>(`/trades/${id}`);

// Define TradeUpdateData if different from Partial<Trade>
type TradeUpdateData = Partial<Pick<Trade, 'overall_status'>>;
export const updateTrade = (id: number, data: TradeUpdateData) =>
  api.put<Trade>(`/trades/${id}`, data); // Return full Trade object

export const markFiatPaid = (id: number) =>
  api.put<{ id: number }>(`/trades/${id}`, { fiat_paid: true });

// Escrow API
//
// NOTE: the legacy POST endpoints (/escrows/fund, /escrows/release,
// /escrows/cancel, /escrows/dispute, /escrows/mark-fiat-paid) and the
// fetch-by-tradeId GET were stale scaffolding — they were never wired up
// in yapbay-api (verified via `git log -S` across the repo's full
// history). The on-chain lifecycle is implemented client-side in
// `src/services/chainService.ts` via the Anchor program; only the
// recording POST below remains.

/**
 * POST /escrows/record response.
 * Shape matches yapbay-api/src/schemas/escrows.ts `escrowRecordResponseSchema`.
 */
export type RecordEscrowResponse = {
  success: true;
  /** Blockchain escrow ID — STRING (hex for EVM, u64 decimal for Solana). */
  escrowId: string;
  escrowDbId: number; // Database primary key for the escrow record
  txHash: string;
  networkFamily: 'evm' | 'solana';
  blockExplorerUrl: string;
};

/**
 * Solana variant of POST /escrows/record.
 *
 * Per Design Invariant 5: per-family request shapes are separate types,
 * not optional-field unions. Backend strict-rejects EVM fields on Solana
 * requests and vice versa. Mirrors `solanaEscrowRecordSchema` in
 * yapbay-api/src/schemas/escrows.ts.
 */
export type RecordSolanaEscrowRequest = {
  trade_id: number;
  signature: string;
  escrow_id: string;
  seller: string;
  buyer: string;
  amount: string;
  program_id: string;
  escrow_pda: string;
  escrow_token_account: string;
  trade_onchain_id: string;
  sequential?: boolean;
  sequential_escrow_address?: string;
};

/** EVM variant of POST /escrows/record (mirrors `evmEscrowRecordSchema`). */
export type RecordEvmEscrowRequest = {
  trade_id: number;
  transaction_hash: string;
  escrow_id: string;
  seller: string;
  buyer: string;
  amount: string;
  sequential?: boolean;
  sequential_escrow_address?: string;
};

export const recordSolanaEscrow = (
  data: RecordSolanaEscrowRequest,
  idempotencyKey: string,
) => {
  // Per Design Invariant 1: key minted at user-intent time, threaded here.
  assertIdempotencyKey(idempotencyKey);
  return api.post<RecordEscrowResponse>('/escrows/record', data, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
};

export const recordEvmEscrow = (
  data: RecordEvmEscrowRequest,
  idempotencyKey: string,
) => {
  assertIdempotencyKey(idempotencyKey);
  return api.post<RecordEscrowResponse>('/escrows/record', data, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
};

/** GET /escrows/my — paginated; defaults limit=25, offset=0. */
export const getMyEscrows = (params?: { limit?: number; offset?: number }) =>
  api.get<Escrow[]>('/escrows/my', { params });

/**
 * Records a blockchain transaction
 * @param data Transaction data to record
 * @returns Promise with transaction recording response
 */
export const recordTransaction = (data: {
  trade_id: number;
  escrow_id?: number;
  transaction_hash?: string; // EVM only
  signature?: string; // Solana only
  transaction_type:
    | 'CREATE_ESCROW'
    | 'FUND_ESCROW'
    | 'MARK_FIAT_PAID'
    | 'RELEASE_ESCROW'
    | 'CANCEL_ESCROW'
    | 'DISPUTE_ESCROW'
    | 'OPEN_DISPUTE'
    | 'RESPOND_DISPUTE'
    | 'RESOLVE_DISPUTE'
    | 'OTHER';
  from_address: string;
  to_address?: string;
  amount?: string;
  token_type?: string;
  block_number?: number; // EVM only
  slot?: number; // Solana only
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  network_family?: 'evm' | 'solana';
  metadata?: Record<string, string>;
}, idempotencyKey: string) => {
  // Per Design Invariant 1: key minted at user-intent time, threaded here.
  assertIdempotencyKey(idempotencyKey);
  return api.post<{
    success: boolean;
    transactionId: number;
    txHash?: string;
    signature?: string;
    blockNumber?: number;
    slot?: number;
  }>('/transactions/', data, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
};

/**
 * Get transactions for a specific trade
 * @param tradeId The ID of the trade
 * @param type Optional transaction type filter
 * @returns Promise with array of transaction records
 */
export const getTradeTransactions = (tradeId: number, type?: string) =>
  api.get<TransactionRecord[]>(`/transactions/trade/${tradeId}${type ? `?type=${type}` : ''}`);

/**
 * Get all transactions for the authenticated user
 * @param params Optional parameters for filtering and pagination
 * @returns Promise with array of transaction records
 */
export const getUserTransactions = (params?: {
  type?: string;
  limit?: number;
  offset?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.append('type', params.type);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return api.get<TransactionRecord[]>(`/transactions/user${queryString}`);
};

// Prices API
export const getPrices = () => api.get<PricesResponse>('/prices');

// Health API
//
// yapbay-api split health into three endpoints (commit 251a93d):
//   - /health/live  — cheap liveness, always 200 if process is alive
//   - /health/ready — readiness with { status, checks } (200 / 503)
//   - /health       — full aggregate (table counts, RPC ping, version)
//
// Use getLiveness for indicator dots; getHealth only for the Status page.

export type LivenessResponse = {
  status: 'ok';
  timestamp: string;
};

export type ReadinessResponse = {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  checks: {
    db?: { status: string };
    listener?: { status: string };
    rpc?: { status: string };
  };
};

export const getLiveness = () => api.get<LivenessResponse>('/health/live');
export const getReadiness = () => api.get<ReadinessResponse>('/health/ready');
export const getHealth = () => api.get<HealthResponse>('/health');

// Export the api instance for use elsewhere
export default api;
