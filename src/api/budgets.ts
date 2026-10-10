import { apiClient } from "./client";
import {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetProgress,
  MonthlyBudgetSummary
} from "../types/budget";

export async function getBudgets(month?: string): Promise<Budget[]> {
  const endpoint = month ? `/api/budgets?month=${month}` : "/api/budgets";
  return apiClient<Budget[]>(endpoint);
}

export async function getBudget(id: string): Promise<Budget> {
  return apiClient<Budget>(`/api/budgets/${id}`);
}

export async function createBudget(input: CreateBudgetInput): Promise<Budget> {
  return apiClient<Budget>("/api/budgets", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateBudget(id: string, input: UpdateBudgetInput): Promise<Budget> {
  return apiClient<Budget>(`/api/budgets/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export async function deleteBudget(id: string): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(`/api/budgets/${id}`, {
    method: "DELETE"
  });
}

export async function getBudgetProgress(month?: string): Promise<BudgetProgress[]> {
  const endpoint = month ? `/api/budgets/progress?month=${month}` : "/api/budgets/progress";
  return apiClient<BudgetProgress[]>(endpoint);
}

export async function getBudgetSummary(month?: string): Promise<MonthlyBudgetSummary> {
  const endpoint = month ? `/api/budgets/summary?month=${month}` : "/api/budgets/summary";
  return apiClient<MonthlyBudgetSummary>(endpoint);
}
