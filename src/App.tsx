import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, Plus } from "lucide-react";
import Header from "./components/Header";
import { BottomNavigation, NavigationTab } from "./components/BottomNavigation";
import { Dashboard } from "./features/dashboard/Dashboard";
import { TransactionList } from "./features/transactions/TransactionList";
import { TransactionForm } from "./features/transactions/TransactionForm";
import { BudgetScreen } from "./features/budget/BudgetScreen";
import { InsightsScreen } from "./features/insights/InsightsScreen";
import { GoalsView } from "./features/goals/GoalsView";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from "./api/transactions";
import { getCategories } from "./api/categories";
import {
  getMonthlyAnalytics,
  getCategorySpending,
  getMonthlyTrends,
  getCategoryTrends
} from "./api/analytics";
import {
  getBudgets,
  getBudgetProgress,
  getBudgetSummary,
  createBudget,
  updateBudget,
  deleteBudget
} from "./api/budgets";
import { getSpendingInsights } from "./api/insights";
import {
  FinanceTransaction,
  CreateTransactionInput,
  UpdateTransactionInput
} from "./types/transaction";
import { TransactionCategory } from "./types/category";
import {
  MonthlyAnalytics,
  CategorySpendingItem,
  MonthlySpendingTrend,
  CategoryTrend
} from "./types/analytics";
import {
  Budget,
  BudgetProgress,
  MonthlyBudgetSummary,
  CreateBudgetInput,
  UpdateBudgetInput
} from "./types/budget";
import { SpendingInsight } from "./types/insight";
import { UserProfile, SavingsGoal, Wallet as WalletType, AppNotification } from "./types";
import { getCurrentMonthKey } from "./utils/date";

