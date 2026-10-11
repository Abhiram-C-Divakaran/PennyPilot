import { getDatabase, saveDatabase } from "../db/database";
import { MerchantRule, CreateMerchantRuleInput, CategorizationResult } from "../../src/types/merchant";
import { normalizeMerchant } from "./merchantService";

export const AUTO_ACCEPT_CONFIDENCE = 0.90;
export const REVIEW_CONFIDENCE = 0.60;

// Keyword dictionaries for fallback deterministic classification
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: [
    "restaurant", "cafe", "bistro", "bakery", "diner", "pizza", "burger",
    "dhaba", "kitchen", "biryani", "chai", "tea", "coffee", "canteen", "barbeque"
  ],
  groceries: [
    "supermarket", "grocery", "groceries", "mart", "provisions", "kirana",
    "hypermarket", "fresh", "vegetables", "fruits", "dairy", "milk"
  ],
  transport: [
    "cab", "taxi", "metro", "bus", "auto", "railway", "irctc", "toll",
    "parking", "fastag", "transit"
  ],
  fuel: [
    "petrol", "diesel", "fuel", "gas station", "cng", "service station"
  ],
  shopping: [
    "fashion", "apparel", "clothing", "electronics", "mall", "store",
    "boutique", "footwear", "shoes", "garments"
  ],
  entertainment: [
    "cinema", "movie", "theatre", "multiplex", "pvr", "inox", "gaming", "amusement"
  ],
  bills: [
    "electricity", "water bill", "broadband", "wifi", "utility", "bescom",
    "tneb", "gas bill", "postpaid", "dth"
  ],
  health: [
    "pharmacy", "hospital", "clinic", "meds", "medical", "diagnostic",
    "chemist", "dental", "pathology", "wellness"
  ],
  education: [
    "school", "college", "university", "tuition", "academy", "course",
    "udemy", "coursera", "classes"
  ],
  subscriptions: [
    "subscription", "prime", "hotstar", "youtube", "membership"
  ],
  travel: [
    "hotel", "resort", "airline", "flight", "makemytrip", "goibibo",
    "booking", "airbnb", "homestay", "lodge"
  ]
};

/**
 * Retrieve all merchant rules sorted by priority (highest first)
 */
export function getAllMerchantRules(): MerchantRule[] {
  const db = getDatabase();
  const rules = db.merchantRules || [];
  return [...rules].sort((a, b) => b.priority - a.priority || (b.userDefined ? 1 : 0) - (a.userDefined ? 1 : 0));
}

/**
 * Add or update a merchant rule (typically when user confirms or corrects a category)
 */
export function addOrUpdateMerchantRule(input: CreateMerchantRuleInput): MerchantRule {
  const db = getDatabase();
  const normalized = normalizeMerchant(input.merchant);
  if (!normalized) {
    throw new Error("Invalid merchant name for rule creation");
  }

  // Validate category exists
  const category = (db.categories || []).find((c) => c.id === input.categoryId);
  if (!category) {
    throw new Error(`Category '${input.categoryId}' does not exist`);
  }

  const rules = db.merchantRules || [];
  const existingIndex = rules.findIndex(
    (r) => r.normalizedMerchant === normalized || r.pattern === normalized
  );

  const now = new Date().toISOString();

  if (existingIndex !== -1) {
    // Update existing rule to user-defined with high priority
    const updatedRule: MerchantRule = {
      ...rules[existingIndex],
      categoryId: input.categoryId,
      paymentMethod: input.paymentMethod || rules[existingIndex].paymentMethod,
      priority: 100, // User-defined priority overrides defaults (priority 10)
      userDefined: true,
      updatedAt: now
    };
    rules[existingIndex] = updatedRule;
    saveDatabase(db);
    return updatedRule;
  }

  const newRule: MerchantRule = {
    id: `rule-usr-${normalized.replace(/\s+/g, "-")}-${Date.now()}`,
    pattern: normalized,
    normalizedMerchant: normalized,
    categoryId: input.categoryId,
    paymentMethod: input.paymentMethod,
    priority: 100,
    userDefined: true,
    createdAt: now,
    updatedAt: now
  };

  rules.unshift(newRule);
  db.merchantRules = rules;
  saveDatabase(db);
  return newRule;
}

/**
 * Categorize a transaction based on normalized merchant, raw text, and rule repository.
 * Rules are evaluated deterministically in order of priority.
 */
export function categorizeTransaction(
  normalizedMerchant: string,
  rawDescription?: string,
  rulesOverride?: MerchantRule[]
): CategorizationResult {
  const rules = rulesOverride || getAllMerchantRules();
  const db = getDatabase();
  const categories = db.categories || [];

  const getCategoryName = (id: string | null): string | undefined => {
    if (!id) return undefined;
    return categories.find((c) => c.id === id)?.name;
  };

  if (!normalizedMerchant && !rawDescription) {
    return {
      categoryId: null,
      confidence: 0,
      reason: "No merchant or description provided"
    };
  }

  const cleanMerchant = normalizedMerchant.trim().toLowerCase();
  const cleanRaw = (rawDescription || "").trim().toLowerCase();

  // 1. Exact merchant match against rules
  for (const rule of rules) {
    const pattern = rule.pattern.toLowerCase();
    const ruleMerchant = rule.normalizedMerchant.toLowerCase();

    // Exact match on normalized merchant or pattern
    if (cleanMerchant === pattern || cleanMerchant === ruleMerchant) {
      const confidence = rule.userDefined ? 0.99 : 0.98;
      const reason = rule.userDefined
        ? `Matched user-defined rule for '${rule.normalizedMerchant}'`
        : `Matched learned merchant rule for '${rule.normalizedMerchant}'`;

      return {
        categoryId: rule.categoryId,
        confidence,
        matchedRuleId: rule.id,
        reason,
        suggestedCategoryName: getCategoryName(rule.categoryId)
      };
    }
  }

  // 2. Substring / pattern match on rules
  for (const rule of rules) {
    const pattern = rule.pattern.toLowerCase();
    if (pattern.length >= 3) {
      if (cleanMerchant.includes(pattern) || (cleanRaw && cleanRaw.includes(pattern))) {
        const confidence = rule.userDefined ? 0.95 : 0.90;
        const reason = `Matched merchant pattern '${rule.pattern}'`;

        return {
          categoryId: rule.categoryId,
          confidence,
          matchedRuleId: rule.id,
          reason,
          suggestedCategoryName: getCategoryName(rule.categoryId)
        };
      }
    }
  }

  // 3. Keyword-based classification in merchant or raw description
  const textToScan = `${cleanMerchant} ${cleanRaw}`;
  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(textToScan)) {
        return {
          categoryId: catId,
          confidence: 0.78,
          reason: `Detected keyword '${kw}' in transaction text`,
          suggestedCategoryName: getCategoryName(catId)
        };
      }
    }
  }

  // 4. No match found
  return {
    categoryId: null,
    confidence: 0,
    reason: "Unrecognized merchant and no keyword matches"
  };
}
