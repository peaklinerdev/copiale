import axios from 'axios';
import { config } from '../config';

const ADMIN_TOKEN_KEY = 'admin_jwt_token';

const adminApi = axios.create({
  baseURL: config.apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use(
  (cfg) => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token && cfg.headers) {
      cfg.headers.Authorization = `Bearer ${token}`;
    }
    return cfg;
  },
  (error) => Promise.reject(error),
);

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);

export const setAdminToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
};

export const isAdminLoggedIn = () => !!localStorage.getItem(ADMIN_TOKEN_KEY);

// Auth
export const adminLogin = (username: string, password: string) =>
  adminApi.post<{ token: string }>('/admin/login', { username, password });

// Accounts
export type AdminAccount = {
  id: number;
  wallet_address: string;
  username: string;
  email: string;
  role: string;
  telegram_username: string | null;
  created_at: string;
  updated_at: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: { limit: number; page: number; total: number };
};

export const getAdminAccounts = (page = 1, limit = 25) =>
  adminApi.get<PaginatedResponse<AdminAccount>>('/admin/accounts', { params: { page, limit } });

// Config
export type PlatformConfig = {
  gas_relay_enabled: boolean;
  gas_relay_threshold_sol: number;
};

export const getAdminConfig = () =>
  adminApi.get<PlatformConfig>('/admin/config');

export const updateAdminConfig = (body: Partial<PlatformConfig>) =>
  adminApi.put<PlatformConfig>('/admin/config', body);

// Trades
export const getAdminTrades = (page = 1, limit = 25) =>
  adminApi.get('/admin/trades', { params: { page, limit } });

// Escrows
export const getAdminEscrow = (tradeId: number) =>
  adminApi.get(`/admin/escrows/${tradeId}`);

export const adminReleaseEscrow = (escrowDbId: number, body: {
  signature: string;
  from_address: string;
  to_address?: string;
}) => adminApi.post(`/admin/escrows/${escrowDbId}/release`, body);

export const adminResolveDispute = (escrowDbId: number, body: {
  signature: string;
  from_address: string;
  to_address?: string;
}) => adminApi.post(`/admin/escrows/${escrowDbId}/resolve`, body);

// Disputes
export const getAdminDisputes = (page = 1, limit = 25) =>
  adminApi.get('/admin/disputes', { params: { page, limit } });

// Deadline stats
export const getAdminDeadlineStats = () =>
  adminApi.get('/admin/deadline-stats');

export const getAdminNetworkDeadlineStats = (networkId: number) =>
  adminApi.get(`/admin/deadline-stats/${networkId}`);

export default adminApi;
