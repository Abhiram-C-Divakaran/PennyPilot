import assert from "node:assert/strict";
import {
  toPaise,
  toRupees,
  addMoney,
  subtractMoney,
  safePercentage,
  safePercentageChange,
  isValidPositiveAmount
} from "../src/utils/finance";
import {
  isDateInMonth,
  getPreviousMonthKey,
  getNextMonthKey
} from "../src/utils/date";
import { validateTransactionInput, TransactionValidationError } from "../server/services/transactionService";
import { calculateBudgetProgress, calculateMonthlyBudgetSummary } from "../server/services/budgetService";
import { generateSpendingInsights } from "../server/services/insightService";
import { Budget } from "../src/types/budget";
import { FinanceTransaction } from "../src/types/transaction";
import { TransactionCategory } from "../src/types/category";

console.log("--- Starting PennyPilot Phase 2 Test Suite ---");

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

// -------------------------------------------------------------
// 1. Transaction Validations
// -------------------------------------------------------------
console.log("\n1. Transaction Validations");

test("rejects zero amount", () => {
  assert.throws(
    () => {
      validateTransactionInput({
        type: "expense",
        amount: 0,
        categoryId: "food"
      });
    },
    (err: any) => err instanceof TransactionValidationError && err.message.includes("greater than zero")
  );
});

test("rejects negative amount", () => {
  assert.throws(
    () => {
      validateTransactionInput({
        type: "expense",
        amount: -500,
        categoryId: "food"
      });
    },
    (err: any) => err instanceof TransactionValidationError && err.message.includes("greater than zero")
  );
});

test("rejects invalid/empty category", () => {
  assert.throws(
    () => {
      validateTransactionInput({
        type: "expense",
        amount: 500,
        categoryId: "non-existent-cat-999"
      });
    },
    (err: any) => err instanceof TransactionValidationError && err.message.includes("does not exist")
  );
});

test("rejects category and type mismatch (e.g. salary for expense)", () => {
  assert.throws(
    () => {
      validateTransactionInput({
        type: "expense",
        amount: 5000,
        categoryId: "salary" // salary is income category in default categories
      });
    },
    (err: any) => err instanceof TransactionValidationError && err.message.includes("is an income category, but transaction type is expense")
  );
});

// -------------------------------------------------------------
// 2. Financial Precision & Monthly Analytics Calculations
// -------------------------------------------------------------
console.log("\n2. Financial Precision & Monthly Analytics Calculations");

test("avoids JavaScript floating-point arithmetic errors (0.1 + 0.2 = 0.3)", () => {
  const sum = addMoney(0.1, 0.2);
  assert.equal(sum, 0.3);

  const diff = subtractMoney(1.0, 0.9);
  assert.equal(diff, 0.1);
});

test("accurately calculates paise and rupees conversions", () => {
  assert.equal(toPaise(1250.75), 125075);
  assert.equal(toRupees(125075), 1250.75);
  assert.equal(isValidPositiveAmount(100), true);
  assert.equal(isValidPositiveAmount(-10), false);
  assert.equal(isValidPositiveAmount(NaN), false);
});

test("calculates monthly balance and savings rate correctly", () => {
  const income = 50000;
  const expenses = 35000;
  const balance = subtractMoney(income, expenses);
  const savingsRate = safePercentage(balance, income);

  assert.equal(balance, 15000);
  assert.equal(savingsRate, 30);
});

test("income = 0 does not generate NaN or Infinity for savings rate", () => {
  const income = 0;
  const expenses = 4000;
  const balance = subtractMoney(income, expenses);
  const savingsRate = safePercentage(balance, income);

  assert.equal(balance, -4000);
  assert.equal(savingsRate, 0);
  assert.ok(!isNaN(savingsRate));
  assert.ok(isFinite(savingsRate));
});

// -------------------------------------------------------------
// 3. Budget Calculations & Status Thresholds
// -------------------------------------------------------------
console.log("\n3. Budget Calculations & Status Thresholds");

const sampleCategory: TransactionCategory = {
  id: "food",
  name: "Food & Dining",
  type: "expense",
  color: "#f59e0b",
  icon: "Utensils"
};

