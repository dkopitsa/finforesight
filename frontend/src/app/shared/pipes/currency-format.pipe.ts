import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyService } from '../../core/services/currency.service';

/**
 * Pipe to format amount with currency symbol
 * Usage: {{ 1000 | currencyFormat: 'USD' }} => $1,000.00
 *        {{ 1000 | currencyFormat: 'JPY' }} => ¥1,000
 *        {{ amount | currencyFormat: account.currency }} => €1,000.00
 */
@Pipe({
  name: 'currencyFormat',
  standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
  constructor(private currencyService: CurrencyService) {}

  transform(amount: number | string, currencyCode: string): string {
    if (amount === null || amount === undefined || amount === '') {
      return '';
    }

    const numericAmount =
      typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numericAmount)) {
      return '';
    }

    const currency = currencyCode || this.currencyService.getDefaultCurrency();
    return this.currencyService.formatAmount(numericAmount, currency);
  }
}
