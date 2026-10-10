import { apiClient } from "./client";
import { SpendingInsight } from "../types/insight";

export async function getSpendingInsights(month?: string): Promise<SpendingInsight[]> {
  const endpoint = month ? `/api/insights?month=${month}` : "/api/insights";
  return apiClient<SpendingInsight[]>(endpoint);
}
