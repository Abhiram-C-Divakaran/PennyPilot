import { apiClient } from "./client";
import {
  MonthlyAnalytics,
  CategorySpendingItem,
  MonthlySpendingTrend,
  CategoryTrend
} from "../types/analytics";

export async function getMonthlyAnalytics(month?: string): Promise<MonthlyAnalytics> {
  const endpoint = month ? `/api/analytics/monthly?month=${month}` : "/api/analytics/monthly";
  return apiClient<MonthlyAnalytics>(endpoint);
}

export async function getCategorySpending(month?: string): Promise<CategorySpendingItem[]> {
  const endpoint = month ? `/api/analytics/categories?month=${month}` : "/api/analytics/categories";
  return apiClient<CategorySpendingItem[]>(endpoint);
}

export async function getMonthlyTrends(month?: string): Promise<MonthlySpendingTrend> {
  const endpoint = month ? `/api/analytics/trends?month=${month}` : "/api/analytics/trends";
  return apiClient<MonthlySpendingTrend>(endpoint);
}

export async function getCategoryTrends(month?: string): Promise<CategoryTrend[]> {
  const endpoint = month ? `/api/analytics/category-trends?month=${month}` : "/api/analytics/category-trends";
  return apiClient<CategoryTrend[]>(endpoint);
}
