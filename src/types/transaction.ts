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

export type TransactionReviewStatus =
  | "confirmed"
  | "pending_review"
  | "rejected";

export interface FinanceTransaction {
  id: string;
  type: FinanceTransactionType;
  amount: number;
  categoryId: string;
  merchant?: string;
  merchantNormalized?: string;
  description?: string;
  timestamp: string;
  paymentMethod?: PaymentMethod;
  source: TransactionSource;
  externalReference?: string;
  categoryConfidence?: number;
  reviewStatus?: TransactionReviewStatus;
  rawDescription?: string;
  sourceApp?: string;
  sourceAccount?: string;
  ingestedAt?: string;
  fingerprint?: string;
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
  source?: TransactionSource;
  externalReference?: string;
}

export interface UpdateTransactionInput {
  type?: FinanceTransactionType;
  amount?: number;
  categoryId?: string;
  merchant?: string;
  description?: string;
  timestamp?: string;
  paymentMethod?: PaymentMethod;
  reviewStatus?: TransactionReviewStatus;
}
