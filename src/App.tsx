import React, { useState, useEffect } from "react";
import { LayoutGrid, Wallet, LineChart, MessageSquarePlus, Sparkles, Bell, Plus, Compass, AlertCircle, Info, Trophy, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, SavingsGoal, Wallet as WalletType, AppNotification, CoachMessage, SavingChallenge, MarketplaceReward, PartnerDeal, FeedItem, Friend } from "./types";
import Header from "./components/Header";
import GoalCard from "./components/GoalCard";
import SavingsWallet from "./components/SavingsWallet";
import Analytics from "./components/Analytics";
import AICoach from "./components/AICoach";
import GoalModal from "./components/GoalModal";
import Celebration from "./components/Celebration";
import GoalSaveClub from "./components/GoalSaveClub";
import SaverScorePanel from "./components/SaverScorePanel";

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "club" | "wallet" | "analytics" | "coach" | "integrity">("dashboard");

  // App State fetched from Server
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [chatHistory, setChatHistory] = useState<CoachMessage[]>([]);
  
  // Phase 2 states
  const [challenges, setChallenges] = useState<SavingChallenge[]>([]);
  const [rewards, setRewards] = useState<MarketplaceReward[]>([]);
  const [partnerDeals, setPartnerDeals] = useState<PartnerDeal[]>([]);
  const [socialFeed, setSocialFeed] = useState<FeedItem[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  // UI Control states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [celebratedGoal, setCelebratedGoal] = useState<{ name: string; amount: number } | null>(null);
  const [walletError, setWalletError] = useState<string | undefined>(undefined);
  const [isCoachSending, setIsCoachSending] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  // Sync state from Express API
  const syncState = async () => {
    try {
      const [pRes, gRes, wRes, nRes, cRes, chRes, rwRes, pdRes, sfRes, frRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/goals"),
        fetch("/api/wallet"),
        fetch("/api/notifications"),
        fetch("/api/coach/history"),
        fetch("/api/challenges"),
        fetch("/api/rewards"),
        fetch("/api/partners"),
        fetch("/api/social/feed"),
        fetch("/api/social/friends")
      ]);

      const [pData, gData, wData, nData, cData, chData, rwData, pdData, sfData, frData] = await Promise.all([
        pRes.json(),
        gRes.json(),
        wRes.json(),
        nRes.json(),
        cRes.json(),
        chRes.json(),
        rwRes.json(),
        pdRes.json(),
        sfRes.json(),
        frRes.json()
      ]);

      setProfile(pData);
      setGoals(gData);
      setWallet(wData);
      setNotifications(nData);
      setChatHistory(cData);
      setChallenges(chData);
      setRewards(rwData);
      setPartnerDeals(pdData);
      setSocialFeed(sfData);
      setFriends(frData);
      setIsConnecting(false);
    } catch (err) {
      console.error("Failed to sync backend state:", err);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    syncState();
  }, []);

  // API Call: Mark notifications as read
  const handleMarkNotificationsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read", { method: "POST" });
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Create Goal
  const handleCreateGoal = async (goalData: any) => {
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData)
      });
      if (res.ok) {
        syncState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Quick save manual funds with source verification
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
        // Switch tab to wallet automatically to show error and prompt deposit
        setActiveTab("wallet");
        return;
      }

      // Check if goal completed
      if (data.goal && data.goal.status === "completed") {
        setCelebratedGoal({ name: data.goal.name, amount: data.goal.targetAmount });
        setIsCelebrationOpen(true);
      }

      syncState();
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Verify pending unverified savings portion
  const handleVerifyPending = async (goalId: string) => {
    try {
      const res = await fetch(`/api/goals/${goalId}/verify-pending`, { method: "POST" });
      if (res.ok) {
        syncState();
      }
    } catch (err) {
      console.error("Failed to verify pending savings:", err);
    }
  };

  // API Call: Update profile monthly income to recalculate recommended daily ranges
  const handleUpdateIncome = async (income: number) => {
    try {
      const res = await fetch("/api/profile/update-income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ income })
      });
      if (res.ok) {
        syncState();
      }
    } catch (err) {
      console.error("Failed to update income:", err);
    }
  };

  // API Call: Claim ready cooldown rewards
  const handleClaimCooldownReward = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/cooldown/${id}/claim`, { method: "POST" });
      if (res.ok) {
        syncState();
      }
    } catch (err) {
      console.error("Failed to claim cooldown reward:", err);
    }
  };

  // API Call: Fast forward 7-day security audit cooldown
  const handleFastForwardCooldown = async () => {
    try {
      const res = await fetch("/api/profile/cooldown/fast-forward", { method: "POST" });
      if (res.ok) {
        syncState();
      }
    } catch (err) {
      console.error("Failed to fast forward security cooldown:", err);
    }
  };

  // API Call: Withdraw completed goal
  const handleWithdrawGoal = async (goalId: string) => {
    try {
      const res = await fetch(`/api/goals/${goalId}/withdraw`, { method: "POST" });
      if (res.ok) {
        syncState();
        // Shift tab to wallet to view completed funds deposit
        setActiveTab("wallet");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Deposit wallet balance
  const handleWalletDeposit = async (amount: number) => {
    setWalletError(undefined);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      if (res.ok) {
        syncState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Withdraw wallet balance
  const handleWalletWithdraw = async (amount: number) => {
    setWalletError(undefined);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      if (res.ok) {
        syncState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Send Coach Message
  const handleSendCoachMessage = async (text: string) => {
    setIsCoachSending(true);
    // Optimistic User Msg append
    const tempUserMsg = {
      id: "temp-" + Date.now(),
      sender: "user" as const,
      text,
      timestamp: new Date().toISOString()
    };
    setChatHistory((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      setChatHistory(data.history);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCoachSending(false);
    }
  };

  // API Call: Clear Coach Chat history
  const handleClearChatHistory = async () => {
    try {
      const res = await fetch("/api/coach/clear", { method: "POST" });
      const data = await res.json();
      setChatHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (isConnecting || !profile || !wallet) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl animate-bounce">
          <span className="font-display font-extrabold text-2xl text-slate-950">G</span>
        </div>
        <h2 className="text-sm font-mono font-medium text-slate-400 mt-4 tracking-widest uppercase">
          Initializing GoalSave Engine...
        </h2>
      </div>
    );
  }

  const currencySymbol = profile.currency;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-start justify-center p-0 md:p-6 select-none font-sans">
      {/* 
        Phone Framing Wrapper for Mobile-First Aesthetic:
        Creates a gorgeously bounded phone view on desktops while filling screen perfectly on real mobile viewports.
      */}
      <div className="w-full max-w-md md:max-w-4xl min-h-screen md:min-h-[820px] md:max-h-[920px] md:rounded-3xl bg-slate-950 md:border md:border-slate-800/80 md:shadow-2xl md:shadow-black flex flex-col overflow-hidden relative">
        
        {/* Dynamic Status Bar (simulated on desktop for realistic mobile app environment, neat aesthetic detail) */}
        <div className="hidden md:flex justify-between items-center bg-slate-950 px-6 py-1.5 border-b border-slate-900 text-[10px] font-mono text-slate-600">
          <span>Carrier: GoalSave Net</span>
          <div className="flex items-center space-x-1.5">
            <span>2026-07-19</span>
            <span>09:43 AM</span>
          </div>
        </div>

        {/* Header (Branding, Wallet balance, notifications tray) */}
        <Header
          profile={profile}
          walletBalance={wallet.balance}
          notifications={notifications}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onOpenDeposit={() => {
            setActiveTab("wallet");
          }}
          currency={currencySymbol}
        />

        {/* Content Panel Area */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 pb-24">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Active Milestones Panel Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-extrabold text-xl text-slate-100 tracking-tight">Active Milestones</h2>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Saving toward {goals.filter((g) => g.status === "active").length} goals.
                    </p>
                  </div>
                  
                  <button
                    id="create-goal-btn"
                    onClick={() => setIsGoalModalOpen(true)}
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Goal</span>
                  </button>
                </div>

                {/* Goals bento grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals.length === 0 ? (
                    <div className="col-span-2 glass-panel p-10 rounded-2xl text-center space-y-4">
                      <Compass className="h-10 w-10 text-slate-600 mx-auto" />
                      <div>
                        <h4 className="font-bold text-sm text-slate-300">No active savings goals found</h4>
                        <p className="text-xs text-slate-500 max-w-[70%] mx-auto mt-1">
                          Define your purchase goals (vacation, watch, car, emergencies) to set up automatic saving systems.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsGoalModalOpen(true)}
                        className="py-1.5 px-4 bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold rounded-xl hover:border-emerald-500/20 transition-all"
                      >
                        Create Goal Now
                      </button>
                    </div>
                  ) : (
                    goals
                      .filter((g) => g.status !== "withdrawn")
                      .map((g) => (
                        <GoalCard
                          key={g.id}
                          goal={g}
                          currency={currencySymbol}
                          onQuickSave={handleQuickSave}
                          onWithdraw={handleWithdrawGoal}
                          onSelect={(g) => {
                            // Can extend in future for full specs
                          }}
                          onVerifyPending={handleVerifyPending}
                        />
                      ))
                  )}
                </div>

                {/* Simulated Bank Info bar for mobile-first app fidelity */}
                <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-2xl flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed font-sans">
                  <Info className="h-4 w-4 text-emerald-500/50 flex-shrink-0 mt-0.5" />
                  <span>
                    Your automatic weekly saves transfer at **12:00 PM** on schedule days. To link a secondary external debit/payment method, chat with your **AI Savings Coach**.
                  </span>
                </div>
              </motion.div>
            )}

            {activeTab === "club" && (
              <motion.div
                key="club"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <GoalSaveClub
                  challenges={challenges}
                  rewards={rewards}
                  partnerDeals={partnerDeals}
                  socialFeed={socialFeed}
                  friends={friends}
                  profile={profile}
                  currency={currencySymbol}
                  onSyncState={syncState}
                />
              </motion.div>
            )}

            {activeTab === "wallet" && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <SavingsWallet
                  wallet={wallet}
                  currency={currencySymbol}
                  onDeposit={handleWalletDeposit}
                  onWithdraw={handleWalletWithdraw}
                  error={walletError}
                />
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Analytics goals={goals} transactions={wallet.transactions} currency={currencySymbol} />
              </motion.div>
            )}

            {activeTab === "coach" && (
              <motion.div
                key="coach"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <AICoach
                  chatHistory={chatHistory}
                  onSendMessage={handleSendCoachMessage}
                  onClearHistory={handleClearChatHistory}
                  isSending={isCoachSending}
                />
              </motion.div>
            )}

            {activeTab === "integrity" && (
              <motion.div
                key="integrity"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <SaverScorePanel
                  profile={profile}
                  currency={currencySymbol}
                  onUpdateIncome={handleUpdateIncome}
                  onClaimCooldownReward={handleClaimCooldownReward}
                  onFastForwardCooldown={handleFastForwardCooldown}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Global Floating Bottom Nav Bar */}
        <nav className="absolute bottom-0 left-0 right-0 z-30 glass-panel border-t border-slate-900 px-6 py-3 flex justify-between items-center rounded-b-3xl">
          {[
            { id: "dashboard" as const, label: "Goals", icon: LayoutGrid },
            { id: "club" as const, label: "Club", icon: Trophy },
            { id: "wallet" as const, label: "Wallet", icon: Wallet },
            { id: "integrity" as const, label: "Trust", icon: Shield },
            { id: "analytics" as const, label: "Reports", icon: LineChart },
            { id: "coach" as const, label: "Coach", icon: MessageSquarePlus }
          ].map((item) => {
            const Icon = item.icon;
            const isSel = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setWalletError(undefined);
                }}
                className="flex flex-col items-center space-y-1 group focus:outline-none"
              >
                <div className={`p-1 rounded-xl transition-all relative ${isSel ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                  <Icon className="h-5 w-5" />
                  {isSel && (
                    <motion.span
                      layoutId="active-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-4 bg-emerald-400 rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isSel ? "text-slate-200" : "text-slate-500 group-hover:text-slate-300"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Modals & Celeb overlays */}
        <GoalModal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          onSubmit={handleCreateGoal}
          currency={currencySymbol}
        />

        <Celebration
          isOpen={isCelebrationOpen}
          goalName={celebratedGoal?.name || ""}
          targetAmount={celebratedGoal?.amount || 0}
          currency={currencySymbol}
          onClose={() => setIsCelebrationOpen(false)}
        />
      </div>
    </div>
  );
}
