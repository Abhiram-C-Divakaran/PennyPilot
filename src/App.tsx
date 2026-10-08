import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Header from "./components/Header";
import { BottomNavigation, NavigationTab } from "./components/BottomNavigation";
import { Dashboard } from "./features/dashboard/Dashboard";
import { TransactionList } from "./features/transactions/TransactionList";
import { TransactionForm } from "./features/transactions/TransactionForm";
import { GoalsView } from "./features/goals/GoalsView";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from "./api/transactions";
import { getCategories } from "./api/categories";
import { getMonthlyAnalytics, getCategorySpending } from "./api/analytics";
import {
  FinanceTransaction,
  CreateTransactionInput,
  UpdateTransactionInput
} from "./types/transaction";
import { TransactionCategory } from "./types/category";
import { MonthlyAnalytics, CategorySpendingItem } from "./types/analytics";
import { UserProfile, SavingsGoal, Wallet as WalletType, AppNotification } from "./types";

export default function App() {
  // Navigation: "home" | "transactions" | "goals"
  const [activeTab, setActiveTab] = useState<NavigationTab>("home");

  // Finance Tracker State
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState<MonthlyAnalytics>({
    month: new Date().toISOString().substring(0, 7),
    income: 0,
    expenses: 0,
    balance: 0,
    savingsRate: 0
  });
  const [categorySpending, setCategorySpending] = useState<CategorySpendingItem[]>([]);

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

  // Sync Finance Data (Transactions, Categories, Analytics)
  const syncFinanceData = useCallback(async () => {
    try {
      const [txs, cats, analytics, spending] = await Promise.all([
        getTransactions(),
        getCategories(),
        getMonthlyAnalytics(),
        getCategorySpending()
      ]);

      setTransactions(txs);
      setCategories(cats);
      setMonthlyAnalytics(analytics);
      setCategorySpending(spending);
    } catch (err) {
      console.error("Failed to sync finance data:", err);
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

  // Initial Load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([syncFinanceData(), syncGoalsData()]);
      setIsLoading(false);
    };
    init();
  }, [syncFinanceData, syncGoalsData]);

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
    if (selectedTransaction) {
      await updateTransaction(selectedTransaction.id, data);
      showToast("Transaction updated successfully", "success");
    } else {
      await createTransaction(data as CreateTransactionInput);
      showToast("Transaction recorded successfully", "success");
    }
    await syncFinanceData();
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
    showToast("Transaction deleted", "success");
    await syncFinanceData();
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-start justify-center p-0 md:p-6 select-none font-sans">
      {/* Phone Framing Wrapper for Mobile-First Aesthetic */}
      <div className="w-full max-w-md md:max-w-3xl min-h-screen md:min-h-[840px] md:rounded-3xl bg-slate-950 md:border md:border-slate-800/80 md:shadow-2xl md:shadow-black flex flex-col overflow-hidden relative">
        {/* Dynamic Status Bar (Realistic mobile environment, dynamic date) */}
        <div className="hidden md:flex justify-between items-center bg-slate-950 px-6 py-1.5 border-b border-slate-900 text-[10px] font-mono text-slate-500">
          <span>Carrier: GoalSave Net</span>
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
                  monthlyAnalytics={monthlyAnalytics}
                  categorySpending={categorySpending}
                  recentTransactions={transactions.slice(0, 5)}
                  categories={categories}
                  goals={goals}
                  onAddTransaction={handleOpenAddTransaction}
                  onSelectTransaction={handleOpenEditTransaction}
                  onViewAllTransactions={() => setActiveTab("transactions")}
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

              {/* TAB 3: Savings Goals */}
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
