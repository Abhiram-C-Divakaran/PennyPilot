import { apiClient } from "./client";
import { IncomingTransaction, IngestionResult, CSVColumnMapping, CSVImportPreview, CSVImportResult } from "../types/ingestion";
import { MerchantRule, CreateMerchantRuleInput } from "../types/merchant";

export async function sendIncomingTransaction(
  incoming: IncomingTransaction
): Promise<IngestionResult> {
  return apiClient<IngestionResult>("/api/ingestion/transaction", {
    method: "POST",
    body: JSON.stringify(incoming)
  });
}

export async function getCSVPreview(
  csvContent: string,
  mapping?: CSVColumnMapping
): Promise<CSVImportPreview> {
  return apiClient<CSVImportPreview>("/api/ingestion/csv/preview", {
    method: "POST",
    body: JSON.stringify({ csvContent, mapping })
  });
}

export async function importCSVTransactions(
  transactions: IncomingTransaction[]
): Promise<CSVImportResult> {
  return apiClient<CSVImportResult>("/api/ingestion/csv/import", {
    method: "POST",
    body: JSON.stringify({ transactions })
  });
}

export async function getMerchantRules(): Promise<MerchantRule[]> {
  return apiClient<MerchantRule[]>("/api/merchant-rules");
}

export async function createMerchantRule(
  input: CreateMerchantRuleInput
): Promise<{ success: boolean; rule: MerchantRule }> {
  return apiClient<{ success: boolean; rule: MerchantRule }>("/api/merchant-rules", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
