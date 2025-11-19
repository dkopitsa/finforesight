/**
 * @deprecated This file is deprecated. Please use the centralized currency system instead:
 *
 * - Import from: `core/constants/currencies.ts`
 * - Use CurrencyService: `core/services/currency.service.ts`
 * - Use CurrencySelectComponent: `shared/components/currency-select/currency-select.component.ts`
 * - Use CurrencyFormatPipe: `shared/pipes/currency-format.pipe.ts`
 * - Use CurrencySymbolPipe: `shared/pipes/currency-symbol.pipe.ts`
 *
 * This export is maintained for backward compatibility only and will be removed in a future version.
 */
export const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  RUB: '₽',
};
