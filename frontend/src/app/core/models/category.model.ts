export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export interface Category {
  id: number;
  user_id?: number;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_system: boolean;
  created_at?: string;
}
