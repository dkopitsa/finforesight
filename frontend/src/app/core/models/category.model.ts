export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export interface Category {
  id: number;
  user_id: number | null;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}

export interface CategoryUpdate {
  name?: string;
  type?: CategoryType;
  icon?: string;
  color?: string;
}
