import { PaymentMethod } from "./transaction";

export interface MerchantRule {
  id: string;
  pattern: string;
  normalizedMerchant: string;
  categoryId: string;
  paymentMethod?: PaymentMethod;
  priority: number;
  userDefined: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMerchantRuleInput {
  merchant: string;
  categoryId: string;
  paymentMethod?: PaymentMethod;
}

export interface CategorizationResult {
  categoryId: string | null;
  confidence: number;
  matchedRuleId?: string;
  reason: string;
  suggestedCategoryName?: string;
}
