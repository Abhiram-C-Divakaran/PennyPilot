import { apiClient } from "./client";
import { MonthlyAnalytics, CategorySpendingItem } from "../types/analytics";

export async function getMonthlyAnalytics(month?: string): Promise<MonthlyAnalytics> {
  const endpoint = month ? `/api/analytics/monthly?month=${month}` : "/api/analytics/monthly";
  return apiClient<MonthlyAnalytics>(endpoint);
}

export async function getCategorySpending(month?: string): Promise<CategorySpendingItem[]> {
  const endpoint = month ? `/api/analytics/categories?month=${month}` : "/api/analytics/categories";
  return apiClient<CategorySpendingItem[]>(endpoint);
}
