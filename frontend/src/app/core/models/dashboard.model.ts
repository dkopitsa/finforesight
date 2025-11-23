export interface FinancialSummary {
  liquid_assets: string;
  investments: string;
  credit_used: string;
  loans_receivable: string;
  net_worth: string;
  account_count: number;
}

export interface UpcomingTransaction {
  scheduled_transaction_id: number;
  date: string;
  name: string;
  amount: string;
  account_name: string;
  category_name: string;
  is_transfer: boolean;
}

export interface BalanceTrendPoint {
  date: string;
  balance: string;
}

export interface DashboardData {
  financial_summary: FinancialSummary;
  upcoming_transactions: UpcomingTransaction[];
  balance_trend: BalanceTrendPoint[];
  liquid_trend: BalanceTrendPoint[];
  investments_trend: BalanceTrendPoint[];
  credit_trend: BalanceTrendPoint[];
  scheduled_transaction_count: number;
}

// Forecast models
export interface ForecastDataPoint {
  date: string;
  balance: string;
}

export interface AccountForecast {
  account_id: number;
  account_name: string;
  currency: string;
  starting_balance: string;
  data_points: ForecastDataPoint[];
}

export interface ForecastData {
  from_date: string;
  to_date: string;
  accounts: AccountForecast[];
}
