export interface Reconciliation {
  id: number;
  user_id: number;
  account_id: number;
  reconciliation_date: string;
  actual_balance: string;
  expected_balance: string;
  difference: string;
  note?: string;
  adjustment_transaction_id?: number;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationCreate {
  account_id: number;
  reconciliation_date: string;
  actual_balance: string;
  note?: string;
  create_adjustment?: boolean;
}

export interface ReconciliationSummary {
  id: number;
  account_id: number;
  account_name: string;
  reconciliation_date: string;
  actual_balance: string;
  expected_balance: string;
  difference: string;
  note?: string;
  created_at: string;
}
