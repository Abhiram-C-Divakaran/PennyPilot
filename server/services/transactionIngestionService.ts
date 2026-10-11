import { getDatabase, saveDatabase } from "../db/database";
import { FinanceTransaction, TransactionReviewStatus } from "../../src/types/transaction";
import { IncomingTransaction, IngestionResult, IngestionStatus } from "../../src/types/ingestion";
import { normalizeMerchant, extractMerchantFromRawText } from "./merchantService";
import { categorizeTransaction, AUTO_ACCEPT_CONFIDENCE } from "./categorizationService";
import { checkForDuplicate, generateTransactionFingerprint } from "./deduplicationService";
import { isValidPositiveAmount, normalizeAmount } from "../utils/finance";

export class IngestionValidationError extends Error {
  code: string;
  constructor(message: string, code = "INVALID_INGESTION_PAYLOAD") {
    super(message);
    this.name = "IngestionValidationError";
    this.code = code;
  }
}

/**
 * Validates untrusted incoming transaction payload
 */
export function validateIncomingTransaction(incoming: any): IncomingTransaction {
  if (!incoming || typeof incoming !== "object") {
    throw new IngestionValidationError("Incoming payload must be a JSON object");
  }

  const validSources = ["notification", "sms", "bank_api", "import"];
  if (!incoming.source || !validSources.includes(incoming.source)) {
    throw new IngestionValidationError(`Invalid source '${incoming.source}'. Must be one of: ${validSources.join(", ")}`);
  }

  if (incoming.amount === undefined || incoming.amount === null || !isValidPositiveAmount(incoming.amount)) {
    throw new IngestionValidationError("Amount must be a valid positive number");
  }

  // Sanitize strings and enforce safety limits
  const sanitized: IncomingTransaction = {
    source: incoming.source,
    amount: normalizeAmount(incoming.amount),
    type: incoming.type === "income" ? "income" : "expense",
    merchant: incoming.merchant ? String(incoming.merchant).slice(0, 150).trim() : undefined,
    rawDescription: incoming.rawDescription ? String(incoming.rawDescription).slice(0, 500).trim() : undefined,
    timestamp: incoming.timestamp ? new Date(incoming.timestamp).toISOString() : new Date().toISOString(),
    paymentMethod: incoming.paymentMethod || undefined,
    externalReference: incoming.externalReference ? String(incoming.externalReference).slice(0, 100).trim() : undefined,
    sourceApp: incoming.sourceApp ? String(incoming.sourceApp).slice(0, 120).trim() : undefined,
    sourceAccount: incoming.sourceAccount ? String(incoming.sourceAccount).slice(0, 50).trim() : undefined
  };

  return sanitized;
}

/**
 * Main Ingestion Pipeline
 * Processes incoming transactions from any automated source (Notification, SMS, Bank API, CSV Import)
 */
export function ingestTransaction(
  rawIncoming: IncomingTransaction,
  options: { autoPersist?: boolean } = { autoPersist: true }
): IngestionResult {
  const incoming = validateIncomingTransaction(rawIncoming);
  const db = getDatabase();
  const existingTransactions = db.transactions || [];

  // 1. Detect or extract merchant
  let rawMerchant = incoming.merchant;
  if (!rawMerchant && incoming.rawDescription) {
    rawMerchant = extractMerchantFromRawText(incoming.rawDescription);
  }
  const normalizedMerchant = normalizeMerchant(rawMerchant);

  // 2. Detect transaction type if not specified
  let detectedType = incoming.type || "expense";
  if (!incoming.type && incoming.rawDescription) {
    const desc = incoming.rawDescription.toLowerCase();
    if (desc.includes("credited") || desc.includes("refund") || desc.includes("received")) {
      detectedType = "income";
    }
  }

  // 3. Deduplication Check (Level 1: Exact Reference, Level 2: Fingerprint)
  const dupCheck = checkForDuplicate(incoming, existingTransactions);
  if (dupCheck.isDuplicate) {
    return {
      status: "duplicate",
      existingTransactionId: dupCheck.existingTransactionId,
      duplicateReason: dupCheck.reason,
      categorization: {
        categoryId: dupCheck.existingTransaction?.categoryId || null,
        confidence: dupCheck.existingTransaction?.categoryConfidence || 0,
        reason: dupCheck.reason || "Duplicate detected"
      },
      reviewStatus: dupCheck.existingTransaction?.reviewStatus || "confirmed"
    };
  }

  // 4. Auto-Categorization Engine
  const categorization = categorizeTransaction(normalizedMerchant, incoming.rawDescription);

  // 5. Calculate Confidence & Determine Review Status (Step 11)
  let reviewStatus: TransactionReviewStatus = "pending_review";
  let status: IngestionStatus = "pending_review";
  let resolvedCategoryId = categorization.categoryId;

  if (categorization.confidence >= AUTO_ACCEPT_CONFIDENCE && resolvedCategoryId) {
    // High confidence (>= 0.90) -> Automatically accepted and confirmed
    reviewStatus = "confirmed";
    status = "created";
  } else {
    // Medium / Low confidence (< 0.90) -> Queued for review
    reviewStatus = "pending_review";
    status = "pending_review";
    if (!resolvedCategoryId) {
      resolvedCategoryId = "other"; // Fallback placeholder category
    }
  }

  // 6. Generate Fingerprint
  const fingerprint = generateTransactionFingerprint(
    detectedType,
    incoming.amount,
    normalizedMerchant,
    incoming.timestamp,
    incoming.paymentMethod
  );

  // 7. Construct FinanceTransaction Object
  const now = new Date().toISOString();
  const id = `tx-ing-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const transaction: FinanceTransaction = {
    id,
    type: detectedType,
    amount: incoming.amount,
    categoryId: resolvedCategoryId,
    merchant: rawMerchant || normalizedMerchant || undefined,
    merchantNormalized: normalizedMerchant || undefined,
    description: incoming.rawDescription || `Automatic transaction via ${incoming.source}`,
    rawDescription: incoming.rawDescription,
    timestamp: incoming.timestamp || now,
    paymentMethod: incoming.paymentMethod || "upi",
    source: incoming.source,
    externalReference: incoming.externalReference,
    categoryConfidence: categorization.confidence,
    reviewStatus,
    sourceApp: incoming.sourceApp,
    sourceAccount: incoming.sourceAccount,
    ingestedAt: now,
    fingerprint,
    createdAt: now,
    updatedAt: now
  };

  // 8. Persist to canonical database
  if (options.autoPersist !== false) {
    existingTransactions.unshift(transaction);
    db.transactions = existingTransactions;
    saveDatabase(db);
  }

  return {
    status,
    transaction,
    categorization,
    reviewStatus
  };
}