const sampleBudget: Budget = {
  id: "b-1",
  categoryId: "food",
  month: "2026-10",
  limit: 5000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

test("under budget (0–74%) reports 'safe' status", () => {
  const progress = calculateBudgetProgress(sampleBudget, sampleCategory, 2500); // 50%
  assert.equal(progress.spent, 2500);
  assert.equal(progress.remaining, 2500);
  assert.equal(progress.percentageUsed, 50);
  assert.equal(progress.status, "safe");
});

test("warning threshold (75–99%) reports 'warning' status", () => {
  const progress = calculateBudgetProgress(sampleBudget, sampleCategory, 4200); // 84%
  assert.equal(progress.spent, 4200);
  assert.equal(progress.remaining, 800);
  assert.equal(progress.percentageUsed, 84);
  assert.equal(progress.status, "warning");
});

test("exactly 100% reports 'over' status with 0 remaining", () => {
  const progress = calculateBudgetProgress(sampleBudget, sampleCategory, 5000); // 100%
  assert.equal(progress.spent, 5000);
  assert.equal(progress.remaining, 0);
  assert.equal(progress.percentageUsed, 100);
  assert.equal(progress.status, "over");
});

test("over budget reports 'over' status and negative remaining amount", () => {
  const progress = calculateBudgetProgress(sampleBudget, sampleCategory, 6200); // 124%
  assert.equal(progress.spent, 6200);
  assert.equal(progress.remaining, -1200);
  assert.equal(progress.percentageUsed, 124);
  assert.equal(progress.status, "over");
});

test("monthly budget summary correctly aggregates categories", () => {
  const progressList = [
    calculateBudgetProgress(sampleBudget, sampleCategory, 2500), // Safe: 2500/5000
    calculateBudgetProgress(
      { ...sampleBudget, id: "b-2", categoryId: "shopping", limit: 3000 },
      { ...sampleCategory, id: "shopping", name: "Shopping" },
      2500 // Warning: 2500/3000 (83%)
    ),
    calculateBudgetProgress(
      { ...sampleBudget, id: "b-3", categoryId: "entertainment", limit: 2000 },
      { ...sampleCategory, id: "entertainment", name: "Entertainment" },
      2800 // Over: 2800/2000 (140%)
    )
  ];

  const summary = calculateMonthlyBudgetSummary("2026-10", progressList);
  assert.equal(summary.totalBudget, 10000);
  assert.equal(summary.totalSpentInBudgetedCategories, 7800);
  assert.equal(summary.remainingBudget, 2200);
  assert.equal(summary.overallPercentage, 78);
  assert.equal(summary.categoriesOnTrack, 1);
  assert.equal(summary.categoriesWarning, 1);
  assert.equal(summary.categoriesOverBudget, 1);
  assert.equal(summary.budgetCount, 3);
});

// -------------------------------------------------------------
// 4. Trend Calculations & Month Boundaries
// -------------------------------------------------------------
console.log("\n4. Trend Calculations & Month Boundaries");

test("handles spending increase correctly", () => {
  const current = 6200;
  const previous = 4900;
  const diff = subtractMoney(current, previous);
  const pct = safePercentageChange(current, previous);

  assert.equal(diff, 1300);
  assert.equal(pct, 26.5);
});

test("handles spending decrease correctly", () => {
  const current = 1500;
  const previous = 2000;
  const diff = subtractMoney(current, previous);
  const pct = safePercentageChange(current, previous);

  assert.equal(diff, -500);
  assert.equal(pct, -25);
});

test("safe handling when previous month spending is zero", () => {
  const current = 2500;
  const previous = 0;
  const diff = subtractMoney(current, previous);
  const pct = safePercentageChange(current, previous);

  assert.equal(diff, 2500);
  assert.equal(pct, 100);
  assert.ok(!isNaN(pct));
  assert.ok(isFinite(pct));
});

test("crosses year boundary from January to previous December correctly (2027-01 -> 2026-12)", () => {
  const jan = "2027-01";
  const prev = getPreviousMonthKey(jan);
  assert.equal(prev, "2026-12");

  const next = getNextMonthKey("2026-12");
  assert.equal(next, "2027-01");
});

test("calendar month date matching correctly identifies timestamps in month", () => {
  assert.equal(isDateInMonth("2026-10-15T12:00:00Z", "2026-10"), true);
  assert.equal(isDateInMonth("2026-09-30T18:30:00Z", "2026-10"), true); // In IST (+05:30) 2026-09-30T18:30:00Z is 2026-10-01 00:00:00!
  assert.equal(isDateInMonth("2026-08-15T10:00:00Z", "2026-10"), false);
});

// -------------------------------------------------------------
// 5. Deterministic Spending Insights Engine
// -------------------------------------------------------------
console.log("\n5. Deterministic Spending Insights Engine");

const categories: TransactionCategory[] = [
  { id: "food", name: "Food & Dining", type: "expense" },
  { id: "shopping", name: "Shopping", type: "expense" },
  { id: "transport", name: "Transport", type: "expense" },
  { id: "rent", name: "Rent & Housing", type: "expense" }
];

test("generates over-budget insight (Rule 1: Critical)", () => {
  const budgets: Budget[] = [
    { id: "b-1", categoryId: "food", month: "2026-10", limit: 5000, createdAt: "", updatedAt: "" }
  ];
  const transactions: FinanceTransaction[] = [
    {
      id: "tx-1",
      type: "expense",
      amount: 6200,
      categoryId: "food",
      timestamp: "2026-10-10T10:00:00",
      source: "manual",
      createdAt: "",
      updatedAt: ""
    }
  ];

  const insights = generateSpendingInsights("2026-10", transactions, budgets, categories);
  const overInsight = insights.find((i) => i.type === "over_budget");

  assert.ok(overInsight, "Over budget insight should be generated");
  assert.equal(overInsight.severity, "critical");
  assert.equal(overInsight.categoryId, "food");
  assert.ok(overInsight.message.includes("₹1,200 over budget"));
});

test("generates approaching-budget insight (Rule 2: Warning)", () => {
  const budgets: Budget[] = [
    { id: "b-1", categoryId: "food", month: "2026-10", limit: 5000, createdAt: "", updatedAt: "" }
  ];
  const transactions: FinanceTransaction[] = [
    {
      id: "tx-1",
      type: "expense",
      amount: 4300, // 86%
      categoryId: "food",
      timestamp: "2026-10-10T10:00:00",
      source: "manual",
      createdAt: "",
      updatedAt: ""
    }
  ];

  const insights = generateSpendingInsights("2026-10", transactions, budgets, categories);
  const approaching = insights.find((i) => i.type === "approaching_budget");

  assert.ok(approaching, "Approaching budget insight should be generated");
  assert.equal(approaching.severity, "warning");
  assert.ok(approaching.message.includes("86%"));
});

test("generates spending-increase insight when category rises > 20% (Rule 3: Warning)", () => {
  const transactions: FinanceTransaction[] = [
    // Current month Food: 6200
    {
      id: "tx-1",
      type: "expense",
      amount: 6200,
      categoryId: "food",
      timestamp: "2026-10-10T10:00:00",
      source: "manual",
      createdAt: "",
      updatedAt: ""
    },
    // Previous month Food: 4900 (+26.5%)
    {
      id: "tx-2",
      type: "expense",
      amount: 4900,
      categoryId: "food",
      timestamp: "2026-09-15T10:00:00",
      source: "manual",
      createdAt: "",
      updatedAt: ""
    }
  ];

  const insights = generateSpendingInsights("2026-10", transactions, [], categories);
  const increased = insights.find((i) => i.type === "spending_increased" && i.categoryId === "food");

  assert.ok(increased, "Spending increased insight should be generated");
  assert.equal(increased.severity, "warning");
  assert.ok(increased.message.includes("26.5%"));
});

test("generates spending-improved insight when spending drops significantly (Rule 4: Positive)", () => {
  const transactions: FinanceTransaction[] = [
    // Current month Transport: 1800
    {
      id: "tx-1",
      type: "expense",
      amount: 1800,
      categoryId: "transport",
      timestamp: "2026-10-10T10:00:00",
      source: "manual",
      createdAt: "",
      updatedAt: ""
    },
    // Previous month Transport: 2500 (-28%)
    {
      id: "tx-2",
      type: "expense",
      amount: 2500,
      categoryId: "transport",
      timestamp: "2026-09-15T10:00:00",
      source: "manual",
      createdAt: "",
      updatedAt: ""
    }
  ];

  const insights = generateSpendingInsights("2026-10", transactions, [], categories);
  const improved = insights.find((i) => i.type === "spending_improved" && i.categoryId === "transport");

  assert.ok(improved, "Spending improved insight should be generated");
  assert.equal(improved.severity, "positive");
  assert.ok(improved.message.includes("28%"));
});

test("identifies largest discretionary category and excludes fixed rent (Rule 5)", () => {
  const transactions: FinanceTransaction[] = [
    {
      id: "tx-1",
      type: "expense",
      amount: 15000,
      categoryId: "rent", // Fixed expense
      timestamp: "2026-10-02T10:00:00",
      source: "manual",
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "tx-2",
      type: "expense",
      amount: 6200,
      categoryId: "food", // Highest discretionary
      timestamp: "2026-10-10T10:00:00",
      source: "manual",
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "tx-3",
      type: "expense",
      amount: 3100,
      categoryId: "shopping",
      timestamp: "2026-10-12T10:00:00",
      source: "manual",
      createdAt: "",
      updatedAt: ""
    }
  ];

  const insights = generateSpendingInsights("2026-10", transactions, [], categories);
  const largest = insights.find((i) => i.type === "largest_category");

  assert.ok(largest, "Largest discretionary category should be found");
  assert.equal(largest.categoryId, "food");
  assert.notEqual(largest.categoryId, "rent");
});

test("calculates 15% monthly and 12-month annual savings opportunity (Rule 6)", () => {
  const budgets: Budget[] = [
    { id: "b-1", categoryId: "food", month: "2026-10", limit: 5000, createdAt: "", updatedAt: "" }
  ];
  const transactions: FinanceTransaction[] = [
    {
      id: "tx-1",
      type: "expense",
      amount: 6200,
      categoryId: "food",
      timestamp: "2026-10-10T10:00:00",
      source: "manual",
      createdAt: "",
      updatedAt: ""
    }
  ];

  const insights = generateSpendingInsights("2026-10", transactions, budgets, categories);
  const savings = insights.find((i) => i.type === "potential_savings" && i.categoryId === "food");

  assert.ok(savings, "Savings opportunity should be generated for food");
  assert.equal(savings.potentialMonthlySavings, 930); // 6200 * 0.15 = 930
  assert.equal(savings.potentialAnnualSavings, 11160); // 930 * 12 = 11160
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log(`\n========================================`);
console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);
console.log(`========================================\n`);

if (testsFailed > 0) {
  process.exit(1);
}
