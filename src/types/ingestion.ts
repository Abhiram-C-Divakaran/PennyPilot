import { FinanceTransaction, FinanceTransactionType, PaymentMethod, TransactionReviewStatus } from "./transaction";
import { CategorizationResult } from "./merchant";

export interface IncomingTransaction {
  source: "notification" | "sms" | "bank_api" | "import";
  amount: number;
  type?: FinanceTransactionType;
  merchant?: string;
  rawDescription?: string;
  timestamp?: string;
  paymentMethod?: PaymentMethod;
  externalReference?: string;
  sourceApp?: string;
  sourceAccount?: string;
}

export type IngestionStatus =
  | "created"
  | "pending_review"
  | "duplicate"
  | "rejected";

export interface IngestionResult {
  status: IngestionStatus;
  transaction?: FinanceTransaction;
  existingTransactionId?: string;
  categorization: CategorizationResult;
  reviewStatus: TransactionReviewStatus;
  duplicateReason?: string;
}

export interface CSVColumnMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn?: string;
  debitColumn?: string;
  creditColumn?: string;
  referenceColumn?: string;
}

export interface CSVImportPreviewItem {
  id: string;
  rowNumber: number;
  incoming: IncomingTransaction;
  status: IngestionStatus;
  categorization: CategorizationResult;
  existingTransactionId?: string;
  error?: string;
}

export interface CSVImportPreview {
  totalRows: number;
  readyCount: number;
  duplicateCount: number;
  reviewCount: number;
  invalidCount: number;
  items: CSVImportPreviewItem[];
}

export interface CSVImportResult {
  totalProcessed: number;
  createdCount: number;
  reviewCount: number;
  duplicateCount: number;
  errorCount: number;
}
