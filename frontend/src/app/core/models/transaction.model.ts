export enum RecurrenceFrequency {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export interface ScheduledTransaction {
  id: number;
  user_id: number;
  account_id: number;
  category_id: number;
  to_account_id?: number;
  name: string;
  amount: string;
  currency: string;
  is_recurring: boolean;
  recurrence_frequency?: RecurrenceFrequency;
  recurrence_day?: number;
  recurrence_month?: number;
  recurrence_start_date?: string;
  recurrence_end_date?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledTransactionCreate {
  account_id: number;
  category_id: number;
  to_account_id?: number;
  name: string;
  amount: string;
  currency: string;
  is_recurring: boolean;
  recurrence_frequency?: RecurrenceFrequency;
  recurrence_day?: number;
  recurrence_month?: number;
  recurrence_start_date?: string;
  recurrence_end_date?: string;
  note?: string;
}

export interface ScheduledTransactionUpdate {
  account_id?: number;
  category_id?: number;
  to_account_id?: number;
  name?: string;
  amount?: string;
  currency?: string;
  recurrence_frequency?: RecurrenceFrequency;
  recurrence_day?: number;
  recurrence_month?: number;
  recurrence_end_date?: string;
  note?: string;
  edit_mode?: 'ALL' | 'THIS_ONLY' | 'THIS_AND_FUTURE';
  instance_date?: string;
}

export interface TransactionInstance {
  id: number;
  name: string;
  amount: string;
  currency: string;
  date: string;
  account_id: number;
  category_id: number;
  to_account_id?: number;
  is_exception: boolean;
}
