import { apiClient } from "./client";
import { TransactionCategory, CategoryType } from "../types/category";

export async function getCategories(type?: CategoryType): Promise<TransactionCategory[]> {
  const endpoint = type ? `/api/categories?type=${type}` : "/api/categories";
  return apiClient<TransactionCategory[]>(endpoint);
}

export async function getCategory(id: string): Promise<TransactionCategory> {
  return apiClient<TransactionCategory>(`/api/categories/${id}`);
}
