import fs from "fs";
import path from "path";
import { defaultSeedData, defaultCategories, defaultTransactions } from "./seed";
import { FinanceTransaction } from "../../src/types/transaction";
import { TransactionCategory } from "../../src/types/category";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

export interface DatabaseSchema {
  profile: any;
  goals: any[];
  wallet: any;
  transactions: FinanceTransaction[];
  categories: TransactionCategory[];
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
 * Reads and safely hydrates the database.
 * If data/db.json is missing or corrupted, initialises with default seed data.
 * If transactions or categories are missing from an existing database, hydrates them cleanly.
 */
export function getDatabase(): DatabaseSchema {
  ensureDataDirectory();

  if (!fs.existsSync(DB_PATH)) {
    saveDatabase(defaultSeedData);
    return JSON.parse(JSON.stringify(defaultSeedData));
  }

  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const data = JSON.parse(raw);

    let needsSave = false;

    // Hydrate categories if missing or empty
    if (!Array.isArray(data.categories) || data.categories.length === 0) {
      data.categories = defaultCategories;
      needsSave = true;
    }

    // Hydrate transactions if missing
    if (!Array.isArray(data.transactions)) {
      data.transactions = defaultTransactions;
      needsSave = true;
    }

    // Ensure other arrays are at least initialized
    if (!Array.isArray(data.goals)) {
      data.goals = [];
      needsSave = true;
    }
    if (!data.wallet) {
      data.wallet = { balance: 0, transactions: [] };
      needsSave = true;
    }
    if (!data.profile) {
      data.profile = defaultSeedData.profile;
      needsSave = true;
    }

    if (needsSave) {
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
