import React, { useState } from "react";
import { Shield, Trophy, Sparkles, TrendingUp, DollarSign, Calendar, Star, Lock, CheckCircle, Zap, ShieldAlert, Award } from "lucide-react";
import { motion } from "motion/react";
import { UserProfile, PendingCooldownReward } from "../types";

interface SaverScorePanelProps {
  profile: UserProfile;
  currency: string;
  onUpdateIncome: (income: number) => void;
  onClaimCooldownReward: (id: string) => void;
  onFastForwardCooldown: () => void;
}

export default function SaverScorePanel({
  profile,
  currency,
  onUpdateIncome,
  onClaimCooldownReward,
  onFastForwardCooldown
}: SaverScorePanelProps) {
  const [incomeInput, setIncomeInput] = useState<string>(
    profile.monthlyIncome !== undefined ? String(profile.monthlyIncome) : "30000"
  );
  const [isUpdatingIncome, setIsUpdatingIncome] = useState(false);
  const [incomeFeedback, setIncomeFeedback] = useState<string | null>(null);

  const score = profile.saverScore || 87;
  const factors = profile.saverScoreFactors || { consistency: 5, discipline: 4, goalCompletion: 5 };
  const trustLevel = profile.trustLevel || "trusted";

  // Score description colors and labels
  const getScoreColor = (val: number) => {
    if (val >= 90) return "text-emerald-400 border-emerald-500/30";
    if (val >= 75) return "text-cyan-400 border-cyan-500/30";
    if (val >= 50) return "text-amber-400 border-amber-500/30";
    return "text-rose-400 border-rose-500/30";
  };

  const getScoreRatingText = (val: number) => {
    if (val >= 90) return "Excellent (Highly Consistent)";
    if (val >= 75) return "Good (Trusted)";
    if (val >= 50) return "Fair (Needs Regularity)";
    return "Poor (Exploitative Behavior Flagged)";
  };

  const getTrustBadgeText = (tier: string) => {
    switch (tier) {
      case "verified":
        return "Verified Premium (No Limits)";
      case "trusted":
        return "Trusted Saver (₹1,500 Daily Cap)";
      default:
        return "New User (₹500 Daily Cap)";
    }
  };

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(incomeInput);
    if (!isNaN(parsed) && parsed >= 0) {
      setIsUpdatingIncome(true);
      onUpdateIncome(parsed);
      setTimeout(() => {
        setIsUpdatingIncome(false);
        setIncomeFeedback("Safe daily recommended savings and limits updated successfully!");
        setTimeout(() => setIncomeFeedback(null), 4000);
      }, 600);
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-4.5 w-4.5 ${
              s <= count ? "text-amber-400 fill-amber-400 stroke-amber-500" : "text-slate-800"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upper Grid - Score Ring and Factors */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Core Score Ring */}
        <div className="md:col-span-5 glass-panel rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden border border-slate-900/60 shadow-xl bg-slate-950/60">
          <div className="absolute top-3 left-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Shield className="h-3 w-3" />
            Savings Integrity Secured
          </div>

          <div className="relative h-40 w-40 flex items-center justify-center mt-4">
            {/* SVG Circle Gauge */}
            <svg className="absolute inset-0 h-full w-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="64"
                className="stroke-slate-900 fill-none"
                strokeWidth="10"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="64"
                className="stroke-emerald-500 fill-none"
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 64}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 64 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 64 * (1 - score / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center z-10">
              <span className="text-4xl font-display font-black text-slate-100">{score}</span>
              <span className="text-slate-500 text-xs block mt-0.5">Saver Score</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center mt-4 font-sans px-2">
            Status: <span className={`font-semibold ${getScoreColor(score)}`}>{getScoreRatingText(score)}</span>
          </p>

          <div className="w-full mt-4 pt-4 border-t border-slate-900 flex justify-between items-center text-xs">
            <span className="text-slate-500">Trust Level Tier:</span>
            <span className="text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-900/40 px-2.5 py-0.5 rounded-full text-[11px]">
              {getTrustBadgeText(trustLevel)}
            </span>
          </div>
        </div>

        {/* Scoring Stars and Factors */}
        <div className="md:col-span-7 glass-panel rounded-2xl p-6 border border-slate-900/60 shadow-xl bg-slate-950/60 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              Saver Score Metrics
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Your Saver Score represents your financial discipline. High scores prevent unverified deposits from triggering verification audits, increase daily saving limits, and unlock exclusive rewards.
            </p>
          </div>

          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-3 bg-slate-900/20 border border-slate-900 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-slate-200">Saving Consistency</p>
                <p className="text-[10px] text-slate-500">Maintained through daily check-ins and streaks.</p>
              </div>
              {renderStars(factors.consistency)}
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/20 border border-slate-900 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-slate-200">Deposit Discipline</p>
                <p className="text-[10px] text-slate-500">Avoiding sudden high unverified dumps.</p>
              </div>
              {renderStars(factors.discipline)}
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/20 border border-slate-900 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-slate-200">Goal Completion Rate</p>
                <p className="text-[10px] text-slate-500">Achieving targets without commitment-breaking deletions.</p>
              </div>
              {renderStars(factors.goalCompletion)}
            </div>
          </div>
        </div>
      </div>

      {/* Income Dynamic Savings Planner Configurator */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-900/60 shadow-xl bg-slate-950/60">
        <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          Dynamic Savings Planner Configurator
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Adjust your monthly income to dynamically set your recommended daily savings limits (safe savings range: 10%–20% of income). This recalculates verification thresholds across all goals.
        </p>

        <form onSubmit={handleIncomeSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">{currency}</span>
            <input
              type="number"
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value)}
              placeholder="e.g. 30000"
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/40 rounded-xl py-2.5 pl-8 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isUpdatingIncome || !incomeInput || Number(incomeInput) < 0}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-900 disabled:text-slate-600 text-slate-950 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isUpdatingIncome ? "Calculating..." : "Recalculate Limits"}
            <Zap className="h-4 w-4 fill-slate-950 stroke-none" />
          </button>
        </form>

        {incomeFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 text-xs mt-3 flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            {incomeFeedback}
          </motion.div>
        )}
      </div>

      {/* Security Cooldown and Pending Rewards */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-900/60 shadow-xl bg-slate-950/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Security Cooldown Queue (Milestone Auditing)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              To prevent exploit gaming and false completions, milestone completion bonuses (like 1,000 SaveCoins) are placed in a 7-day security audit period before release.
            </p>
          </div>

          {/* Fast forward developer tool simulation button */}
          {profile.cooldownRewards && profile.cooldownRewards.length > 0 && (
            <button
              onClick={onFastForwardCooldown}
              className="self-start sm:self-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/15 cursor-pointer transition-all shrink-0"
            >
              <Zap className="h-3.5 w-3.5 fill-slate-950" />
              Simulate 7 Days (Verify Now)
            </button>
          )}
        </div>

        {/* Cooldown Rewards List */}
        <div className="mt-4 space-y-3">
          {!profile.cooldownRewards || profile.cooldownRewards.length === 0 ? (
            <div className="p-6 text-center text-slate-600 border border-dashed border-slate-900 rounded-xl text-xs">
              No rewards currently in verification cooldown. Complete goal milestones to add to the queue.
            </div>
          ) : (
            profile.cooldownRewards.map((reward) => {
              const isReady = reward.status === "ready" || new Date(reward.unlockedAt).getTime() < Date.now();
              return (
                <motion.div
                  key={reward.id}
                  layout
                  className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl mt-0.5 ${isReady ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {isReady ? <CheckCircle className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{reward.name}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {isReady 
                          ? "Audit complete! Ready to claim."
                          : `Verification audit period: Unlocks on ${new Date(reward.unlockedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-slate-900/60 pt-3 sm:border-0 sm:pt-0">
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-amber-400">🪙 {reward.coins} SaveCoins</p>
                      <p className="text-[9px] text-slate-500">Unlock Value</p>
                    </div>
                    <button
                      disabled={!isReady}
                      onClick={() => onClaimCooldownReward(reward.id)}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-900 disabled:text-slate-600 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all"
                    >
                      Claim Reward
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
