import assert from "node:assert/strict";
import { normalizeMerchant, extractMerchantFromRawText } from "../server/services/merchantService";
import {
  categorizeTransaction,
  addOrUpdateMerchantRule,
  AUTO_ACCEPT_CONFIDENCE,
  REVIEW_CONFIDENCE
} from "../server/services/categorizationService";
import {
  checkForDuplicate,
  generateTransactionFingerprint
} from "../server/services/deduplicationService";
import {
  validateIncomingTransaction,
  ingestTransaction,
  IngestionValidationError
} from "../server/services/transactionIngestionService";
import { calculateMonthlyAnalytics } from "../server/services/analyticsService";
import { calculateBudgetProgressList } from "../server/services/budgetService";
import { parseCSV, autoDetectColumnMapping, previewCSVImport } from "../server/services/importService";
import { getDatabase, saveDatabase } from "../server/db/database";
import { FinanceTransaction } from "../src/types/transaction";
import { Budget } from "../src/types/budget";
import { IncomingTransaction } from "../src/types/ingestion";

console.log("--- Starting PennyPilot Phase 3 Test Suite ---");

let testsPassed = 0;
let testsFailed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

async function runTests() {
  // -------------------------------------------------------------
  // 1. Merchant Normalization Tests (Step 4)
  // -------------------------------------------------------------
  console.log("\n1. Merchant Normalization Tests");

  test("normalizes ZOMATO variations", () => {
    assert.equal(normalizeMerchant("ZOMATO LTD"), "zomato");
    assert.equal(normalizeMerchant("Zomato Online"), "zomato");
    assert.equal(normalizeMerchant("zomato@upi"), "zomato");
    assert.equal(normalizeMerchant("Paid to Zomato"), "zomato");
  });

  test("normalizes UBER variations", () => {
    assert.equal(normalizeMerchant("UBER INDIA"), "uber");
    assert.equal(normalizeMerchant("Uber Trip"), "uber");
    assert.equal(normalizeMerchant("uber.pay"), "uber");
  });

  test("normalizes Amazon variations and aliases", () => {
    assert.equal(normalizeMerchant("AMZN MKTP"), "amazon");
    assert.equal(normalizeMerchant("Amazon India"), "amazon");
    assert.equal(normalizeMerchant("AMZN"), "amazon");
  });

  test("handles empty and messy strings safely", () => {
    assert.equal(normalizeMerchant(""), "");
    assert.equal(normalizeMerchant("   "), "");
    assert.equal(normalizeMerchant(undefined), "");
  });

  test("extracts candidate merchant from raw notification/SMS text", () => {
    const extracted1 = extractMerchantFromRawText("Paid ₹450 to ZOMATO via Google Pay");
    assert.equal(extracted1, "zomato");

    const extracted2 = extractMerchantFromRawText("Transferred ₹320 to Uber India via PhonePe");
    assert.equal(extracted2, "uber");
  });

  // -------------------------------------------------------------
  // 2. Auto-Categorization Engine Tests (Step 6)
  // -------------------------------------------------------------
  console.log("\n2. Auto-Categorization Engine Tests");

  test("categorizes known default merchants with high confidence", () => {
    const zomatoRes = categorizeTransaction("zomato");
    assert.equal(zomatoRes.categoryId, "food");
    assert.ok(zomatoRes.confidence >= 0.90);

    const uberRes = categorizeTransaction("uber");
    assert.equal(uberRes.categoryId, "transport");
    assert.ok(uberRes.confidence >= 0.90);

    const netflixRes = categorizeTransaction("netflix");
    assert.equal(netflixRes.categoryId, "subscriptions");
    assert.ok(netflixRes.confidence >= 0.90);

    const hpclRes = categorizeTransaction("hpcl");
    assert.equal(hpclRes.categoryId, "fuel");
    assert.ok(hpclRes.confidence >= 0.90);
  });

  test("categorizes via keyword matching with medium confidence", () => {
    // "Grand Supermarket" without an exact merchant rule matches "supermarket" keyword -> groceries
    const kwRes = categorizeTransaction("grand supermarket");
    assert.equal(kwRes.categoryId, "groceries");
    assert.ok(kwRes.confidence >= 0.70 && kwRes.confidence < 0.90);
  });

  test("returns zero confidence for unknown merchants", () => {
    const unknownRes = categorizeTransaction("nonexistent_random_store_999xyz");
    assert.equal(unknownRes.categoryId, null);
    assert.equal(unknownRes.confidence, 0);
  });

  // -------------------------------------------------------------
  // 3. User-Defined Rules & Learning Tests (Step 5 & 7)
  // -------------------------------------------------------------
  console.log("\n3. User-Defined Rules & Learning Tests");

  test("user-defined rule creation and override", () => {
    // User creates rule: "ABC TRADERS" -> "groceries"
    const rule = addOrUpdateMerchantRule({
      merchant: "ABC TRADERS",
      categoryId: "groceries"
    });

    assert.equal(rule.normalizedMerchant, "abc traders");
    assert.equal(rule.categoryId, "groceries");
    assert.equal(rule.userDefined, true);
    assert.equal(rule.priority, 100);

    // Now categorizing "ABC TRADERS" should yield groceries with 0.99 confidence
    const catRes = categorizeTransaction("abc traders");
    assert.equal(catRes.categoryId, "groceries");
    assert.equal(catRes.confidence, 0.99);
    assert.ok(catRes.reason.includes("user-defined"));
  });

  test("user rule overrides default seeded rule", () => {
    // Override Zomato to "entertainment"
    addOrUpdateMerchantRule({
      merchant: "ZOMATO",
      categoryId: "entertainment"
    });

    const catRes = categorizeTransaction("zomato");
    assert.equal(catRes.categoryId, "entertainment");
    assert.equal(catRes.confidence, 0.99);

    // Revert Zomato back to food for subsequent tests
    addOrUpdateMerchantRule({
      merchant: "ZOMATO",
      categoryId: "food"
    });
  });

  // -------------------------------------------------------------
  // 4. Duplicate Detection Tests (Step 8 & 9)
  // -------------------------------------------------------------
  console.log("\n4. Duplicate Detection Tests");

  const baseTime = "2026-10-11T12:00:00.000Z";
  const existingTxs: FinanceTransaction[] = [
    {
      id: "tx-existing-1",
      type: "expense",
      amount: 450,
      categoryId: "food",
      merchant: "Zomato",
      merchantNormalized: "zomato",
      timestamp: baseTime,
      paymentMethod: "upi",
      source: "notification",
      externalReference: "UPI-EXACT-12345",
      reviewStatus: "confirmed",
      categoryConfidence: 0.98,
      createdAt: baseTime,
      updatedAt: baseTime
    }
  ];

  test("Level 1: detects duplicate by exact externalReference", () => {
    const incoming: IncomingTransaction = {
      source: "sms",
      amount: 450,
      type: "expense",
      merchant: "Zomato Online",
      externalReference: "UPI-EXACT-12345",
      timestamp: baseTime
    };

    const res = checkForDuplicate(incoming, existingTxs);
    assert.equal(res.isDuplicate, true);
    assert.equal(res.existingTransactionId, "tx-existing-1");
    assert.ok(res.reason?.includes("exact external reference"));
  });

  test("Level 2: detects duplicate by fingerprint within 15 min tolerance", () => {
    // Different external reference, but same amount (450), type (expense), normalized merchant (zomato), 4 minutes later
    const incomingNear: IncomingTransaction = {
      source: "notification",
      amount: 450,
      type: "expense",
      merchant: "ZOMATO LTD",
      externalReference: "UPI-DIFF-9999",
      timestamp: "2026-10-11T12:04:00.000Z"
    };

    const res = checkForDuplicate(incomingNear, existingTxs);
    assert.equal(res.isDuplicate, true);
    assert.equal(res.existingTransactionId, "tx-existing-1");
    assert.ok(res.reason?.includes("duplicate candidate"));
  });

  test("does NOT treat different amounts as duplicates", () => {
    const incomingDiffAmount: IncomingTransaction = {
      source: "notification",
      amount: 650, // Different amount
      type: "expense",
      merchant: "Zomato",
      timestamp: baseTime
    };

    const res = checkForDuplicate(incomingDiffAmount, existingTxs);
    assert.equal(res.isDuplicate, false);
  });

  test("does NOT treat transactions far apart in time as duplicates", () => {
    // 2 hours later
    const incomingFarTime: IncomingTransaction = {
      source: "notification",
      amount: 450,
      type: "expense",
      merchant: "Zomato",
      timestamp: "2026-10-11T14:30:00.000Z"
    };

    const res = checkForDuplicate(incomingFarTime, existingTxs);
    assert.equal(res.isDuplicate, false);
  });

  // -------------------------------------------------------------
  // 5. Ingestion Pipeline & Review Status Tests (Step 3, 10, 11)
  // -------------------------------------------------------------
  console.log("\n5. Ingestion Pipeline & Review Status Tests");

  test("validates untrusted incoming transaction payload", () => {
    // Missing/invalid source
    assert.throws(
      () => validateIncomingTransaction({ source: "invalid_source", amount: 100 }),
      (err: any) => err instanceof IngestionValidationError && err.message.includes("Invalid source")
    );

    // Non-positive amount
    assert.throws(
      () => validateIncomingTransaction({ source: "notification", amount: -50 }),
      (err: any) => err instanceof IngestionValidationError && err.message.includes("Amount must be a valid positive number")
    );
  });

  test("auto-confirms high-confidence incoming transactions", () => {
    const incoming: IncomingTransaction = {
      source: "notification",
      amount: 450,
      merchant: "Zomato",
      timestamp: "2026-10-11T18:00:00.000Z",
      externalReference: `TX-TEST-${Date.now()}`
    };

    const result = ingestTransaction(incoming, { autoPersist: false });
    assert.equal(result.status, "created");
    assert.equal(result.reviewStatus, "confirmed");
    assert.ok(result.categorization.confidence >= AUTO_ACCEPT_CONFIDENCE);
    assert.equal(result.transaction?.categoryId, "food");
    assert.equal(result.transaction?.reviewStatus, "confirmed");
  });

  test("queues low/medium-confidence incoming transactions for review", () => {
    const incoming: IncomingTransaction = {
      source: "notification",
      amount: 780,
      merchant: "Unregistered Unknown Corner Shop",
      timestamp: "2026-10-11T18:30:00.000Z",
      externalReference: `TX-TEST-REV-${Date.now()}`
    };

    const result = ingestTransaction(incoming, { autoPersist: false });
    assert.equal(result.status, "pending_review");
    assert.equal(result.reviewStatus, "pending_review");
    assert.ok(result.categorization.confidence < AUTO_ACCEPT_CONFIDENCE);
    assert.equal(result.transaction?.reviewStatus, "pending_review");
  });

  // -------------------------------------------------------------
  // 6. Analytics & Budget Filtering Integrity (Step 14)
  // -------------------------------------------------------------
  console.log("\n6. Analytics & Budget Filtering Integrity");

  test("excludes pending_review and rejected transactions from analytics totals", () => {
    const month = "2026-10";
    const mixedTransactions: FinanceTransaction[] = [
      // 1. Confirmed expense -> MUST be included
      {
        id: "tx-1",
        type: "expense",
        amount: 500,
        categoryId: "food",
        timestamp: "2026-10-05T10:00:00Z",
        reviewStatus: "confirmed",
        source: "manual",
        createdAt: "2026-10-05T10:00:00Z",
        updatedAt: "2026-10-05T10:00:00Z"
      },
      // 2. Legacy transaction (reviewStatus undefined) -> MUST be included
      {
        id: "tx-2",
        type: "expense",
        amount: 300,
        categoryId: "transport",
        timestamp: "2026-10-06T10:00:00Z",
        source: "manual",
        createdAt: "2026-10-06T10:00:00Z",
        updatedAt: "2026-10-06T10:00:00Z"
      },
      // 3. Pending Review expense -> MUST BE EXCLUDED
      {
        id: "tx-3",
        type: "expense",
        amount: 1500,
        categoryId: "shopping",
        timestamp: "2026-10-07T10:00:00Z",
        reviewStatus: "pending_review",
        source: "notification",
        createdAt: "2026-10-07T10:00:00Z",
        updatedAt: "2026-10-07T10:00:00Z"
      },
      // 4. Rejected expense -> MUST BE EXCLUDED
      {
        id: "tx-4",
        type: "expense",
        amount: 2500,
        categoryId: "other",
        timestamp: "2026-10-08T10:00:00Z",
        reviewStatus: "rejected",
        source: "notification",
        createdAt: "2026-10-08T10:00:00Z",
        updatedAt: "2026-10-08T10:00:00Z"
      },
      // 5. Confirmed income -> MUST be included
      {
        id: "tx-5",
        type: "income",
        amount: 2000,
        categoryId: "salary",
        timestamp: "2026-10-01T10:00:00Z",
        reviewStatus: "confirmed",
        source: "manual",
        createdAt: "2026-10-01T10:00:00Z",
        updatedAt: "2026-10-01T10:00:00Z"
      }
    ];

    const analytics = calculateMonthlyAnalytics(mixedTransactions, month);

    // Expenses should only be 500 + 300 = 800 (NOT 800 + 1500 + 2500 = 4800)
    assert.equal(analytics.expenses, 800);
    assert.equal(analytics.income, 2000);
    assert.equal(analytics.balance, 1200);
  });

  test("excludes pending_review and rejected transactions from budget progress", () => {
    const month = "2026-10";
    const foodBudget: Budget = {
      id: "b-food",
      categoryId: "food",
      month,
      limit: 1000,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z"
    };

    const mixedTransactions: FinanceTransaction[] = [
      // Confirmed: 400
      {
        id: "tx-1",
        type: "expense",
        amount: 400,
        categoryId: "food",
        timestamp: "2026-10-02T10:00:00Z",
        reviewStatus: "confirmed",
        source: "manual",
        createdAt: "2026-10-02T10:00:00Z",
        updatedAt: "2026-10-02T10:00:00Z"
      },
      // Pending review: 800 (If counted, would exceed budget 1200 > 1000)
      {
        id: "tx-2",
        type: "expense",
        amount: 800,
        categoryId: "food",
        timestamp: "2026-10-03T10:00:00Z",
        reviewStatus: "pending_review",
        source: "notification",
        createdAt: "2026-10-03T10:00:00Z",
        updatedAt: "2026-10-03T10:00:00Z"
      }
    ];

    const db = getDatabase();
    const categories = db.categories || [{ id: "food", name: "Food & Dining", type: "expense" }];
    const progressList = calculateBudgetProgressList(month, [foodBudget], categories, mixedTransactions);
    assert.equal(progressList.length, 1);
    const progress = progressList[0];

    // Spent must be strictly 400, remaining 600, status "safe" (under 75%)
    assert.equal(progress.spent, 400);
    assert.equal(progress.remaining, 600);
    assert.equal(progress.status, "safe");
  });

  // -------------------------------------------------------------
  // 7. CSV Ingestion & Mapping Tests (Step 17, 18, 19, 20)
  // -------------------------------------------------------------
  console.log("\n7. CSV Ingestion & Mapping Tests");

  test("parses CSV content and auto-detects columns", () => {
    const sampleCSV = `Date,Description,Debit,Credit,Ref
11/10/2026,ZOMATO ONLINE,450.00,,UPI-987654
10/10/2026,UBER TRIP,320.00,,UPI-123456
09/10/2026,SALARY CREDIT,,30000.00,NEFT-SAL-OCT`;

    const parsed = parseCSV(sampleCSV);
    assert.equal(parsed.rows.length, 3);
    assert.deepEqual(parsed.headers, ["Date", "Description", "Debit", "Credit", "Ref"]);

    const mapping = autoDetectColumnMapping(parsed.headers);
    assert.equal(mapping.dateColumn, "Date");
    assert.equal(mapping.descriptionColumn, "Description");
    assert.equal(mapping.debitColumn, "Debit");
    assert.equal(mapping.creditColumn, "Credit");
    assert.equal(mapping.referenceColumn, "Ref");
  });

  await test("generates preview distinguishing auto-confirm, review, and duplicate", async () => {
    const sampleCSV = `Date,Description,Debit,Credit,Ref
11/10/2026,ZOMATO ONLINE,450.00,,UPI-CSV-ZOMATO
10/10/2026,UNRECOGNIZED STORE 999,780.00,,UPI-CSV-STORE`;

    const preview = await previewCSVImport(sampleCSV);
    assert.equal(preview.totalRows, 2);
    assert.equal(preview.items.length, 2);

    // Zomato item is ready (high confidence)
    const zomatoItem = preview.items.find((i) => i.incoming.merchant?.toLowerCase().includes("zomato"));
    assert.ok(zomatoItem);
    assert.equal(zomatoItem.status, "created");

    // Unrecognized store item requires review
    const storeItem = preview.items.find((i) => i.incoming.merchant?.toLowerCase().includes("unrecognized"));
    assert.ok(storeItem);
    assert.equal(storeItem.status, "pending_review");
  });

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n-------------------------------------------");
  console.log(`Phase 3 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log("-------------------------------------------");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests();
