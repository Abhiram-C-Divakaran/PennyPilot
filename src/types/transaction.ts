export type FinanceTransactionType = "expense" | "income";

export type TransactionSource =
  | "manual"
  | "notification"
  | "sms"
  | "bank_api"
  | "import";

export type PaymentMethod =
  | "upi"
  | "cash"
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "wallet"
  | "other";

export interface FinanceTransaction {
  id: string;
  type: FinanceTransactionType;
  amount: number;
  categoryId: string;
  merchant?: string;
  description?: string;
  timestamp: string;
  paymentMethod?: PaymentMethod;
  source: TransactionSource;
  externalReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionInput {
  type: FinanceTransactionType;
  amount: number;
  categoryId: string;
  merchant?: string;
  description?: string;
  timestamp?: string;
  paymentMethod?: PaymentMethod;
}

export interface UpdateTransactionInput {
  type?: FinanceTransactionType;
  amount?: number;
  categoryId?: string;
  merchant?: string;
  description?: string;
  timestamp?: string;
  paymentMethod?: PaymentMethod;
}
