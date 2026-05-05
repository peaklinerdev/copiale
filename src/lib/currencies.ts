/**
 * Unified currency configuration — single source of truth.
 *
 * REFERENCE_CURRENCIES: shown faded in the header as global reference rates.
 * TRADING_CURRENCIES: the P2P trading currencies (filter, offers, header).
 * ALL_FIATS: the complete set the /prices endpoint queries upstream.
 */
export const REFERENCE_CURRENCIES = ['USD', 'EUR'] as const;
export const TRADING_CURRENCIES = ['COP', 'NGN', 'VES', 'KES', 'ZAR', 'ETB'] as const;
export const ALL_FIATS = [...REFERENCE_CURRENCIES, ...TRADING_CURRENCIES] as const;

export type TradingCurrency = (typeof TRADING_CURRENCIES)[number];
export type ReferenceCurrency = (typeof REFERENCE_CURRENCIES)[number];
export type FiatCurrency = (typeof ALL_FIATS)[number];
