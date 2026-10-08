import React, { useState } from "react";
import { Plus, Target, Wallet as WalletIcon, Shield, Sparkles } from "lucide-react";
import { SavingsGoal, UserProfile, Wallet as WalletType } from "../../types";
import GoalCard from "../../components/GoalCard";
import GoalModal from "../../components/GoalModal";
import SavingsWallet from "../../components/SavingsWallet";
import SaverScorePanel from "../../components/SaverScorePanel";
import Celebration from "../../components/Celebration";
import { EmptyState } from "../../components/EmptyState";
import { formatCurrency } from "../../utils/currency";

interface GoalsViewProps {
  goals: SavingsGoal[];
  wallet: WalletType | null;
  profile: UserProfile | null;
  onRefresh: () => Promise<void>;
  onCreateGoal: (goalData: any) => Promise<void>;
  onQuickSave: (goalId: string, amount: number, source?: string) => Promise<void>;
  onVerifyPending: (goalId: string) => Promise<void>;
  onWithdrawGoal: (goalId: string) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onDepositWallet: (amount: number) => Promise<void>;
  onWithdrawWallet: (amount: number) => Promise<void>;
  walletError?: string;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  wallet,
  profile,
  onRefresh,
  onCreateGoal,
  onQuickSave,
  onVerifyPending,
  onWithdrawGoal,
  onDeleteGoal,
  onDepositWallet,
  onWithdrawWallet,
  walletError
}) => {
  const [subTab, setSubTab] = useState<"goals" | "wallet" | "score">("goals");
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [celebratedGoal, setCelebratedGoal] = useState<{ name: string; amount: number } | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);

  const totalSaved = goals.reduce((acc, g) => acc + (g.currentSavings || 0), 0);
  const totalTarget = goals.reduce((acc, g) => acc + (g.targetAmount || 0), 0);

  const handleSaveWrapper = async (goalId: string, amount: number, source?: string) => {
    await onQuickSave(goalId, amount, source);
    const targetGoal = goals.find((g) => g.id === goalId);
    if (targetGoal && targetGoal.currentSavings + amount >= targetGoal.targetAmount) {
      setCelebratedGoal({ name: targetGoal.name, amount: targetGoal.targetAmount });
      setIsCelebrationOpen(true);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Savings System
          </span>
          <h2 className="text-xl font-bold text-zinc-100">Milestone Goals</h2>
        </div>
        {subTab === "goals" && (
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Goal</span>
          </button>
        )}
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setSubTab("goals")}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            subTab === "goals"
              ? "bg-zinc-800 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Goals ({goals.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab("wallet")}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            subTab === "wallet"
              ? "bg-zinc-800 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <WalletIcon className="w-4 h-4" />
          <span>Wallet</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab("score")}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            subTab === "score"
              ? "bg-zinc-800 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Saver Score</span>
        </button>
      </div>

      {/* 1. Goals Tab */}
      {subTab === "goals" && (
        <div className="space-y-4">
          {/* Total savings progress card */}
          {goals.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400">Total Saved Across Goals</span>
                <div className="text-lg font-bold text-zinc-100">{formatCurrency(totalSaved)}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-400">Combined Target</span>
                <div className="text-sm font-semibold text-zinc-300">{formatCurrency(totalTarget)}</div>
              </div>
            </div>
          )}

          {goals.length === 0 ? (
            <EmptyState
              title="No savings goals yet"
              description="Create a savings milestone like a gadget, vacation, or emergency fund to start saving."
              icon={Target}
              actionText="Create Your First Goal"
              onAction={() => setIsGoalModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  currency="₹"
                  onQuickSave={(goalId, amount, source) => handleSaveWrapper(goalId, amount, source)}
                  onVerifyPending={() => onVerifyPending(goal.id)}
                  onWithdraw={() => onWithdrawGoal(goal.id)}
                  onSelect={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Wallet Tab */}
      {subTab === "wallet" && wallet && (
        <div className="space-y-4">
          <SavingsWallet
            wallet={wallet}
            currency="₹"
            onDeposit={onDepositWallet}
            onWithdraw={onWithdrawWallet}
            error={walletError}
          />
        </div>
      )}

      {/* 3. Saver Score Tab */}
      {subTab === "score" && profile && (
        <div className="space-y-4">
          <SaverScorePanel
            profile={profile}
            currency="₹"
            onUpdateIncome={async () => {}}
            onClaimCooldownReward={async () => {}}
            onFastForwardCooldown={async () => {}}
          />
        </div>
      )}

      {/* Goal Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={async (data) => {
          await onCreateGoal(data);
          setIsGoalModalOpen(false);
          await onRefresh();
        }}
        currency="₹"
      />

      {/* Celebration Modal */}
      {celebratedGoal && (
        <Celebration
          isOpen={isCelebrationOpen}
          onClose={() => setIsCelebrationOpen(false)}
          goalName={celebratedGoal.name}
          targetAmount={celebratedGoal.amount}
          currency="₹"
        />
      )}
    </div>
  );
};
