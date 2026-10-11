import { getDatabase, saveDatabase } from "../db/database";
import { FinanceTransaction, CreateTransactionInput, UpdateTransactionInput } from "../../src/types/transaction";
import { isDateInMonth } from "../utils/date";

export interface TransactionFilterParams {
  limit?: number;
  type?: "expense" | "income";
  categoryId?: string;
  paymentMethod?: string;
  search?: string;
  month?: string; // "YYYY-MM"
}

export class TransactionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionValidationError";
  }
}

export function validateTransactionInput(
  input: any,
  isUpdate = false
): void {
  // Validate Amount
  if (!isUpdate || input.amount !== undefined) {
    if (input.amount === undefined || input.amount === null || input.amount === "") {
      throw new TransactionValidationError("Amount is required");
    }
    const num = Number(input.amount);
    if (isNaN(num)) {
      throw new TransactionValidationError("Amount must be a valid number");
    }
    if (num <= 0) {
      throw new TransactionValidationError("Amount must be greater than zero");
    }
  }

  // Validate Type
  if (!isUpdate || input.type !== undefined) {
    if (!input.type || (input.type !== "expense" && input.type !== "income")) {
      throw new TransactionValidationError("Transaction type must be 'expense' or 'income'");
    }
  }

  // Validate Category
  const db = getDatabase();
  const categoryId = input.categoryId;
  if (!isUpdate || categoryId !== undefined) {
    if (!categoryId || typeof categoryId !== "string" || categoryId.trim() === "") {
      throw new TransactionValidationError("Category is required");
    }
    const category = db.categories.find((c) => c.id === categoryId);
    if (!category) {
      throw new TransactionValidationError(`Category '${categoryId}' does not exist`);
    }

    const typeToCheck = input.type;
    if (typeToCheck && category.type !== typeToCheck) {
      throw new TransactionValidationError(
        `Category '${category.name}' is an ${category.type} category, but transaction type is ${typeToCheck}`
      );
    }
  }

  // Validate Timestamp
  if (input.timestamp !== undefined) {
    const parsed = Date.parse(input.timestamp);
    if (isNaN(parsed)) {
      throw new TransactionValidationError("Invalid timestamp format");
    }
  }
}

export function getAllTransactions(filters?: TransactionFilterParams): FinanceTransaction[] {
  const db = getDatabase();
  let list = [...(db.transactions || [])];

  if (filters?.type) {
    list = list.filter((t) => t.type === filters.type);
  }

  if (filters?.categoryId) {
    list = list.filter((t) => t.categoryId === filters.categoryId);
  }

  if (filters?.paymentMethod) {
    list = list.filter((t) => t.paymentMethod === filters.paymentMethod);
  }

  if (filters?.month) {
    list = list.filter((t) => t.timestamp && isDateInMonth(t.timestamp, filters.month!));
  }

  if (filters?.search && filters.search.trim() !== "") {
    const q = filters.search.toLowerCase().trim();
    list = list.filter((t) => {
      const matchMerchant = t.merchant?.toLowerCase().includes(q) ?? false;
      const matchDesc = t.description?.toLowerCase().includes(q) ?? false;
      const category = db.categories.find((c) => c.id === t.categoryId);
      const matchCat = category?.name.toLowerCase().includes(q) ?? false;
      return matchMerchant || matchDesc || matchCat;
    });
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (filters?.limit && filters.limit > 0) {
    list = list.slice(0, filters.limit);
  }

  return list;
}

export function getTransactionById(id: string): FinanceTransaction | null {
  const db = getDatabase();
  return db.transactions.find((t) => t.id === id) || null;
}

export function createTransaction(input: CreateTransactionInput): FinanceTransaction {
  validateTransactionInput(input, false);

  const db = getDatabase();
  const now = new Date().toISOString();
  const id = "tx-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);

  const newTx: FinanceTransaction = {
    id,
    type: input.type,
    amount: Number(input.amount),
    categoryId: input.categoryId,
    merchant: input.merchant?.trim() || undefined,
    description: input.description?.trim() || undefined,
    timestamp: input.timestamp ? new Date(input.timestamp).toISOString() : now,
    paymentMethod: input.paymentMethod || undefined,
    source: input.source || "manual",
    reviewStatus: "confirmed",
    categoryConfidence: 1,
    externalReference: input.externalReference || undefined,
    createdAt: now,
    updatedAt: now
  };

  db.transactions.unshift(newTx);
  saveDatabase(db);

  return newTx;
}

export function updateTransaction(
  id: string,
  input: UpdateTransactionInput
): FinanceTransaction {
  const db = getDatabase();
  const index = db.transactions.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error(`Transaction with id '${id}' not found`);
  }

  const existing = db.transactions[index];

  // Merge for validation
  const mergedForValidation = {
    ...existing,
    ...input
  };
  validateTransactionInput(mergedForValidation, true);

  const now = new Date().toISOString();
  const updatedTx: FinanceTransaction = {
    ...existing,
    type: input.type ?? existing.type,
    amount: input.amount !== undefined ? Number(input.amount) : existing.amount,
    categoryId: input.categoryId ?? existing.categoryId,
    merchant: input.merchant !== undefined ? (input.merchant.trim() || undefined) : existing.merchant,
    description: input.description !== undefined ? (input.description.trim() || undefined) : existing.description,
    timestamp: input.timestamp ? new Date(input.timestamp).toISOString() : existing.timestamp,
    paymentMethod: input.paymentMethod !== undefined ? input.paymentMethod : existing.paymentMethod,
    reviewStatus: input.reviewStatus ?? existing.reviewStatus,
    updatedAt: now
  };

  db.transactions[index] = updatedTx;
  saveDatabase(db);

  return updatedTx;
}

