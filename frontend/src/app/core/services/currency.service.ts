import { Injectable } from '@angular/core';
import {
  Currency,
  CurrencyInfo,
  CURRENCIES,
  CURRENCY_MAP,
  DEFAULT_CURRENCY,
} from '../constants/currencies';

/**
 * Service for currency operations
 * Provides utilities for currency formatting, symbol lookup, and currency list management
 */
@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  /**
   * Get complete currency information by code
   * @param code Currency code (e.g., 'USD', 'EUR')
   * @returns Currency information or default (USD) if not found
   */
  getCurrencyInfo(code: string): CurrencyInfo {
    return CURRENCY_MAP.get(code) || CURRENCY_MAP.get(DEFAULT_CURRENCY)!;
  }

  /**
   * Get currency symbol by code
   * @param code Currency code (e.g., 'USD', 'EUR')
   * @returns Currency symbol (e.g., '$', '€')
   */
  getCurrencySymbol(code: string): string {
    return this.getCurrencyInfo(code).symbol;
  }

  /**
   * Format amount with currency symbol
   * @param amount Numeric amount
   * @param code Currency code
   * @returns Formatted string with currency symbol (e.g., '$1,000.00', '1 000₽')
   */
  formatAmount(amount: number, code: string): string {
    const info = this.getCurrencyInfo(code);
    const formatted = this.formatNumber(amount, info);

    return info.symbolPosition === 'prefix'
      ? `${info.symbol}${formatted}`
      : `${formatted}${info.symbol}`;
  }

  /**
   * Format number without currency symbol (for charts, etc.)
   * @param amount Numeric amount
   * @param code Currency code
   * @returns Formatted number string with proper separators
   */
  formatNumber(amount: number, codeOrInfo: string | CurrencyInfo): string {
    const info = typeof codeOrInfo === 'string' ? this.getCurrencyInfo(codeOrInfo) : codeOrInfo;
    const fixed = amount.toFixed(info.decimals);
    const parts = fixed.split('.');

    // Add thousands separator
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, info.thousandsSeparator);

    // Use proper decimal separator
    return parts.join(info.decimalSeparator);
  }

  /**
   * Get all available currencies
   * @returns Array of all currency information
   */
  getAllCurrencies(): CurrencyInfo[] {
    return CURRENCIES;
  }

  /**
   * Get currency options for select dropdowns
   * @returns Array of options with label and value
   */
  getCurrencyOptions(): Array<{ label: string; value: string }> {
    return CURRENCIES.map(c => ({
      label: `${c.code} - ${c.name} (${c.symbol})`,
      value: c.code,
    }));
  }

  /**
   * Check if currency code is valid
   * @param code Currency code to validate
   * @returns True if currency is supported
   */
  isValidCurrency(code: string): boolean {
    return CURRENCY_MAP.has(code);
  }

  /**
   * Get default currency
   * @returns Default currency code
   */
  getDefaultCurrency(): Currency {
    return DEFAULT_CURRENCY;
  }

}
