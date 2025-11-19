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
   * @returns Formatted string with currency symbol (e.g., '$1,000.00', '1,000€')
   */
  formatAmount(amount: number, code: string): string {
    const info = this.getCurrencyInfo(code);
    const formatted = amount.toFixed(info.decimals);
    const withCommas = this.addThousandsSeparator(formatted);

    return info.symbolPosition === 'prefix'
      ? `${info.symbol}${withCommas}`
      : `${withCommas}${info.symbol}`;
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

  /**
   * Add thousands separator to numeric string
   * @param value Numeric string (e.g., '1000.00')
   * @returns String with comma separators (e.g., '1,000.00')
   */
  private addThousandsSeparator(value: string): string {
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }
}