export default function App() {
  // Navigation: "home" | "transactions" | "budget" | "insights" | "goals"
  const [activeTab, setActiveTab] = useState<NavigationTab>("home");

  // Shared Month Selection (Step 14 - synchronized across all screens)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthKey());

  // Finance Tracker State
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState<MonthlyAnalytics>({
    month: getCurrentMonthKey(),
    income: 0,
    expenses: 0,
    balance: 0,
    savingsRate: 0
  });
  const [categorySpending, setCategorySpending] = useState<CategorySpendingItem[]>([]);

  // Phase 2: Budgets State
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<MonthlyBudgetSummary>({
    month: getCurrentMonthKey(),
    totalBudget: 0,
    totalSpentInBudgetedCategories: 0,
    remainingBudget: 0,
    overallPercentage: 0,
    categoriesOnTrack: 0,
    categoriesWarning: 0,
    categoriesOverBudget: 0,
    budgetCount: 0
  });
  const [budgetError, setBudgetError] = useState<string | null>(null);

  // Phase 2: Insights & Trends State
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [trends, setTrends] = useState<MonthlySpendingTrend>({
    currentMonth: getCurrentMonthKey(),
    previousMonth: "",
    currentExpenses: 0,
    previousExpenses: 0,
    expenseChangeAmount: 0,
    expenseChangePercentage: 0,
    currentIncome: 0,
    previousIncome: 0,
    incomeChangeAmount: 0,
    incomeChangePercentage: 0
  });
  const [categoryTrends, setCategoryTrends] = useState<CategoryTrend[]>([]);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Savings Goals & Profile State (Preserved for goals flow)
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [walletError, setWalletError] = useState<string | undefined>(undefined);

  // Transaction Form / Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinanceTransaction | null>(null);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync Finance Data for Selected Month
  const syncFinanceData = useCallback(async (month: string) => {
    try {
      const [txs, cats, analytics, spending] = await Promise.all([
        getTransactions(),
        getCategories(),
        getMonthlyAnalytics(month),
        getCategorySpending(month)
      ]);

      setTransactions(txs);
      setCategories(cats);
      setMonthlyAnalytics(analytics);
      setCategorySpending(spending);
    } catch (err) {
      console.error("Failed to sync finance data:", err);
    }
  }, []);

  // Sync Phase 2 Budget Data for Selected Month
  const syncBudgetData = useCallback(async (month: string) => {
    setBudgetError(null);
    try {
      const [bList, bProg, bSum] = await Promise.all([
        getBudgets(month),
        getBudgetProgress(month),
        getBudgetSummary(month)
      ]);
      setBudgets(bList);
      setBudgetProgress(bProg);
      setBudgetSummary(bSum);
    } catch (err: any) {
      console.error("Failed to sync budget data:", err);
      setBudgetError(err?.message || "Could not load budgets.");
    }
  }, []);

  // Sync Phase 2 Insights & Trends for Selected Month
  const syncInsightsData = useCallback(async (month: string) => {
    setInsightsError(null);
    try {
      const [ins, tr, catTr] = await Promise.all([
        getSpendingInsights(month),
        getMonthlyTrends(month),
        getCategoryTrends(month)
      ]);
      setInsights(ins);
      setTrends(tr);
      setCategoryTrends(catTr);
    } catch (err: any) {
      console.error("Failed to sync insights data:", err);
      setInsightsError(err?.message || "Could not load insights.");
    }
  }, []);

  // Sync Legacy Goals & Wallet Data
  const syncGoalsData = useCallback(async () => {
    try {
      const [pRes, gRes, wRes, nRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/goals"),
        fetch("/api/wallet"),
        fetch("/api/notifications")
      ]);

      const [pData, gData, wData, nData] = await Promise.all([
        pRes.json(),
        gRes.json(),
        wRes.json(),
        nRes.json()
      ]);

      setProfile(pData);
      setGoals(gData);
      setWallet(wData);
      setNotifications(nData);
    } catch (err) {
      console.error("Failed to sync goals data:", err);
    }
  }, []);

  // Sync all data when selected month changes
  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        syncFinanceData(selectedMonth),
        syncBudgetData(selectedMonth),
        syncInsightsData(selectedMonth),
        syncGoalsData()
      ]);
      setIsLoading(false);
    };
    loadAll();
  }, [selectedMonth, syncFinanceData, syncBudgetData, syncInsightsData, syncGoalsData]);

  // Handle Month Change from any screen
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
  };

  // Handle Mark Notifications Read
  const handleMarkNotificationsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read", { method: "POST" });
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Open Form to Add New Transaction
  const handleOpenAddTransaction = () => {
    setSelectedTransaction(null);
    setIsFormOpen(true);
  };

  // Open Form to Edit Transaction
  const handleOpenEditTransaction = (tx: FinanceTransaction) => {
    setSelectedTransaction(tx);
    setIsFormOpen(true);
  };

  // Save Transaction (Add or Edit)
  const handleSaveTransaction = async (data: CreateTransactionInput | UpdateTransactionInput) => {
    try {
      if (selectedTransaction) {
        await updateTransaction(selectedTransaction.id, data);
        showToast("Transaction updated successfully", "success");
      } else {
        await createTransaction(data as CreateTransactionInput);
        showToast("Transaction recorded successfully", "success");
      }
      await Promise.all([
        syncFinanceData(selectedMonth),
        syncBudgetData(selectedMonth),
        syncInsightsData(selectedMonth)
      ]);
    } catch (err: any) {
      showToast(err?.message || "Failed to save transaction", "error");
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      showToast("Transaction deleted", "success");
      await Promise.all([
        syncFinanceData(selectedMonth),
        syncBudgetData(selectedMonth),
        syncInsightsData(selectedMonth)
      ]);
    } catch (err: any) {
      showToast(err?.message || "Failed to delete transaction", "error");
    }
  };

  // Budget Handlers (Step 4 & 8)
  const handleCreateBudget = async (data: CreateBudgetInput) => {
    try {
      await createBudget(data);
      showToast("Budget saved successfully", "success");
      await Promise.all([
        syncBudgetData(selectedMonth),
        syncInsightsData(selectedMonth)
      ]);
    } catch (err: any) {
      showToast(err?.message || "Failed to create budget", "error");
      throw err;
    }
  };

  const handleUpdateBudget = async (id: string, data: UpdateBudgetInput) => {
    try {
      await updateBudget(id, data);
      showToast("Budget updated successfully", "success");
      await Promise.all([
        syncBudgetData(selectedMonth),
        syncInsightsData(selectedMonth)
      ]);
    } catch (err: any) {
      showToast(err?.message || "Failed to update budget", "error");
      throw err;
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await deleteBudget(id);
      showToast("Budget removed", "success");
      await Promise.all([
        syncBudgetData(selectedMonth),
        syncInsightsData(selectedMonth)
      ]);
    } catch (err: any) {
      showToast(err?.message || "Failed to delete budget", "error");
      throw err;
    }
  };

  // Goal APIs Handlers
  const handleCreateGoal = async (goalData: any) => {
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData)
      });
      if (res.ok) {
        showToast("Savings goal created", "success");
        await syncGoalsData();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to create goal", "error");
    }
  };

  const handleQuickSave = async (goalId: string, amount: number, source?: string) => {
    setWalletError(undefined);
    try {
      const res = await fetch(`/api/goals/${goalId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, source })
      });
      const data = await res.json();
      if (!res.ok) {
        setWalletError(data.error);
        setActiveTab("goals");
        showToast(data.error || "Failed to allocate funds", "error");
        return;
      }
      showToast(`Added ₹${amount.toLocaleString()} to goal!`, "success");
      await syncGoalsData();
    } catch (err) {
      console.error(err);
      showToast("Failed to save to goal", "error");
    }
  };

  const handleVerifyPending = async (goalId: string) => {
    try {
      const res = await fetch(`/api/goals/${goalId}/verify-pending`, { method: "POST" });
      if (res.ok) {
        await syncGoalsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWithdrawGoal = async (goalId: string) => {
    try {
      const res = await fetch(`/api/goals/${goalId}/withdraw`, { method: "POST" });
      if (res.ok) {
        showToast("Goal funds withdrawn to wallet", "success");
        await syncGoalsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const res = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Goal removed", "success");
        await syncGoalsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDepositWallet = async (amount: number) => {
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      if (res.ok) {
        showToast(`Deposited ₹${amount.toLocaleString()} to wallet`, "success");
        await syncGoalsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWithdrawWallet = async (amount: number) => {
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      if (res.ok) {
        showToast(`Withdrawn ₹${amount.toLocaleString()} from wallet`, "success");
        await syncGoalsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentDateStr = new Date().toISOString().split("T")[0];
  const currentTimeStr = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  // Determine top alert for Dashboard
  const topInsight =
    insights.find((i) => i.severity === "critical") ||
    insights.find((i) => i.severity === "warning") ||
    insights[0] ||
    null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-start justify-center p-0 md:p-6 select-none font-sans">
      {/* Framing Wrapper for Mobile-First Aesthetic */}
      <div className="w-full max-w-md md:max-w-3xl min-h-screen md:min-h-[840px] md:rounded-3xl bg-slate-950 md:border md:border-slate-800/80 md:shadow-2xl md:shadow-black flex flex-col overflow-hidden relative">
        {/* Dynamic Status Bar */}
        <div className="hidden md:flex justify-between items-center bg-slate-950 px-6 py-1.5 border-b border-slate-900 text-[10px] font-mono text-slate-500">
          <span>Carrier: PennyPilot Net</span>
          <div className="flex items-center space-x-2">
            <span>{currentDateStr}</span>
            <span>{currentTimeStr}</span>
          </div>
        </div>

        {/* Header */}
        <Header
          profile={
            profile || {
              name: "Demo User",
              currency: "₹",
              saveCoins: 0,
              level: 1,
              streak: 0,
              isPremium: false,
              badges: []
            }
          }
          walletBalance={wallet?.balance || 0}
          notifications={notifications}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onOpenDeposit={() => setActiveTab("goals")}
          currency="₹"
        />

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="absolute top-16 left-4 right-4 z-50 flex items-center justify-center pointer-events-none">
            <div
              className={`py-2 px-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 pointer-events-auto backdrop-blur-md animate-in slide-in-from-top duration-200 ${
                toastMessage.type === "success"
                  ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-500/10"
                  : "bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-500/10"
              }`}
            >
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading tracker data...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: Home Dashboard */}
              {activeTab === "home" && (
                <Dashboard
                  selectedMonth={selectedMonth}
                  onMonthChange={handleMonthChange}
                  monthlyAnalytics={monthlyAnalytics}
                  categorySpending={categorySpending}
                  budgetSummary={budgetSummary}
                  topInsight={topInsight}
                  recentTransactions={transactions.slice(0, 5)}
                  categories={categories}
                  goals={goals}
                  onAddTransaction={handleOpenAddTransaction}
                  onSelectTransaction={handleOpenEditTransaction}
                  onViewAllTransactions={() => setActiveTab("transactions")}
                  onViewBudgets={() => setActiveTab("budget")}
                  onViewInsights={() => setActiveTab("insights")}
                  onViewAllGoals={() => setActiveTab("goals")}
                />
              )}

              {/* TAB 2: Transactions History */}
              {activeTab === "transactions" && (
                <TransactionList
                  transactions={transactions}
                  categories={categories}
                  onSelectTransaction={handleOpenEditTransaction}
                  onAddTransaction={handleOpenAddTransaction}
                />
              )}

              {/* TAB 3: Category Budgets (Phase 2 Step 7) */}
              {activeTab === "budget" && (
                <BudgetScreen
                  selectedMonth={selectedMonth}
                  onMonthChange={handleMonthChange}
                  budgets={budgets}
                  budgetProgress={budgetProgress}
                  budgetSummary={budgetSummary}
                  categories={categories}
                  isLoading={false}
                  error={budgetError}
                  onRetry={() => syncBudgetData(selectedMonth)}
                  onCreateBudget={handleCreateBudget}
                  onUpdateBudget={handleUpdateBudget}
                  onDeleteBudget={handleDeleteBudget}
                />
              )}

              {/* TAB 4: Spending Insights & Trends (Phase 2 Step 12) */}
              {activeTab === "insights" && (
                <InsightsScreen
                  selectedMonth={selectedMonth}
                  onMonthChange={handleMonthChange}
                  insights={insights}
                  trend={trends}
                  categoryTrends={categoryTrends}
                  isLoading={false}
                  error={insightsError}
                  onRetry={() => syncInsightsData(selectedMonth)}
                />
              )}

              {/* TAB 5: Savings Goals (Preserved Feature) */}
              {activeTab === "goals" && (
                <GoalsView
                  goals={goals}
                  wallet={wallet}
                  profile={profile}
                  onRefresh={syncGoalsData}
                  onCreateGoal={handleCreateGoal}
                  onQuickSave={handleQuickSave}
                  onVerifyPending={handleVerifyPending}
                  onWithdrawGoal={handleWithdrawGoal}
                  onDeleteGoal={handleDeleteGoal}
                  onDepositWallet={handleDepositWallet}
                  onWithdrawWallet={handleWithdrawWallet}
                  walletError={walletError}
                />
              )}
            </>
          )}
        </main>

        {/* Floating Add Transaction Action Button */}
        <button
          type="button"
          onClick={handleOpenAddTransaction}
          className="fixed bottom-20 right-4 sm:right-6 md:right-10 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-zinc-950 font-bold flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all ring-4 ring-zinc-950 cursor-pointer"
          aria-label="Add Transaction"
          title="Add Transaction"
        >
          <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
        </button>

        {/* Bottom Navigation */}
        <BottomNavigation
          currentTab={activeTab}
          onSelectTab={setActiveTab}
          onAddClick={handleOpenAddTransaction}
        />

        {/* Transaction Modal (Add / Edit) */}
        <TransactionForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedTransaction}
          categories={categories}
          onSubmit={handleSaveTransaction}
          onDelete={selectedTransaction ? handleDeleteTransaction : undefined}
        />
      </div>
    </div>
  );
}
