import React, { useState } from "react";
import { 
  Flame, Trophy, Gift, ExternalLink, Heart, MessageSquare, 
  Check, CheckCircle2, Crown, Sparkles, UserCheck, UserPlus, 
  Users, Award, Coins, ArrowRight, ShieldCheck, HeartCrack,
  Clock, CheckSquare, Zap, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  UserProfile, SavingChallenge, MarketplaceReward, 
  PartnerDeal, FeedItem, Friend 
} from "../types";

interface GoalSaveClubProps {
  profile: UserProfile;
  challenges: SavingChallenge[];
  rewards: MarketplaceReward[];
  partnerDeals: PartnerDeal[];
  socialFeed: FeedItem[];
  friends: Friend[];
  currency: string;
  onSyncState: () => void;
}

export default function GoalSaveClub({
  profile,
  challenges,
  rewards,
  partnerDeals,
  socialFeed,
  friends,
  currency,
  onSyncState
}: GoalSaveClubProps) {
  // Navigation inside Club Tab
  const [subTab, setSubTab] = useState<"rewards" | "challenges" | "community" | "premium">("rewards");

  // Local interaction states
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [clickedCoupon, setClickedCoupon] = useState<{ name: string; code: string } | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [feedId: string]: string }>({});
  const [subscribing, setSubscribing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // API Call: Daily check-in
  const handleCheckIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/streak/checkin", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error);
        return;
      }
      setSuccessMsg("Check-In Complete! Streak incremented. You earned SaveCoins!");
      onSyncState();
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Recover Streak
  const handleRecoverStreak = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/streak/recover", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error);
        return;
      }
      setSuccessMsg("Safeguard applied! Your daily streak has been restored.");
      onSyncState();
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Redeem Reward
  const handleRedeemReward = async (id: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setRedeemingId(id);
    try {
      const res = await fetch(`/api/rewards/${id}/redeem`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error);
        setRedeemingId(null);
        return;
      }
      setSuccessMsg("Voucher Redeemed! Check your notifications tray for your coupon code.");
      onSyncState();
    } catch (err) {
      console.error(err);
    } finally {
      setRedeemingId(null);
    }
  };

  // API Call: Click & Claim partner deals
  const handlePartnerClick = async (deal: PartnerDeal) => {
    try {
      const res = await fetch(`/api/partners/${deal.id}/click`, { method: "POST" });
      const data = await res.json();
      setClickedCoupon({ name: deal.name, code: data.code });
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Complete Partner task
  const handlePartnerRedeem = async (id: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/partners/${id}/redeem`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Affiliate task completed! You earned bonus SaveCoins!");
        setClickedCoupon(null);
        onSyncState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Enroll challenge
  const handleJoinChallenge = async (id: string) => {
    try {
      const res = await fetch(`/api/challenges/${id}/join`, { method: "POST" });
      if (res.ok) {
        onSyncState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Log progress on challenge
  const handleChallengeProgress = async (id: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/challenges/${id}/progress`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error);
        return;
      }
      onSyncState();
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Social Like
  const handleLikeFeed = async (id: string) => {
    try {
      await fetch(`/api/social/feed/${id}/like`, { method: "POST" });
      onSyncState();
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Add comment
  const handleAddComment = async (id: string) => {
    const text = commentInputs[id];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`/api/social/feed/${id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        setCommentInputs(prev => ({ ...prev, [id]: "" }));
        onSyncState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Friend Follow
  const handleFollowFriend = async (id: string) => {
    try {
      await fetch(`/api/social/friends/${id}/follow`, { method: "POST" });
      onSyncState();
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Premium upgrade
  const handlePremiumUpgrade = async (plan: "monthly" | "yearly") => {
    setSubscribing(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      if (res.ok) {
        setSuccessMsg(`Welcome to PennyPilot Pro! Expanded milestones limits and rewards triggers are now live.`);
        setSubTab("rewards");
        onSyncState();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubscribing(false);
    }
  };

  // API Call: Premium cancel
  const handlePremiumCancel = async () => {
    setErrorMsg(null);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      if (res.ok) {
        setSuccessMsg("Subscription terminated successfully.");
        onSyncState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // XP calculation
  const nextLevelXp = 400; // 400 XP per level
  const levelProgressPct = Math.min(100, ((profile.xp % nextLevelXp) / nextLevelXp) * 100);

  const getLevelLabel = (lvl: number) => {
    if (lvl >= 20) return "Financial Champion";
    if (lvl >= 10) return "Money Master";
    if (lvl >= 5) return "Smart Saver";
    return "Beginner Saver";
  };

  const getBadgeIcon = (id: string) => {
    switch(id) {
      case "first_saver": return "🌱";
      case "discipline_master": return "🔥";
      case "smart_saver": return "🎓";
      case "money_master": return "🎯";
      case "goal_crusher": return "🏆";
      case "dream_builder": return "✨";
      default: return "🌟";
    }
  };

  const getBadgeName = (id: string) => {
    return id.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const getBadgeDesc = (id: string) => {
    switch(id) {
      case "first_saver": return "Saved your first ₹1,000 across active goals";
      case "discipline_master": return "Sustained a 30-day savings checking streak";
      case "smart_saver": return "Reached Saver Level 5";
      case "money_master": return "Reached Saver Level 10";
      case "goal_crusher": return "Successfully completed your first purchase goal";
      case "dream_builder": return "Successfully completed 10 separate savings goals";
      default: return "Achieved an exclusive PennyPilot milestone";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Alert overlays */}
      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-red-950/40 border border-red-900/50 rounded-2xl text-xs text-red-400 flex items-start gap-2"
        >
          <span className="mt-0.5">⚠️</span>
          <div className="flex-grow">
            <span className="font-semibold">Oops:</span> {errorMsg}
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400/75 hover:text-red-400 font-bold ml-2">×</button>
        </motion.div>
      )}

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-emerald-950/40 border border-emerald-900/50 rounded-2xl text-xs text-emerald-400 flex items-start gap-2"
        >
          <span className="mt-0.5">🎉</span>
          <div className="flex-grow">
            <span className="font-semibold">Success:</span> {successMsg}
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400/75 hover:text-emerald-400 font-bold ml-2">×</button>
        </motion.div>
      )}

      {/* Club Navigation Subtabs */}
      <div className="flex items-center space-x-1 p-1 bg-slate-900/80 border border-slate-800/60 rounded-2xl">
        {[
          { id: "rewards" as const, label: "Rewards", icon: Trophy },
          { id: "challenges" as const, label: "Challenges", icon: Zap },
          { id: "community" as const, label: "Community", icon: Users },
          { id: "premium" as const, label: "Premium 👑", icon: Crown }
        ].map((btn) => {
          const Icon = btn.icon;
          const active = subTab === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => {
                setSubTab(btn.id);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                active 
                  ? "bg-slate-800 text-emerald-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        
        {/* REWARDS STORE TAB */}
        {subTab === "rewards" && (
          <motion.div
            key="rewards-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* 1. Level progress, Streak card & Badges Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Daily Streak Check-in panel */}
              <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-sm text-slate-100">Savings Streak</h3>
                      <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">
                        🔥 Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Check in daily to claim bonus SaveCoins & multiply goals progression speed!
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-display font-black text-amber-400">{profile.streak}</span>
                    <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Days</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCheckIn}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black rounded-xl transition-all shadow shadow-amber-500/20"
                  >
                    Check In Today (+20 Coins)
                  </button>
                  <button
                    onClick={handleRecoverStreak}
                    className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300 rounded-xl transition-all"
                    title="Safeguard Broken Streak (Costs 100 Coins)"
                  >
                    🩹 Safeguard
                  </button>
                </div>
              </div>

              {/* Saver Progression Panel */}
              <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Saver Progression</h3>
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <span className="font-mono text-cyan-400 font-bold">Lvl {profile.level}</span>
                    <span className="text-slate-400 font-semibold">{getLevelLabel(profile.level)}</span>
                  </div>
                  
                  {/* XP progress bar */}
                  <div className="w-full h-2 bg-slate-950 rounded-full mt-2 overflow-hidden border border-slate-850">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-550"
                      style={{ width: `${levelProgressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1.5">
                    <span>{profile.xp % nextLevelXp} XP</span>
                    <span>{nextLevelXp} XP to Lvl {profile.level + 1}</span>
                  </div>
                </div>

                <div className="text-slate-400 text-[11px] leading-relaxed bg-slate-950 p-2 rounded-xl border border-slate-850/60 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                  <span>
                    Leveling up awards digital trophies and unlocks exclusive premium partner affiliate discounts!
                  </span>
                </div>
              </div>

            </div>

            {/* 2. Pro subscription promo banner */}
            {!profile.isPremium && (
              <div className="p-4 bg-gradient-to-r from-amber-600/20 via-amber-950/20 to-slate-900 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl text-amber-400 border border-amber-500/20">
                    👑
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-amber-300">Upgrade to PennyPilot Pro</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Track unlimited active goals, gain automated 1.5x SaveCoins boosts on check-ins, and receive expert personalized AI forecast blueprints. Just ₹99/mo.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSubTab("premium")}
                  className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1"
                >
                  <span>Explore Pro</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* 3. Marketplace rewards list */}
            <div>
              <div className="flex items-center space-x-1.5 mb-3">
                <Gift className="h-4 w-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-100">Redeem Marketplace</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map((rew) => {
                  const canRedeem = profile.saveCoins >= rew.cost;
                  return (
                    <div 
                      key={rew.id}
                      className="p-3 bg-slate-900 border border-slate-800/80 rounded-2xl flex items-center gap-3 hover:border-slate-850 transition-all"
                    >
                      <img 
                        src={rew.imageUrl} 
                        alt={rew.name} 
                        className="h-16 w-16 rounded-xl object-cover flex-shrink-0 bg-slate-950 border border-slate-800"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-xs text-slate-200 truncate">{rew.name}</h4>
                          <span className="text-[10px] text-slate-400 font-medium font-mono">{rew.partnerName}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{rew.description}</p>
                        
                        <div className="flex justify-between items-center mt-2.5">
                          <span className="text-xs font-mono font-black text-yellow-400">
                            🪙 {rew.cost} Coins
                          </span>
                          <button
                            disabled={!canRedeem || redeemingId === rew.id}
                            onClick={() => handleRedeemReward(rew.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              canRedeem 
                                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/10" 
                                : "bg-slate-950 text-slate-600 cursor-not-allowed border border-slate-850"
                            }`}
                          >
                            {redeemingId === rew.id ? "Redeeming..." : "Claim Voucher"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Partner Affiliate Offers */}
            <div>
              <div className="flex items-center space-x-1.5 mb-3">
                <Coins className="h-4 w-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-slate-100">Affiliate Completed Deals</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partnerDeals.map((deal) => (
                  <div 
                    key={deal.id}
                    className="p-3 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col justify-between gap-3 hover:border-slate-850 transition-all"
                  >
                    <div className="flex gap-3">
                      <img 
                        src={deal.logoUrl} 
                        alt={deal.name} 
                        className="h-10 w-10 rounded-lg object-cover bg-slate-950 border border-slate-800"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="text-[8px] bg-cyan-500/15 text-cyan-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">
                          Goal Trigger: {deal.triggerCategory}
                        </span>
                        <h4 className="font-bold text-xs text-slate-200 mt-1">{deal.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{deal.description}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center bg-slate-950 p-2 rounded-xl border border-slate-850/60 justify-between">
                      <span className="text-[10px] font-mono font-medium text-slate-500">
                        {deal.clicks} clicks • {deal.redemptions} claims
                      </span>
                      <button
                        onClick={() => handlePartnerClick(deal)}
                        className="py-1 px-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-cyan-400 hover:text-cyan-300 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1"
                      >
                        <span>Reveal Code</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Unlocked Badges Shelf */}
            <div>
              <div className="flex items-center space-x-1.5 mb-3">
                <Award className="h-4 w-4 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">Unlocked Badges Shelf</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["first_saver", "discipline_master", "smart_saver", "money_master", "goal_crusher", "dream_builder"].map((id) => {
                  const unlocked = profile.badges.includes(id);
                  return (
                    <div 
                      key={id}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                        unlocked 
                          ? "bg-slate-900/60 border-slate-800 text-slate-100" 
                          : "bg-slate-950/30 border-slate-950/50 text-slate-600 grayscale opacity-40"
                      }`}
                    >
                      <span className="text-2xl">{getBadgeIcon(id)}</span>
                      <div>
                        <h4 className="font-bold text-[10px] leading-tight">{getBadgeName(id)}</h4>
                        <p className="text-[8px] text-slate-500 mt-0.5 leading-tight">{getBadgeDesc(id)}</p>
                      </div>
                      {unlocked ? (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded-full font-mono font-bold">
                          ✓ Earned
                        </span>
                      ) : (
                        <span className="text-[8px] text-slate-700 font-mono">
                          Locked
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </motion.div>
        )}

        {/* CHALLENGES HUB TAB */}
        {subTab === "challenges" && (
          <motion.div
            key="challenges-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div>
              <h2 className="font-display font-extrabold text-lg text-slate-100 tracking-tight">Community Savings Challenges</h2>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Enroll in real-time savings challenges. Hit daily milestones, log days tracked, and collect massive SaveCoins bounties!
              </p>
            </div>

            <div className="space-y-3">
              {challenges.map((c) => {
                const targetDays = c.id === "chall-1" ? 30 : c.id === "chall-2" ? 2 : 1;
                const progressPct = Math.min(100, (c.daysTracked / targetDays) * 100);
                
                return (
                  <div 
                    key={c.id} 
                    className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm text-slate-200">{c.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-yellow-500/10 text-yellow-400 font-bold px-2 py-1 rounded-lg">
                          🪙 {c.rewardCoins} SaveCoins
                        </span>
                      </div>
                    </div>

                    {c.joined ? (
                      <div className="space-y-3 pt-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400 font-medium">Challenge Progress</span>
                          <span className="font-mono text-emerald-400 font-semibold">{c.daysTracked} / {targetDays} Days</span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                          <div 
                            className="h-full bg-emerald-400 rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center pt-1.5">
                          {c.completed ? (
                            <span className="flex items-center text-[10px] text-emerald-400 font-bold gap-1 font-sans bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Challenge Conquered!</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleChallengeProgress(c.id)}
                              className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold rounded-lg transition-all"
                            >
                              Log Progress (+1 Day)
                            </button>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">
                            {c.completed ? "Rewarded!" : "Save on track!"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center pt-2 border-t border-slate-850/60">
                        <span className="text-[10px] text-slate-500 leading-none">Not enrolled</span>
                        <button
                          onClick={() => handleJoinChallenge(c.id)}
                          className="py-1.5 px-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                        >
                          Enroll Challenge
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* COMMUNITY TAB */}
        {subTab === "community" && (
          <motion.div
            key="community-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* 1. Friends list carousel */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-1.5">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-slate-100">Saver Friends</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {friends.length} active savers
                </span>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1.5 scrollbar-thin">
                {friends.map((friend) => (
                  <div 
                    key={friend.id}
                    className="p-3 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-between text-center min-w-[110px] space-y-2 flex-shrink-0"
                  >
                    <img 
                      src={friend.avatarUrl} 
                      alt={friend.name} 
                      className="h-10 w-10 rounded-full object-cover bg-slate-950 border border-slate-800"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-bold text-[11px] text-slate-200 truncate max-w-[90px]">{friend.name}</h4>
                      <p className="text-[9px] text-slate-500 font-mono">Lvl {friend.level}</p>
                    </div>

                    <div className="text-[9px] text-amber-400 font-bold">
                      🔥 {friend.streak} Streak
                    </div>

                    <button
                      onClick={() => handleFollowFriend(friend.id)}
                      className={`w-full py-1 rounded-lg text-[9px] font-bold transition-all ${
                        friend.isFollowing 
                          ? "bg-slate-950 text-slate-400 border border-slate-800" 
                          : "bg-emerald-500 text-slate-950"
                      }`}
                    >
                      {friend.isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Community achievements feed */}
            <div>
              <h3 className="font-bold text-sm text-slate-100 mb-3">Saver Global Feed</h3>
              
              <div className="space-y-4">
                {socialFeed.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2.5">
                        <img 
                          src={item.userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"} 
                          alt={item.userName} 
                          className="h-8 w-8 rounded-full object-cover bg-slate-950 border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-200">{item.userName}</p>
                          <p className="text-[10px] text-slate-400">
                            {item.action} {item.goalName && <span className="text-emerald-400 font-semibold">{item.goalName}</span>}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">{item.time}</span>
                    </div>

                    {/* Social controls */}
                    <div className="flex items-center space-x-4 text-xs border-y border-slate-850/60 py-2">
                      <button 
                        onClick={() => handleLikeFeed(item.id)}
                        className={`flex items-center space-x-1 hover:text-red-400 transition-colors ${
                          item.likedByMe ? "text-red-500 font-bold" : "text-slate-400"
                        }`}
                      >
                        <Heart className="h-4 w-4" />
                        <span>{item.likes} Likes</span>
                      </button>
                      <span className="flex items-center space-x-1 text-slate-400">
                        <MessageSquare className="h-4 w-4" />
                        <span>{item.comments.length} Comments</span>
                      </span>
                    </div>

                    {/* Comments list */}
                    {item.comments.length > 0 && (
                      <div className="space-y-1.5 pl-2 border-l border-slate-850/80 text-[11px]">
                        {item.comments.map((comm) => (
                          <p key={comm.id} className="text-slate-400 leading-relaxed">
                            <span className="font-bold text-slate-200">{comm.user}:</span> {comm.text}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Comment box */}
                    <div className="flex gap-2 pt-1">
                      <input 
                        type="text"
                        placeholder="Cheer on your friend..."
                        value={commentInputs[item.id] || ""}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddComment(item.id);
                        }}
                        className="flex-grow bg-slate-950 border border-slate-850/60 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                      />
                      <button
                        onClick={() => handleAddComment(item.id)}
                        className="py-1 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-850 text-emerald-400 hover:text-emerald-300 text-xs font-bold rounded-xl transition-all"
                      >
                        Post
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* PRO PREMIUM GATE TAB */}
        {subTab === "premium" && (
          <motion.div
            key="premium-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2 py-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/20 animate-pulse">
                👑
              </div>
              <h2 className="font-display font-extrabold text-xl text-amber-300 tracking-tight">PennyPilot Pro subscription</h2>
              <p className="text-xs text-slate-400 max-w-[85%] mx-auto leading-relaxed">
                Unlock the complete automated toolkit. Accelerate your savings, bypass free constraints, and invest with gamified excellence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Monthly billing plan */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                    Standard monthly
                  </span>
                  <div className="flex items-baseline space-x-1.5 mt-3">
                    <span className="text-2xl font-display font-black text-slate-100">₹99</span>
                    <span className="text-xs text-slate-500">/ month</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Access ultimate active goals (no threshold constraints), direct AI Coach calculations, and SaveCoins milestone boosters. Cancel anytime.
                  </p>
                </div>

                <button
                  disabled={subscribing}
                  onClick={() => handlePremiumUpgrade("monthly")}
                  className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-100 text-xs font-bold rounded-xl transition-all"
                >
                  {subscribing ? "Upgrading..." : "Choose Monthly Plan"}
                </button>
              </div>

              {/* Yearly billing plan */}
              <div className="p-5 bg-slate-900 border border-amber-500/40 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden">
                <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Save 15%
                </div>
                
                <div>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                    Discipline annual
                  </span>
                  <div className="flex items-baseline space-x-1.5 mt-3">
                    <span className="text-2xl font-display font-black text-amber-300">₹999</span>
                    <span className="text-xs text-slate-500">/ year</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    The ultimate financial commitment. Unlock everything plus 1000 SaveCoins bonus instant bounty, and premium custom app themes.
                  </p>
                </div>

                <button
                  disabled={subscribing}
                  onClick={() => handlePremiumUpgrade("yearly")}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black rounded-xl hover:opacity-90 transition-all shadow shadow-amber-500/20"
                >
                  {subscribing ? "Upgrading..." : "Choose Annual Plan"}
                </button>
              </div>

            </div>

            {/* Core comparison parameters list */}
            <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-slate-200">What is included in PennyPilot Pro:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-400 leading-relaxed font-sans">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Unlimited Goals (Standard limit is 3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>2x XP Multipliers on Savings</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Instant Weekly AI Budget Blueprints</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Interactive Savings Forecast Predictions</span>
                </div>
              </div>
            </div>

            {profile.isPremium && (
              <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-900">
                <span>Plan active: **{profile.subscriptionPlan?.toUpperCase()}**</span>
                <button 
                  onClick={handlePremiumCancel}
                  className="text-red-400/80 hover:text-red-400 transition-colors underline bg-transparent"
                >
                  Cancel Pro Membership
                </button>
              </div>
            )}

          </motion.div>
        )}

      </AnimatePresence>

      {/* Code Reveal Overlay modal for Affiliate Deals */}
      {clickedCoupon && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-2xl text-center"
          >
            <div className="h-12 w-12 rounded-xl bg-cyan-500/15 flex items-center justify-center mx-auto text-xl text-cyan-400">
              🎫
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">{clickedCoupon.name}</h3>
              <p className="text-xs text-slate-400 mt-1">Copy and redeem this promo code on your purchase!</p>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl flex items-center justify-center select-all font-mono text-cyan-400 font-extrabold text-lg tracking-wider">
              {clickedCoupon.code}
            </div>

            <p className="text-[10px] text-slate-500">
              Claim this offer to earn an instant **50 SaveCoins** affiliate kickback!
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setClickedCoupon(null)}
                className="flex-1 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
              <button
                onClick={() => handlePartnerRedeem(partnerDeals[0].id)} // mock claim trigger
                className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all"
              >
                Claimed & Done
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
