/**
 * Centralized currency configuration for FinForesight
 * Single source of truth for all currency-related data
 */

/**
 * Supported currency codes
 */
export enum Currency {
  USD = 'USD',
  RUB = 'RUB',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
  CHF = 'CHF',
  CNY = 'CNY',
}

/**
 * Currency information interface
 */
export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  decimals: number;
  symbolPosition: 'prefix' | 'suffix';
}

/**
 * Complete currency information for all supported currencies
 */
export const CURRENCIES: CurrencyInfo[] = [
  {
    code: Currency.USD,
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    symbolPosition: 'prefix',
  },
  {
    code: Currency.EUR,
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    symbolPosition: 'suffix',
  },
  {
    code: Currency.GBP,
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
    symbolPosition: 'prefix',
  },
  {
    code: Currency.JPY,
    symbol: '¥',
    name: 'Japanese Yen',
    decimals: 0,
    symbolPosition: 'prefix',
  },
  {
    code: Currency.CAD,
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimals: 2,
    symbolPosition: 'prefix',
  },
  {
    code: Currency.AUD,
    symbol: 'A$',
    name: 'Australian Dollar',
    decimals: 2,
    symbolPosition: 'prefix',
  },
  {
    code: Currency.CHF,
    symbol: 'CHF',
    name: 'Swiss Franc',
    decimals: 2,
    symbolPosition: 'prefix',
  },
  {
    code: Currency.CNY,
    symbol: '¥',
    name: 'Chinese Yuan',
    decimals: 2,
    symbolPosition: 'prefix',
  },
  {
    code: Currency.RUB,
    symbol: '₽',
    name: 'Russian Ruble',
    decimals: 2,
    symbolPosition: 'suffix',
  },
];

/**
 * Map of currency codes to symbols for quick lookup
 * @deprecated Use CurrencyService.getCurrencySymbol() instead
 */
export const CURRENCY_SYMBOLS: Record<string, string> = CURRENCIES.reduce(
  (acc, curr) => {
    acc[curr.code] = curr.symbol;
    return acc;
  },
  {} as Record<string, string>,
);

/**
 * Map of currency codes to CurrencyInfo for quick lookup
 */
export const CURRENCY_MAP: Map<string, CurrencyInfo> = new Map(CURRENCIES.map((c) => [c.code, c]));

/**
 * Default currency code
 */
export const DEFAULT_CURRENCY: Currency = Currency.USD;
