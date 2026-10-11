import { FinanceTransaction } from "../../src/types/transaction";
import { IncomingTransaction } from "../../src/types/ingestion";
import { normalizeMerchant } from "./merchantService";
import { toPaise } from "../utils/finance";

// Duplicate tolerance window: 15 minutes in milliseconds
const DUPLICATE_TIME_TOLERANCE_MS = 15 * 60 * 1000;

export interface DeduplicationCheckResult {
  isDuplicate: boolean;
  existingTransactionId?: string;
  reason?: string;
  existingTransaction?: FinanceTransaction;
}

/**
 * Generates a stable deterministic fingerprint string for an incoming or existing transaction.
 * Uses 15-minute time window bucket so transactions arriving slightly apart share a fingerprint.
 */
export function generateTransactionFingerprint(
  type: string,
  amount: number,
  normalizedMerchant: string,
  timestampIso?: string,
  paymentMethod?: string
): string {
  const amountPaise = toPaise(amount);
  const cleanMerchant = normalizedMerchant.trim().toLowerCase();
  const cleanType = type.toLowerCase();
  const cleanMethod = (paymentMethod || "unspecified").toLowerCase();

  // Bucket timestamp into 15-minute epoch chunks (900,000 ms)
  const timeMs = timestampIso ? new Date(timestampIso).getTime() : Date.now();
  const timeBucket = Math.floor(timeMs / DUPLICATE_TIME_TOLERANCE_MS);

  return `${cleanType}_${amountPaise}_${cleanMerchant}_${timeBucket}_${cleanMethod}`;
}

/**
 * Checks whether an incoming transaction is a duplicate of any existing transaction.
 *
 * Level 1: Exact external reference match (e.g. UPI-123456789)
 * Level 2: Transaction fingerprint match (amount + type + normalized merchant + within 15 minutes)
 */
export function checkForDuplicate(
  incoming: IncomingTransaction,
  existingTransactions: FinanceTransaction[]
): DeduplicationCheckResult {
  const normalizedMerchant = normalizeMerchant(incoming.merchant || incoming.rawDescription);
  const incomingAmountPaise = toPaise(incoming.amount);
  const incomingType = incoming.type || "expense";
  const incomingTimeMs = incoming.timestamp ? new Date(incoming.timestamp).getTime() : Date.now();

  // -------------------------------------------------------------
  // LEVEL 1: Exact External Reference Match
  // -------------------------------------------------------------
  const extRef = incoming.externalReference?.trim();
  if (extRef && extRef.length > 2) {
    const match = existingTransactions.find(
      (tx) => tx.externalReference && tx.externalReference.trim().toLowerCase() === extRef.toLowerCase()
    );

    if (match) {
      return {
        isDuplicate: true,
        existingTransactionId: match.id,
        reason: `Matched exact external reference '${extRef}'`,
        existingTransaction: match
      };
    }
  }

  // -------------------------------------------------------------
  // LEVEL 2: Near-time Fingerprint Match
  // -------------------------------------------------------------
  // Search for transactions with same amount, type, normalized merchant within ±15 minutes
  if (normalizedMerchant) {
    for (const tx of existingTransactions) {
      // Must not match against rejected transactions
      if (tx.reviewStatus === "rejected") {
        continue;
      }

      const txAmountPaise = toPaise(tx.amount);
      const txMerchant = tx.merchantNormalized || normalizeMerchant(tx.merchant || tx.description);
      const txType = tx.type;
      const txTimeMs = new Date(tx.timestamp).getTime();

      const isSameAmount = txAmountPaise === incomingAmountPaise;
      const isSameType = txType === incomingType;
      const isSameMerchant = txMerchant === normalizedMerchant;
      const isWithinTimeTolerance = Math.abs(incomingTimeMs - txTimeMs) <= DUPLICATE_TIME_TOLERANCE_MS;

      if (isSameAmount && isSameType && isSameMerchant && isWithinTimeTolerance) {
        const diffMinutes = Math.round(Math.abs(incomingTimeMs - txTimeMs) / 60000);
        return {
          isDuplicate: true,
          existingTransactionId: tx.id,
          reason: `Detected duplicate candidate: same amount (₹${incoming.amount}) and merchant '${normalizedMerchant}' within ${diffMinutes} min`,
          existingTransaction: tx
        };
      }
    }
  }

  return {
    isDuplicate: false
  };
}
