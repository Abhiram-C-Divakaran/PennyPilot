import { apiClient } from "./client";
import {
  FinanceTransaction,
  CreateTransactionInput,
  UpdateTransactionInput
} from "../types/transaction";

export interface TransactionQueryParams {
  limit?: number;
  type?: "expense" | "income";
  categoryId?: string;
  paymentMethod?: string;
  search?: string;
  month?: string;
}

export async function getTransactions(
  params?: TransactionQueryParams
): Promise<FinanceTransaction[]> {
  const query = new URLSearchParams();

  if (params?.limit) query.append("limit", String(params.limit));
  if (params?.type) query.append("type", params.type);
  if (params?.categoryId) query.append("categoryId", params.categoryId);
  if (params?.paymentMethod) query.append("paymentMethod", params.paymentMethod);
  if (params?.search) query.append("search", params.search);
  if (params?.month) query.append("month", params.month);

  const queryString = query.toString();
  const endpoint = queryString ? `/api/transactions?${queryString}` : "/api/transactions";

  return apiClient<FinanceTransaction[]>(endpoint);
}

export async function getTransaction(id: string): Promise<FinanceTransaction> {
  return apiClient<FinanceTransaction>(`/api/transactions/${id}`);
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<FinanceTransaction> {
  return apiClient<FinanceTransaction>("/api/transactions", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput
): Promise<FinanceTransaction> {
  return apiClient<FinanceTransaction>(`/api/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export async function deleteTransaction(
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(`/api/transactions/${id}`, {
    method: "DELETE"
  });
}

export async function getReviewTransactions(): Promise<FinanceTransaction[]> {
  return apiClient<FinanceTransaction[]>("/api/transactions/review");
}

export async function confirmTransaction(
  id: string,
  updates?: {
    categoryId?: string;
    merchant?: string;
    paymentMethod?: any;
    type?: any;
    learnMerchantRule?: boolean;
  }
): Promise<{ success: boolean; transaction: FinanceTransaction }> {
  return apiClient<{ success: boolean; transaction: FinanceTransaction }>(
    `/api/transactions/${id}/confirm`,
    {
      method: "POST",
      body: JSON.stringify(updates || {})
    }
  );
}

export async function rejectTransaction(
  id: string
): Promise<{ success: boolean; transaction: FinanceTransaction }> {
  return apiClient<{ success: boolean; transaction: FinanceTransaction }>(
    `/api/transactions/${id}/reject`,
    {
      method: "POST"
    }
  );
}

