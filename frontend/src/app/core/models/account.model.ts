export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CASH = 'cash',
  INVESTMENT = 'investment',
  RETIREMENT = 'retirement',
  CREDIT_CARD = 'credit_card',
  LOAN = 'loan',
  LOAN_GIVEN = 'loan_given',
  PLANNING = 'planning',
}

export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: AccountType;
  currency: string;
  initial_balance: string;
  initial_balance_date: string;
  credit_limit?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountCreate {
  name: string;
  type: AccountType;
  currency: string;
  initial_balance: string;
  initial_balance_date: string;
  credit_limit?: string;
}

export interface AccountUpdate {
  name?: string;
  type?: AccountType;
  currency?: string;
  initial_balance?: string;
  initial_balance_date?: string;
  credit_limit?: string;
}

export interface AccountSummary {
  liquid_assets: string;
  investments: string;
  credit_used: string;
  loans_receivable: string;
  net_worth: string;
}
