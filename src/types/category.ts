export type CategoryType = "expense" | "income";

export interface TransactionCategory {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}
