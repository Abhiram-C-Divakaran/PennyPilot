import fs from "fs";
import path from "path";
import { defaultSeedData, defaultCategories, defaultTransactions, defaultBudgets } from "./seed";
import { FinanceTransaction } from "../../src/types/transaction";
import { TransactionCategory } from "../../src/types/category";
import { Budget } from "../../src/types/budget";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

export interface DatabaseSchema {
  profile: any;
  goals: any[];
  wallet: any;
  transactions: FinanceTransaction[];
  categories: TransactionCategory[];
  budgets: Budget[];
  notifications: any[];
  chatHistory: any[];
  challenges: any[];
  rewards: any[];
  partnerDeals: any[];
  socialFeed: any[];
  friends: any[];
  [key: string]: any;
}

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Hydrates database records to guarantee all expected fields exist
 * across migrations and backward-compatible upgrades.
 */
function hydrateDatabase(data: any): { data: DatabaseSchema; updated: boolean } {
  let updated = false;

  // Profile hydration
  if (!data.profile) {
    data.profile = JSON.parse(JSON.stringify(defaultSeedData.profile));
    updated = true;
  }
  if (data.profile.monthlyIncome === undefined) {
    data.profile.monthlyIncome = 30000;
    updated = true;
  }
  if (data.profile.saverScore === undefined) {
    data.profile.saverScore = 87;
    updated = true;
  }
  if (!data.profile.saverScoreFactors) {
    data.profile.saverScoreFactors = { consistency: 5, discipline: 4, goalCompletion: 5 };
    updated = true;
  }
  if (!data.profile.trustLevel) {
    data.profile.trustLevel = "trusted";
    updated = true;
  }
  if (!data.profile.cooldownRewards) {
    data.profile.cooldownRewards = [];
    updated = true;
  }

  // Categories hydration
  if (!Array.isArray(data.categories) || data.categories.length === 0) {
    data.categories = defaultCategories;
    updated = true;
  }

  // Transactions hydration
  if (!Array.isArray(data.transactions)) {
    data.transactions = defaultTransactions;
    updated = true;
  }

  // Budgets hydration (Phase 2)
  if (!Array.isArray(data.budgets)) {
    data.budgets = defaultBudgets;
    updated = true;
  }

  // Goals hydration
  if (!Array.isArray(data.goals)) {
    data.goals = [];
    updated = true;
  } else {
    data.goals.forEach((goal: any) => {
      if (goal.verifiedSavings === undefined) {
        goal.verifiedSavings = goal.currentSavings;
        updated = true;
      }
      if (goal.unverifiedSavingsPending === undefined) {
        goal.unverifiedSavingsPending = 0;
        updated = true;
      }

      // Calculate dailyRecommended and dailyLimit
      const target = goal.targetDate ? new Date(goal.targetDate) : new Date(Date.now() + 120 * 24 * 60 * 60 * 1000);
      const start = goal.createdAt ? new Date(goal.createdAt) : new Date();
      const totalDays = Math.max(1, Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyRec = Math.max(1, Math.ceil(goal.targetAmount / totalDays));

      let trustCap = 500;
      if (data.profile?.trustLevel === "trusted" || (data.profile?.level && data.profile.level >= 3)) {
        trustCap = 1500;
      }
      if (data.profile?.trustLevel === "verified" || (data.profile?.level && data.profile.level >= 10)) {
        trustCap = 50000;
      }

      const dailyLimit = Math.min(trustCap, Math.max(500, Math.ceil(dailyRec * 1.5)));

      if (goal.dailyRecommended !== dailyRec) {
        goal.dailyRecommended = dailyRec;
        updated = true;
      }
      if (goal.dailyLimit !== dailyLimit) {
        goal.dailyLimit = dailyLimit;
        updated = true;
      }
    });
  }

  // Wallet hydration
  if (!data.wallet) {
    data.wallet = { balance: 0, transactions: [] };
    updated = true;
  }

  // Other secondary arrays
  if (!Array.isArray(data.notifications)) {
    data.notifications = [];
    updated = true;
  }
  if (!Array.isArray(data.chatHistory)) {
    data.chatHistory = [];
    updated = true;
  }
  if (!Array.isArray(data.challenges)) {
    data.challenges = [];
    updated = true;
  }
  if (!Array.isArray(data.rewards)) {
    data.rewards = [];
    updated = true;
  }
  if (!Array.isArray(data.partnerDeals)) {
    data.partnerDeals = [];
    updated = true;
  }
  if (!Array.isArray(data.socialFeed)) {
    data.socialFeed = [];
    updated = true;
  }
  if (!Array.isArray(data.friends)) {
    data.friends = [];
    updated = true;
  }

  return { data, updated };
}

/**
 * Reads and safely hydrates the database.
 * If data/db.json is missing or corrupted, initialises with default seed data.
 * If transactions, categories, or budgets are missing from an existing database, hydrates them cleanly.
 */
export function getDatabase(): DatabaseSchema {
  ensureDataDirectory();

  if (!fs.existsSync(DB_PATH)) {
    saveDatabase(defaultSeedData);
    return JSON.parse(JSON.stringify(defaultSeedData));
  }

  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    const { data, updated } = hydrateDatabase(parsed);

    if (updated) {
      saveDatabase(data);
    }

    return data;
  } catch (err) {
    console.error("Error reading database, resetting to default seed data:", err);
    saveDatabase(defaultSeedData);
    return JSON.parse(JSON.stringify(defaultSeedData));
  }
}

/**
 * Saves current database to data/db.json
 */
export function saveDatabase(data: DatabaseSchema): void {
  ensureDataDirectory();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}