export function deleteTransaction(id: string): boolean {
  const db = getDatabase();
  const index = db.transactions.findIndex((t) => t.id === id);
  if (index === -1) {
    return false;
  }

  db.transactions.splice(index, 1);
  saveDatabase(db);

  return true;
}

export function getTransactionsForReview(): FinanceTransaction[] {
  const db = getDatabase();
  return (db.transactions || [])
    .filter((t) => t.reviewStatus === "pending_review")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function confirmTransaction(
  id: string,
  updates?: {
    categoryId?: string;
    merchant?: string;
    paymentMethod?: any;
    type?: any;
    learnMerchantRule?: boolean;
  }
): FinanceTransaction {
  const db = getDatabase();
  const index = db.transactions.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error(`Transaction '${id}' not found`);
  }

  const existing = db.transactions[index];
  const now = new Date().toISOString();

  const finalCategoryId = updates?.categoryId || existing.categoryId;
  const finalMerchant = updates?.merchant !== undefined ? updates.merchant.trim() : existing.merchant;
  const finalPaymentMethod = updates?.paymentMethod || existing.paymentMethod;
  const finalType = updates?.type || existing.type;

  const confirmedTx: FinanceTransaction = {
    ...existing,
    categoryId: finalCategoryId,
    merchant: finalMerchant || undefined,
    paymentMethod: finalPaymentMethod,
    type: finalType,
    reviewStatus: "confirmed",
    categoryConfidence: 1,
    updatedAt: now
  };

  db.transactions[index] = confirmedTx;
  saveDatabase(db);

  // If user requested to learn this rule or corrected the category for a merchant
  if (updates?.learnMerchantRule && finalMerchant && finalCategoryId) {
    try {
      const { addOrUpdateMerchantRule } = require("./categorizationService");
      addOrUpdateMerchantRule({
        merchant: finalMerchant,
        categoryId: finalCategoryId,
        paymentMethod: finalPaymentMethod
      });
    } catch (err) {
      console.error("Failed to learn merchant rule on confirmation:", err);
    }
  }

  return confirmedTx;
}

export function rejectTransaction(id: string): FinanceTransaction {
  const db = getDatabase();
  const index = db.transactions.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error(`Transaction '${id}' not found`);
  }

  const existing = db.transactions[index];
  const now = new Date().toISOString();

  const rejectedTx: FinanceTransaction = {
    ...existing,
    reviewStatus: "rejected",
    updatedAt: now
  };

  db.transactions[index] = rejectedTx;
  saveDatabase(db);

  return rejectedTx;
}
