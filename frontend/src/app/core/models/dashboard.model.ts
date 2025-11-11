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

export interface DashboardSummary {
  accounts: Array<{
    id: number;
    name: string;
    type: string;
    balance: string;
    currency: string;
  }>;
  upcoming_transactions: Array<{
    id: number;
    name: string;
    amount: string;
    date: string;
    category_name: string;
    account_name: string;
  }>;
  balance_trend: Array<{
    date: string;
    total_balance: string;
  }>;
  summary: {
    liquid_assets: string;
    investments: string;
    credit_used: string;
    loans_receivable: string;
    net_worth: string;
  };
}
