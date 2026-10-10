export interface PendingCooldownReward {
  id: string;
  name: string;
  coins: number;
  unlockedAt: string; // ISO date string
  status: 'pending' | 'ready' | 'claimed';
  goalId?: string;
  goalName?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  currency: string;
  avatarUrl?: string;
  saveCoins: number;
  level: number;
  xp: number;
  streak: number;
  lastCheckIn?: string; // ISO date format YYYY-MM-DD
  badges: string[];
  isPremium: boolean;
  subscriptionPlan?: "monthly" | "yearly" | "none";
  subscriptionExpires?: string;
  monthlyIncome?: number;
  saverScore?: number;
  saverScoreFactors?: {
    consistency: number;
    discipline: number;
    goalCompletion: number;
  };
  trustLevel?: "new" | "trusted" | "verified";
  cooldownRewards?: PendingCooldownReward[];
}

export type GoalCategory = 'Shopping' | 'Travel' | 'Education' | 'Emergency' | 'Other';
export type GoalStatus = 'active' | 'completed' | 'withdrawn';
export type AutoSaveFrequency = 'none' | 'daily' | 'weekly' | 'monthly';
export type GoalPriority = 'low' | 'medium' | 'high';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSavings: number;
  targetDate?: string; // ISO date string
  category: GoalCategory;
  imageUrl?: string;
  status: GoalStatus;
  createdAt: string;
  autoSaveAmount: number; // 0 if none
  autoSaveFrequency: AutoSaveFrequency;
  autoSaveNextDate?: string; // ISO date string
  priority: GoalPriority;
  milestonesRewarded?: number[]; // e.g., [25, 50, 75, 100] to avoid double reward
  verifiedSavings?: number;
  unverifiedSavingsPending?: number;
  dailyLimit?: number;
  dailyRecommended?: number;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'auto_save' | 'manual_save' | 'reward' | 'redeem';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  goalId?: string;
  goalName?: string;
  date: string; // ISO string
  description: string;
}

export interface Wallet {
  balance: number;
  transactions: WalletTransaction[];
}

export interface CoachMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string; // ISO string
}

export interface AppNotification {
  id: string;
  text: string;
  type: 'reminder' | 'milestone' | 'info' | 'success' | 'reward';
  date: string; // ISO string
  read: boolean;
}

export interface SavingChallenge {
  id: string;
  name: string;
  description: string;
  targetDaily: number;
  daysTracked: number;
  rewardCoins: number;
  joined: boolean;
  completed: boolean;
}

export interface MarketplaceReward {
  id: string;
  name: string;
  category: string;
  cost: number;
  imageUrl: string;
  description: string;
  partnerName: string;
  redeemedCount: number;
}

export interface PartnerDeal {
  id: string;
  name: string;
  triggerCategory: GoalCategory;
  couponCode: string;
  description: string;
  clicks: number;
  redemptions: number;
  logoUrl: string;
}

export interface FeedComment {
  id: string;
  user: string;
  text: string;
}

export interface FeedItem {
  id: string;
  userName: string;
  userAvatar: string;
  action: string;
  goalName?: string;
  time: string;
  likes: number;
  likedByMe: boolean;
  comments: FeedComment[];
}

export interface Friend {
  id: string;
  name: string;
  avatarUrl: string;
  level: number;
  isFollowing: boolean;
  streak: number;
}

export interface AppState {
  profile: UserProfile;
  goals: SavingsGoal[];
  wallet: Wallet;
  notifications: AppNotification[];
  chatHistory: CoachMessage[];
  challenges: SavingChallenge[];
  rewards: MarketplaceReward[];
  partnerDeals: PartnerDeal[];
  socialFeed: FeedItem[];
  friends: Friend[];
  transactions: import("./types/transaction").FinanceTransaction[];
  categories: import("./types/category").TransactionCategory[];
  budgets: import("./types/budget").Budget[];
}

export * from "./types/transaction";
export * from "./types/category";
export * from "./types/analytics";
export * from "./types/budget";
export * from "./types/insight";

