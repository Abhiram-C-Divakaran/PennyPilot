import { TransactionCategory } from "../../src/types/category";
import { FinanceTransaction } from "../../src/types/transaction";

export const defaultCategories: TransactionCategory[] = [
  // Expense Categories
  { id: "food", name: "Food", type: "expense", icon: "UtensilsCrossed", color: "#F97316" },
  { id: "groceries", name: "Groceries", type: "expense", icon: "ShoppingBasket", color: "#10B981" },
  { id: "transport", name: "Transport", type: "expense", icon: "Car", color: "#0EA5E9" },
  { id: "fuel", name: "Fuel", type: "expense", icon: "Fuel", color: "#F59E0B" },
  { id: "shopping", name: "Shopping", type: "expense", icon: "ShoppingBag", color: "#A855F7" },
  { id: "entertainment", name: "Entertainment", type: "expense", icon: "Film", color: "#EC4899" },
  { id: "bills", name: "Bills", type: "expense", icon: "Receipt", color: "#EF4444" },
  { id: "rent", name: "Rent", type: "expense", icon: "Home", color: "#6366F1" },
  { id: "health", name: "Health", type: "expense", icon: "HeartPulse", color: "#14B8A6" },
  { id: "education", name: "Education", type: "expense", icon: "GraduationCap", color: "#3B82F6" },
  { id: "subscriptions", name: "Subscriptions", type: "expense", icon: "Repeat", color: "#8B5CF6" },
  { id: "travel", name: "Travel", type: "expense", icon: "Plane", color: "#FB923C" },
  { id: "other", name: "Other", type: "expense", icon: "MoreHorizontal", color: "#94A3B8" },

  // Income Categories
  { id: "salary", name: "Salary", type: "income", icon: "Briefcase", color: "#059669" },
  { id: "freelance", name: "Freelance", type: "income", icon: "Laptop", color: "#2563EB" },
  { id: "business", name: "Business", type: "income", icon: "Building2", color: "#4F46E5" },
  { id: "investment", name: "Investment", type: "income", icon: "TrendingUp", color: "#0D9488" },
  { id: "gift", name: "Gift", type: "income", icon: "Gift", color: "#DB2777" },
  { id: "refund", name: "Refund", type: "income", icon: "RotateCcw", color: "#D97706" },
  { id: "other_income", name: "Other Income", type: "income", icon: "Wallet", color: "#64748B" }
];

export const defaultTransactions: FinanceTransaction[] = [
  {
    id: "tx-init-1",
    type: "income",
    amount: 30000,
    categoryId: "salary",
    merchant: "Monthly Payroll",
    description: "Salary credit for current month",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "bank_transfer",
    source: "manual",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "tx-init-2",
    type: "expense",
    amount: 1850,
    categoryId: "groceries",
    merchant: "Reliance Fresh",
    description: "Weekly fruits and groceries",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "debit_card",
    source: "manual",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "tx-init-3",
    type: "expense",
    amount: 1299,
    categoryId: "shopping",
    merchant: "Amazon",
    description: "Wireless earbuds",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "credit_card",
    source: "manual",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "tx-init-4",
    type: "expense",
    amount: 450,
    categoryId: "food",
    merchant: "Zomato",
    description: "Dinner meal delivery",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "upi",
    source: "manual",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "tx-init-5",
    type: "expense",
    amount: 230,
    categoryId: "transport",
    merchant: "Uber",
    description: "City ride commute",
    timestamp: new Date().toISOString(),
    paymentMethod: "upi",
    source: "manual",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const defaultSeedData = {
  profile: {
    name: "Demo User",
    email: "demo@goalsave.app",
    phone: "+91 90000 00000",
    currency: "₹",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60",
    saveCoins: 1250,
    level: 3,
    xp: 620,
    streak: 5,
    lastCheckIn: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    badges: ["first_saver", "discipline_master"],
    isPremium: false,
    subscriptionPlan: "none",
    monthlyIncome: 30000,
    saverScore: 87,
    saverScoreFactors: {
      consistency: 5,
      discipline: 4,
      goalCompletion: 5
    },
    trustLevel: "trusted",
    cooldownRewards: []
  },
  categories: defaultCategories,
  transactions: defaultTransactions,
  goals: [
    {
      id: "goal-1",
      name: "Rolex Submariner Watch",
      targetAmount: 450000,
      currentSavings: 337500,
      targetDate: "2026-10-31",
      category: "Shopping",
      imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=500&auto=format&fit=crop&q=60",
      status: "active",
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      autoSaveAmount: 5000,
      autoSaveFrequency: "weekly",
      autoSaveNextDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high",
      milestonesRewarded: [25, 50, 75]
    },
    {
      id: "goal-2",
      name: "Vacation to Tokyo, Japan",
      targetAmount: 180000,
      currentSavings: 144000,
      targetDate: "2026-11-15",
      category: "Travel",
      imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=500&auto=format&fit=crop&q=60",
      status: "active",
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      autoSaveAmount: 4000,
      autoSaveFrequency: "weekly",
      autoSaveNextDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium",
      milestonesRewarded: [25, 50, 75]
    }
  ],
  wallet: {
    balance: 42500,
    transactions: [
      {
        id: "wtx-1",
        type: "deposit",
        amount: 50000,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Demo funds deposit"
      }
    ]
  },
  notifications: [
    {
      id: "notif-1",
      text: "Welcome to Save Tracker! Track expenses and reach your savings milestones.",
      type: "info",
      date: new Date().toISOString(),
      read: false
    }
  ],
  chatHistory: [],
  challenges: [],
  rewards: [],
  partnerDeals: [],
  socialFeed: [],
  friends: []
};
