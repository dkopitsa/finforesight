export enum RecurrenceFrequency {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum UpdateMode {
  ALL = 'ALL',
  THIS_ONLY = 'THIS_ONLY',
  THIS_AND_FUTURE = 'THIS_AND_FUTURE',
}

export enum ViewMode {
  LIST = 'list',
  CALENDAR = 'calendar',
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

export interface ScheduledTransactionInstance extends TransactionInstance {
  category_name: string;
  category_type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  account_name: string;
}

export interface ScheduledTransactionException {
  id: number;
  scheduled_transaction_id: number;
  exception_date: string;
  amount?: string;
  note?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledTransactionExceptionCreate {
  scheduled_transaction_id: number;
  exception_date: string;
  amount?: string;
  note?: string;
  is_deleted?: boolean;
}

export interface TransactionFilter {
  search?: string;
  category_id?: number;
  account_id?: number;
  is_recurring?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface TransactionStats {
  total_income: string;
  total_expense: string;
  net_balance: string;
  top_categories: {
    category_id: number;
    category_name: string;
    total: string;
  }[];
  period_start: string;
  period_end: string;
}

export interface InstancesResponse {
  instances: TransactionInstance[];
}
