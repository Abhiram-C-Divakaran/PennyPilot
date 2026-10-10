export type InsightSeverity = "info" | "positive" | "warning" | "critical";

export type InsightType =
  | "over_budget"
  | "approaching_budget"
  | "spending_increased"
  | "spending_improved"
  | "largest_category"
  | "potential_savings";

export interface SpendingInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  message: string;
  categoryId?: string;
  categoryName?: string;
  amount?: number;
  potentialMonthlySavings?: number;
  potentialAnnualSavings?: number;
  createdAt?: string;
}
