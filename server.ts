import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import transactionsRouter from "./server/routes/transactions";
import categoriesRouter from "./server/routes/categories";
import analyticsRouter from "./server/routes/analytics";
import budgetsRouter from "./server/routes/budgets";
import insightsRouter from "./server/routes/insights";
import ingestionRouter from "./server/routes/ingestion";
import merchantRulesRouter from "./server/routes/merchantRules";
import { getDatabase, saveDatabase } from "./server/db/database";

dotenv.config();

const app = express();
const PORT = 3000;
// Adjust saver score stars dynamically
function adjustSaverScoreStars(profile: any) {
  const score = profile.saverScore || 87;
  if (!profile.saverScoreFactors) {
    profile.saverScoreFactors = { consistency: 5, discipline: 4, goalCompletion: 5 };
  }
  
  if (score >= 95) {
    profile.saverScoreFactors.consistency = 5;
    profile.saverScoreFactors.discipline = 5;
    profile.saverScoreFactors.goalCompletion = 5;
  } else if (score >= 85) {
    profile.saverScoreFactors.consistency = 5;
    profile.saverScoreFactors.discipline = 4;
    profile.saverScoreFactors.goalCompletion = 5;
  } else if (score >= 70) {
    profile.saverScoreFactors.consistency = 4;
    profile.saverScoreFactors.discipline = 3;
    profile.saverScoreFactors.goalCompletion = 4;
  } else if (score >= 50) {
    profile.saverScoreFactors.consistency = 3;
    profile.saverScoreFactors.discipline = 2;
    profile.saverScoreFactors.goalCompletion = 3;
  } else {
    profile.saverScoreFactors.consistency = 2;
    profile.saverScoreFactors.discipline = 1;
    profile.saverScoreFactors.goalCompletion = 2;
  }
}

// Helper: Award SaveCoins & XP with Level-Up checking
function awardSaveCoinsAndXP(db: any, coinAmount: number, xpAmount: number, reason: string) {
  if (coinAmount <= 0) return;
  
  db.profile.saveCoins += coinAmount;
  db.profile.xp += xpAmount;

  // Level thresholds: level up every 400 XP
  const oldLevel = db.profile.level;
  const newLevel = Math.max(1, 1 + Math.floor(db.profile.xp / 400));
  
  if (newLevel > oldLevel) {
    db.profile.level = newLevel;
    
    // Check level up badge triggers
    if (newLevel >= 5 && !db.profile.badges.includes("smart_saver")) {
      db.profile.badges.push("smart_saver");
    }
    if (newLevel >= 10 && !db.profile.badges.includes("money_master")) {
      db.profile.badges.push("money_master");
    }
    if (newLevel >= 20 && !db.profile.badges.includes("financial_champion")) {
      db.profile.badges.push("financial_champion");
    }

    db.notifications.unshift({
      id: "notif-" + Math.random().toString(36).substr(2, 9),
      text: `🎉 LEVEL UP! You reached Level ${newLevel}! Badge unlocked!`,
      type: "success",
      date: new Date().toISOString(),
      read: false
    });
  }

  // Record reward transaction
  db.wallet.transactions.unshift({
    id: "tx-" + Math.random().toString(36).substr(2, 9),
    type: "reward",
    amount: coinAmount,
    date: new Date().toISOString(),
    description: `SaveCoins Reward: ${reason}`
  });

  // Notify user
  db.notifications.unshift({
    id: "notif-" + Math.random().toString(36).substr(2, 9),
    text: `🪙 Earned +${coinAmount} SaveCoins (+${xpAmount} XP) for: ${reason}`,
    type: "reward",
    date: new Date().toISOString(),
    read: false
  });
}

// Helper: Check savings milestone accomplishments
function checkMilestoneCompletions(db: any, goal: any) {
  if (!goal.milestonesRewarded) {
    goal.milestonesRewarded = [];
  }

  const verifiedAmt = goal.verifiedSavings !== undefined ? goal.verifiedSavings : goal.currentSavings;
  const progress = (verifiedAmt / goal.targetAmount) * 100;
  const milestones = [
    { pct: 25, coins: 100 },
    { pct: 50, coins: 250 },
    { pct: 75, coins: 500 },
    { pct: 100, coins: 1000 }
  ];

  milestones.forEach((milestone) => {
    if (progress >= milestone.pct && !goal.milestonesRewarded.includes(milestone.pct)) {
      goal.milestonesRewarded.push(milestone.pct);
      
      // Award reward coins with 7-day cooldown for 100% completion
      if (milestone.pct === 100) {
        if (!db.profile.cooldownRewards) {
          db.profile.cooldownRewards = [];
        }
        db.profile.cooldownRewards.unshift({
          id: "cool-" + Math.random().toString(36).substr(2, 9),
          name: `Goal Completion Milestone: ${goal.name}`,
          coins: milestone.coins,
          unlockedAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days cooldown
          status: "pending" as const,
          goalId: goal.id,
          goalName: goal.name
        });

        db.notifications.unshift({
          id: "notif-" + Math.random().toString(36).substr(2, 9),
          text: `🔒 Goal '${goal.name}' completed! Reward of ${milestone.coins} SaveCoins is pending a 7-day security cooldown verification.`,
          type: "info" as const,
          date: new Date().toISOString(),
          read: false
        });

        goal.status = "completed";

        if (!db.profile.badges.includes("goal_crusher")) {
          db.profile.badges.push("goal_crusher");
          db.notifications.unshift({
            id: "notif-" + Math.random().toString(36).substr(2, 9),
            text: "🏆 New Badge Unlocked: Goal Crusher (First goal saved!)",
            type: "success",
            date: new Date().toISOString(),
            read: false
          });
        }

        // Count completed
        const totalCompleted = db.goals.filter((g: any) => g.status === "completed" || g.status === "withdrawn").length;
        if (totalCompleted >= 10 && !db.profile.badges.includes("dream_builder")) {
          db.profile.badges.push("dream_builder");
          db.notifications.unshift({
            id: "notif-" + Math.random().toString(36).substr(2, 9),
            text: "🏆 New Badge Unlocked: Dream Builder (Completed 10 savings goals!)",
            type: "success",
            date: new Date().toISOString(),
            read: false
          });
        }

        // Publish to social feed
        db.socialFeed.unshift({
          id: "feed-" + Math.random().toString(36).substr(2, 9),
          userName: db.profile.name,
          userAvatar: db.profile.avatarUrl || "",
          action: `completed their saving milestone for '${goal.name}'! 🥳`,
          goalName: goal.name,
          time: "Just now",
          likes: 0,
          likedByMe: false,
          comments: []
        });
      } else {
        awardSaveCoinsAndXP(
          db, 
          milestone.coins, 
          Math.floor(milestone.coins / 2), 
          `Reached ${milestone.pct}% savings milestone on goal: '${goal.name}'`
        );
      }
    }
  });
}

// Process Auto-Saves against current time
function processAutoSaves() {
  const db = getDatabase();
  const now = new Date();
  let updated = false;

  db.goals = db.goals.map((goal: any) => {
    if (goal.status !== "active" || goal.autoSaveFrequency === "none" || !goal.autoSaveNextDate) {
      return goal;
    }

    let nextDate = new Date(goal.autoSaveNextDate);
    while (nextDate <= now) {
      const amount = goal.autoSaveAmount;
      
      // Perform auto save deduction
      goal.currentSavings = Math.min(goal.targetAmount, goal.currentSavings + amount);
      
      // Create transaction log
      const txId = "tx-" + Math.random().toString(36).substr(2, 9);
      db.wallet.transactions.unshift({
        id: txId,
        type: "auto_save",
        amount: amount,
        goalId: goal.id,
        goalName: goal.name,
        date: nextDate.toISOString(),
        description: `Automated ${goal.autoSaveFrequency} save for ${goal.name}`
      });

      // Award coins for auto-saving: ₹100 saved = 10 SaveCoins (i.e. 10% coin reward)
      const coinsEarned = Math.floor(amount / 10);
      awardSaveCoinsAndXP(db, coinsEarned, Math.floor(coinsEarned / 2), `Auto-save transfer for '${goal.name}'`);

      // Check milestones
      checkMilestoneCompletions(db, goal);

      // Calculate next schedule date
      if (goal.autoSaveFrequency === "daily") {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (goal.autoSaveFrequency === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (goal.autoSaveFrequency === "monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      
      updated = true;
    }

    goal.autoSaveNextDate = nextDate.toISOString();
    return goal;
  });

  if (updated) {
    saveDatabase(db);
  }
}

// Initialize automatic savings processing
processAutoSaves();

// Express configuration
app.use(express.json());

// Expense Tracker API Endpoints
app.use("/api/transactions", transactionsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/insights", insightsRouter);
app.use("/api/ingestion", ingestionRouter);
app.use("/api/merchant-rules", merchantRulesRouter);

// System Health Check Endpoint (used by Android client for connection testing)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "PennyPilot",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Existing Legacy APIs

// 1. Profile APIs
app.get("/api/profile", (req, res) => {
  const db = getDatabase();
  res.json(db.profile);
});

app.put("/api/profile", (req, res) => {
  const db = getDatabase();
  db.profile = { ...db.profile, ...req.body };
  saveDatabase(db);
  res.json(db.profile);
});

// 2. Goal APIs
app.get("/api/goals", (req, res) => {
  processAutoSaves();
  const db = getDatabase();
  res.json(db.goals);
});

app.post("/api/goals", (req, res) => {
  const db = getDatabase();
  
  // Premium subscription check
  const activeCount = db.goals.filter((g: any) => g.status === "active").length;
  if (!db.profile.isPremium && activeCount >= 3) {
    return res.status(403).json({ error: "Goal limit reached. Standard users can track up to 3 active goals. Upgrade to PennyPilot Pro for unlimited goals!" });
  }

  const newGoal = {
    id: "goal-" + Math.random().toString(36).substr(2, 9),
    name: req.body.name,
    targetAmount: Number(req.body.targetAmount),
    currentSavings: Number(req.body.currentSavings || 0),
    targetDate: req.body.targetDate,
    category: req.body.category || "Other",
    imageUrl: req.body.imageUrl || "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&auto=format&fit=crop&q=60",
    status: "active",
    createdAt: new Date().toISOString(),
    autoSaveAmount: Number(req.body.autoSaveAmount || 0),
    autoSaveFrequency: req.body.autoSaveFrequency || "none",
    autoSaveNextDate: req.body.autoSaveFrequency !== "none" ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
    priority: req.body.priority || "medium",
    milestonesRewarded: []
  };

  db.goals.push(newGoal);

  // Trigger deposit transaction if initial savings provided
  if (newGoal.currentSavings > 0) {
    db.wallet.transactions.unshift({
      id: "tx-" + Math.random().toString(36).substr(2, 9),
      type: "manual_save",
      amount: newGoal.currentSavings,
      goalId: newGoal.id,
      goalName: newGoal.name,
      date: new Date().toISOString(),
      description: `Initial savings deposit for goal: ${newGoal.name}`
    });

    // Award initial SaveCoins: 10%
    const coinsEarned = Math.floor(newGoal.currentSavings / 10);
    awardSaveCoinsAndXP(db, coinsEarned, Math.floor(coinsEarned / 2), `Initial goal savings transfer`);
    checkMilestoneCompletions(db, newGoal);
  }

  saveDatabase(db);
  res.status(201).json(newGoal);
});

app.put("/api/goals/:id", (req, res) => {
  const db = getDatabase();
  const goalIndex = db.goals.findIndex((g: any) => g.id === req.params.id);
  if (goalIndex === -1) {
    return res.status(404).json({ error: "Goal not found" });
  }

  const updatedGoal = { ...db.goals[goalIndex], ...req.body };
  db.goals[goalIndex] = updatedGoal;
  
  checkMilestoneCompletions(db, updatedGoal);
  saveDatabase(db);
  res.json(updatedGoal);
});

app.delete("/api/goals/:id", (req, res) => {
  const db = getDatabase();
  const goalIndex = db.goals.findIndex((g: any) => g.id === req.params.id);
  if (goalIndex !== -1) {
    const goal = db.goals[goalIndex];
    if (goal.status === "active") {
      db.profile.saverScore = Math.max(0, (db.profile.saverScore || 87) - 15);
      adjustSaverScoreStars(db.profile);
      db.notifications.unshift({
        id: "notif-" + Math.random().toString(36).substr(2, 9),
        text: `⚠️ Deleting active goal '${goal.name}' has impacted your Saver Score. -15 points.`,
        type: "reminder" as const,
        date: new Date().toISOString(),
        read: false
      });
    }
    db.goals.splice(goalIndex, 1);
    saveDatabase(db);
  }
  res.json({ success: true, profile: db.profile });
});

// Manual save endpoint with anti-exploit limits & source validation
app.post("/api/goals/:id/save", (req, res) => {
  const db = getDatabase();
  const goalIndex = db.goals.findIndex((g: any) => g.id === req.params.id);
  if (goalIndex === -1) {
    return res.status(404).json({ error: "Goal not found" });
  }

  const goal = db.goals[goalIndex];
  const amount = Number(req.body.amount);
  const source = req.body.source; // 'Salary', 'Gift', 'Bonus', 'Transfer', 'Other'
  
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  // Deduct from wallet balance or verify wallet
  if (db.wallet.balance < amount) {
    return res.status(400).json({ error: "Insufficient wallet balance. Please add money to wallet first." });
  }

  db.wallet.balance -= amount;

  // Anti-Gaming: Limit verification
  const dailyLimit = goal.dailyLimit || 500;
  const maxDailyCap = Math.ceil(goal.targetAmount * 0.05); // No more than 5% of goal value per day
  const finalDailyLimit = Math.min(dailyLimit, maxDailyCap);

  const verifiedPortion = Math.min(amount, finalDailyLimit);
  const unverifiedPortion = amount - verifiedPortion;

  goal.currentSavings = Math.min(goal.targetAmount, goal.currentSavings + amount);
  goal.verifiedSavings = Math.min(goal.targetAmount, (goal.verifiedSavings || 0) + verifiedPortion);
  goal.unverifiedSavingsPending = (goal.unverifiedSavingsPending || 0) + unverifiedPortion;

  // Record transaction
  const description = source 
    ? `Saved manually into ${goal.name} (Verified Source: ${source} ✅)`
    : `Saved manually into ${goal.name}`;

  db.wallet.transactions.unshift({
    id: "tx-" + Math.random().toString(36).substr(2, 9),
    type: "manual_save",
    amount: amount,
    goalId: goal.id,
    goalName: goal.name,
    date: new Date().toISOString(),
    description
  });

  // Award SaveCoins ONLY on verified savings portion + consistency streak bonus
  const coinsEarned = Math.floor(verifiedPortion / 10);
  const streakBonus = Math.floor((db.profile.streak || 0) * 2);
  const totalCoinsAwarded = coinsEarned + streakBonus;

  if (totalCoinsAwarded > 0) {
    awardSaveCoinsAndXP(
      db, 
      totalCoinsAwarded, 
      Math.floor(totalCoinsAwarded / 2), 
      `Saved fund transfer towards '${goal.name}' (Streak consistency reward applied!)`
    );
  }

  // Dynamic Saver Score Adjustments
  const isLargeDeposit = amount > (goal.dailyRecommended || 333) * 10 || amount > 2000;
  if (isLargeDeposit) {
    if (source) {
      // Verified large deposits boost/maintain trust score
      db.profile.saverScore = Math.min(100, (db.profile.saverScore || 87) + 3);
    } else {
      // Sudden large unverified deposit triggers trust deduction flag
      db.profile.saverScore = Math.max(0, (db.profile.saverScore || 87) - 5);
      db.notifications.unshift({
        id: "notif-" + Math.random().toString(36).substr(2, 9),
        text: `⚠️ Sudden large savings without verification source flagged. -5 points on Saver Score.`,
        type: "reminder" as const,
        date: new Date().toISOString(),
        read: false
      });
    }
  } else {
    // Normal small consistent deposits boost score
    db.profile.saverScore = Math.min(100, (db.profile.saverScore || 87) + 2);
  }
  adjustSaverScoreStars(db.profile);

  // First saver badge trigger
  const totalSaved = db.goals.reduce((acc: number, g: any) => acc + g.currentSavings, 0);
  if (totalSaved >= 1000 && !db.profile.badges.includes("first_saver")) {
    db.profile.badges.push("first_saver");
    db.notifications.unshift({
      id: "notif-" + Math.random().toString(36).substr(2, 9),
      text: "🏆 Badge Unlocked: First Saver! Saved first ₹1,000 across Goals.",
      type: "success" as const,
      date: new Date().toISOString(),
      read: false
    });
  }

  // Check milestones and goal completions
  checkMilestoneCompletions(db, goal);

  let limitMessage = "";
  if (unverifiedPortion > 0) {
    limitMessage = `You added ${db.profile.currency || "₹"}${amount.toLocaleString()}. Only ${db.profile.currency || "₹"}${verifiedPortion.toLocaleString()} counts toward today's rewards progress. The remaining ${db.profile.currency || "₹"}${unverifiedPortion.toLocaleString()} will be verified over future days.`;
  }

  saveDatabase(db);
  res.json({ goal, wallet: db.wallet, profile: db.profile, notifications: db.notifications, limitMessage });
});

// Verify pending unverified savings (simulates a daily pass/audit)
app.post("/api/goals/:id/verify-pending", (req, res) => {
  const db = getDatabase();
  const goalIndex = db.goals.findIndex((g: any) => g.id === req.params.id);
  if (goalIndex === -1) {
    return res.status(404).json({ error: "Goal not found" });
  }

  const goal = db.goals[goalIndex];
  const pending = goal.unverifiedSavingsPending || 0;
  if (pending <= 0) {
    return res.status(400).json({ error: "No pending unverified savings for this goal." });
  }

  const dailyLimit = goal.dailyLimit || 500;
  const maxDailyCap = Math.ceil(goal.targetAmount * 0.05);
  const finalDailyLimit = Math.min(dailyLimit, maxDailyCap);

  const verifiedNow = Math.min(pending, finalDailyLimit);
  goal.unverifiedSavingsPending = pending - verifiedNow;
  goal.verifiedSavings = Math.min(goal.targetAmount, (goal.verifiedSavings || 0) + verifiedNow);

  // Award SaveCoins for verified portion
  const coinsEarned = Math.floor(verifiedNow / 10);
  if (coinsEarned > 0) {
    awardSaveCoinsAndXP(
      db, 
      coinsEarned, 
      Math.floor(coinsEarned / 2), 
      `Verified pending savings of ${db.profile.currency || "₹"}${verifiedNow.toLocaleString()} for '${goal.name}'`
    );
  }

  // Boost saver score for consistency
  db.profile.saverScore = Math.min(100, (db.profile.saverScore || 87) + 2);
  adjustSaverScoreStars(db.profile);

  db.notifications.unshift({
    id: "notif-" + Math.random().toString(36).substr(2, 9),
    text: `✅ Verified ${db.profile.currency || "₹"}${verifiedNow.toLocaleString()} of your pending savings for '${goal.name}'. Saver Score boosted!`,
    type: "success" as const,
    date: new Date().toISOString(),
    read: false
  });

  checkMilestoneCompletions(db, goal);
  saveDatabase(db);
  res.json({ goal, profile: db.profile, notifications: db.notifications });
});

// Fast Forward security cooldown (unlock rewards instantly for testing)
app.post("/api/profile/cooldown/fast-forward", (req, res) => {
  const db = getDatabase();
  if (!db.profile.cooldownRewards || db.profile.cooldownRewards.length === 0) {
    return res.status(400).json({ error: "No pending cooldown rewards to verify." });
  }

  let unlockedCount = 0;
  db.profile.cooldownRewards = db.profile.cooldownRewards.map((reward: any) => {
    if (reward.status === "pending") {
      reward.status = "ready" as const;
      unlockedCount++;
    }
    return reward;
  });

  if (unlockedCount > 0) {
    db.notifications.unshift({
      id: "notif-" + Math.random().toString(36).substr(2, 9),
      text: `⚡ Fast-forwarded audit verification! ${unlockedCount} completed milestone rewards are now READY to be claimed.`,
      type: "success" as const,
      date: new Date().toISOString(),
      read: false
    });
  }

  saveDatabase(db);
  res.json({ profile: db.profile, notifications: db.notifications });
});

// Claim security-audited ready cooldown reward
app.post("/api/profile/cooldown/:id/claim", (req, res) => {
  const db = getDatabase();
  if (!db.profile.cooldownRewards) {
    return res.status(404).json({ error: "No cooldown rewards" });
  }

  const rewardIndex = db.profile.cooldownRewards.findIndex((r: any) => r.id === req.params.id);
  if (rewardIndex === -1) {
    return res.status(404).json({ error: "Cooldown reward not found" });
  }

  const reward = db.profile.cooldownRewards[rewardIndex];
  
  if (reward.status === "pending") {
    const unlockedTime = new Date(reward.unlockedAt).getTime();
    if (Date.now() < unlockedTime) {
      return res.status(400).json({ error: "This reward is still in security cooldown. Wait for the audit to finish, or use the Fast Forward feature!" });
    }
    reward.status = "ready" as const;
  }

  if (reward.status === "claimed") {
    return res.status(400).json({ error: "Reward already claimed!" });
  }

  reward.status = "claimed" as const;
  
  // Award coins & XP
  awardSaveCoinsAndXP(db, reward.coins, Math.floor(reward.coins / 2), `Claimed completed goal reward for '${reward.goalName || 'Goal'}'!`);
  
  // Remove from cooldown rewards list to keep UI tidy
  db.profile.cooldownRewards = db.profile.cooldownRewards.filter((r: any) => r.id !== reward.id);

  // Boost saver score
  db.profile.saverScore = Math.min(100, (db.profile.saverScore || 87) + 5);
  adjustSaverScoreStars(db.profile);

  saveDatabase(db);
  res.json({ profile: db.profile, notifications: db.notifications });
});

// Update profile income and recalculate dailyRecommended & dailyLimit
app.post("/api/profile/update-income", (req, res) => {
  const db = getDatabase();
  const income = Number(req.body.income);
  if (isNaN(income) || income < 0) {
    return res.status(400).json({ error: "Invalid income amount" });
  }

  db.profile.monthlyIncome = income;
  
  db.goals.forEach((goal: any) => {
    const target = goal.targetDate ? new Date(goal.targetDate) : new Date(Date.now() + 120 * 24 * 60 * 60 * 1000);
    const start = goal.createdAt ? new Date(goal.createdAt) : new Date(Date.now());
    const totalDays = Math.max(1, Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyRec = Math.max(1, Math.ceil(goal.targetAmount / totalDays));
    
    let trustCap = 500;
    if (db.profile.trustLevel === "trusted" || db.profile.level >= 3) {
      trustCap = 1500;
    }
    if (db.profile.trustLevel === "verified" || db.profile.level >= 10) {
      trustCap = 50000;
    }

    const safeIncomeLimit = Math.max(200, Math.ceil((income * 0.15) / 30));
    const dailyLimit = Math.min(trustCap, safeIncomeLimit, Math.max(500, Math.ceil(dailyRec * 1.5)));

    goal.dailyRecommended = dailyRec;
    goal.dailyLimit = dailyLimit;
  });

  saveDatabase(db);
  res.json({ profile: db.profile, goals: db.goals });
});

// Withdraw completed goal endpoint
app.post("/api/goals/:id/withdraw", (req, res) => {
  const db = getDatabase();
  const goalIndex = db.goals.findIndex((g: any) => g.id === req.params.id);
  if (goalIndex === -1) {
    return res.status(404).json({ error: "Goal not found" });
  }

  const goal = db.goals[goalIndex];
  if (goal.status !== "completed") {
    return res.status(400).json({ error: "Goal must be completed to withdraw" });
  }

  const withdrawnAmount = goal.currentSavings;
  goal.currentSavings = 0;
  goal.status = "withdrawn";

  // Transfer back to wallet balance
  db.wallet.balance += withdrawnAmount;

  // Add transaction
  db.wallet.transactions.unshift({
    id: "tx-" + Math.random().toString(36).substr(2, 9),
    type: "withdrawal",
    amount: withdrawnAmount,
    goalId: goal.id,
    goalName: goal.name,
    date: new Date().toISOString(),
    description: `Withdrew savings of ${db.profile.currency}${withdrawnAmount} from completed goal '${goal.name}'`
  });

  saveDatabase(db);
  res.json({ goal, wallet: db.wallet });
});

// 3. Wallet APIs
app.get("/api/wallet", (req, res) => {
  const db = getDatabase();
  res.json(db.wallet);
});

app.post("/api/wallet/deposit", (req, res) => {
  const db = getDatabase();
  const amount = Number(req.body.amount);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid deposit amount" });
  }

  db.wallet.balance += amount;
  db.wallet.transactions.unshift({
    id: "tx-" + Math.random().toString(36).substr(2, 9),
    type: "deposit",
    amount,
    date: new Date().toISOString(),
    description: `Added funds via Razorpay`
  });

  saveDatabase(db);
  res.json(db.wallet);
});

app.post("/api/wallet/withdraw", (req, res) => {
  const db = getDatabase();
  const amount = Number(req.body.amount);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid withdrawal amount" });
  }

  if (db.wallet.balance < amount) {
    return res.status(400).json({ error: "Insufficient wallet balance" });
  }

  db.wallet.balance -= amount;
  db.wallet.transactions.unshift({
    id: "tx-" + Math.random().toString(36).substr(2, 9),
    type: "withdrawal",
    amount,
    date: new Date().toISOString(),
    description: `Withdrew to GPay (Bank Account)`
  });

  saveDatabase(db);
  res.json(db.wallet);
});

// 4. Notification APIs
app.get("/api/notifications", (req, res) => {
  const db = getDatabase();
  res.json(db.notifications);
});

app.post("/api/notifications/read", (req, res) => {
  const db = getDatabase();
  db.notifications = db.notifications.map((n: any) => ({ ...n, read: true }));
  saveDatabase(db);
  res.json(db.notifications);
});

// 5. Daily Saving Streak APIs
app.post("/api/streak/checkin", (req, res) => {
  const db = getDatabase();
  const todayStr = new Date().toISOString().split("T")[0]; // simulation anchor "2026-07-19"
  
  if (db.profile.lastCheckIn === todayStr) {
    return res.status(400).json({ error: "Already checked in today! Keep saving tomorrow." });
  }

  db.profile.lastCheckIn = todayStr;
  db.profile.streak += 1;

  // Streak rewards: 7 day, 30 day, 100 day milestones
  let rewardCoins = 20; // baseline daily check-in
  let bonusReason = "Daily savings streak check-in";

  if (db.profile.streak === 7) {
    rewardCoins += 50;
    bonusReason = "7-Day Saving Streak Bonus! 🔥";
  } else if (db.profile.streak === 30) {
    rewardCoins += 250;
    bonusReason = "30-Day saving streak unlocked! Discipline Master Badge! 🔥";
    if (!db.profile.badges.includes("discipline_master")) {
      db.profile.badges.push("discipline_master");
    }
  } else if (db.profile.streak === 100) {
    rewardCoins += 1000;
    bonusReason = "100-Day ultra streak unlocked! Financial Champion Badge! 🏆";
  }

  awardSaveCoinsAndXP(db, rewardCoins, Math.floor(rewardCoins / 2), bonusReason);
  saveDatabase(db);
  res.json({ profile: db.profile, notifications: db.notifications });
});

app.post("/api/streak/recover", (req, res) => {
  const db = getDatabase();
  if (db.profile.saveCoins < 100) {
    return res.status(400).json({ error: "Insufficient SaveCoins. Recovering streak costs 100 SaveCoins." });
  }

  db.profile.saveCoins -= 100;
  db.profile.streak = Math.max(5, db.profile.streak + 1); // Recover and add a cushion

  db.wallet.transactions.unshift({
    id: "tx-" + Math.random().toString(36).substr(2, 9),
    type: "redeem",
    amount: 100,
    date: new Date().toISOString(),
    description: "Paid 100 SaveCoins for Streak Recovery safeguard"
  });

  db.notifications.unshift({
    id: "notif-" + Math.random().toString(36).substr(2, 9),
    text: "🩹 Streak recovered! Your daily saving streak is secure again.",
    type: "info",
    date: new Date().toISOString(),
    read: false
  });

  saveDatabase(db);
  res.json({ profile: db.profile, notifications: db.notifications });
});

// 6. Savings Challenges APIs
app.get("/api/challenges", (req, res) => {
  const db = getDatabase();
  res.json(db.challenges);
});

app.post("/api/challenges/:id/join", (req, res) => {
  const db = getDatabase();
  const challenge = db.challenges.find((c: any) => c.id === req.params.id);
  if (!challenge) {
    return res.status(404).json({ error: "Challenge not found" });
  }

  challenge.joined = true;
  saveDatabase(db);
  res.json(db.challenges);
});

app.post("/api/challenges/:id/progress", (req, res) => {
  const db = getDatabase();
  const challenge = db.challenges.find((c: any) => c.id === req.params.id);
  if (!challenge) {
    return res.status(404).json({ error: "Challenge not found" });
  }

  if (!challenge.joined) {
    return res.status(400).json({ error: "You must join this challenge first!" });
  }

  if (challenge.completed) {
    return res.status(400).json({ error: "Challenge already completed!" });
  }

  challenge.daysTracked += 1;
  const targetDays = challenge.id === "chall-1" ? 30 : challenge.id === "chall-2" ? 2 : 1;

  if (challenge.daysTracked >= targetDays) {
    challenge.completed = true;
    awardSaveCoinsAndXP(db, challenge.rewardCoins, Math.floor(challenge.rewardCoins / 2), `Completed '${challenge.name}' savings challenge!`);
    
    // Add custom feed
    db.socialFeed.unshift({
      id: "feed-" + Math.random().toString(36).substr(2, 9),
      userName: db.profile.name,
      userAvatar: db.profile.avatarUrl || "",
      action: `conquered the '${challenge.name}' Savings Challenge! 🏆`,
      time: "Just now",
      likes: 0,
      likedByMe: false,
      comments: []
    });
  }

  saveDatabase(db);
  res.json(db.challenges);
});

// 7. Reward Marketplace APIs
app.get("/api/rewards", (req, res) => {
  const db = getDatabase();
  res.json(db.rewards);
});

app.post("/api/rewards/:id/redeem", (req, res) => {
  const db = getDatabase();
  const reward = db.rewards.find((r: any) => r.id === req.params.id);
  if (!reward) {
    return res.status(404).json({ error: "Reward item not found" });
  }

  if (db.profile.saveCoins < reward.cost) {
    return res.status(400).json({ error: `Insufficient SaveCoins balance. This reward requires ${reward.cost} SaveCoins.` });
  }

  // Deduct coins
  db.profile.saveCoins -= reward.cost;
  reward.redeemedCount += 1;

  // Add transaction
  db.wallet.transactions.unshift({
    id: "tx-" + Math.random().toString(36).substr(2, 9),
    type: "redeem",
    amount: reward.cost,
    date: new Date().toISOString(),
    description: `Redeemed SaveCoins for: ${reward.name}`
  });

  // Success notification with virtual voucher code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
  db.notifications.unshift({
    id: "notif-" + Math.random().toString(36).substr(2, 9),
    text: `🎁 Redeemed successfully! Voucher Code: ${code}. Sent to ${db.profile.email}.`,
    type: "success",
    date: new Date().toISOString(),
    read: false
  });

  saveDatabase(db);
  res.json({ profile: db.profile, rewards: db.rewards, notifications: db.notifications });
});

// 8. Partner Deals APIs
app.get("/api/partners", (req, res) => {
  const db = getDatabase();
  res.json(db.partnerDeals);
});

app.post("/api/partners/:id/click", (req, res) => {
  const db = getDatabase();
  const deal = db.partnerDeals.find((p: any) => p.id === req.params.id);
  if (deal) {
    deal.clicks += 1;
    saveDatabase(db);
  }
  res.json({ success: true, code: deal ? deal.couponCode : "" });
});

app.post("/api/partners/:id/redeem", (req, res) => {
  const db = getDatabase();
  const deal = db.partnerDeals.find((p: any) => p.id === req.params.id);
  if (deal) {
    deal.redemptions += 1;
    // Award 50 SaveCoins bonus for leveraging affiliate referral
    awardSaveCoinsAndXP(db, 50, 20, `Completed Partner offer: '${deal.name}'`);
    saveDatabase(db);
  }
  res.json({ success: true, profile: db.profile });
});

// 9. Social Feed & Friends APIs
app.get("/api/social/feed", (req, res) => {
  const db = getDatabase();
  res.json(db.socialFeed);
});

app.post("/api/social/feed/:id/like", (req, res) => {
  const db = getDatabase();
  const feedIndex = db.socialFeed.findIndex((f: any) => f.id === req.params.id);
  if (feedIndex !== -1) {
    const item = db.socialFeed[feedIndex];
    if (item.likedByMe) {
      item.likes = Math.max(0, item.likes - 1);
      item.likedByMe = false;
    } else {
      item.likes += 1;
      item.likedByMe = true;
    }
    saveDatabase(db);
  }
  res.json(db.socialFeed);
});

app.post("/api/social/feed/:id/comment", (req, res) => {
  const db = getDatabase();
  const feedIndex = db.socialFeed.findIndex((f: any) => f.id === req.params.id);
  if (feedIndex !== -1) {
    const item = db.socialFeed[feedIndex];
    item.comments.push({
      id: "comment-" + Math.random().toString(36).substr(2, 9),
      user: db.profile.name,
      text: req.body.text || "Keep crushing it! 👍"
    });
    saveDatabase(db);
  }
  res.json(db.socialFeed);
});

app.get("/api/social/friends", (req, res) => {
  const db = getDatabase();
  res.json(db.friends);
});

app.post("/api/social/friends/:id/follow", (req, res) => {
  const db = getDatabase();
  const friend = db.friends.find((f: any) => f.id === req.params.id);
  if (friend) {
    friend.isFollowing = !friend.isFollowing;
    saveDatabase(db);
  }
  res.json(db.friends);
});

// 10. Subscription / Premium management
app.post("/api/subscription/upgrade", (req, res) => {
  const db = getDatabase();
  const plan = req.body.plan; // monthly or yearly
  if (plan !== "monthly" && plan !== "yearly") {
    return res.status(400).json({ error: "Invalid plan" });
  }

  db.profile.isPremium = true;
  db.profile.subscriptionPlan = plan;
  
  const expires = new Date();
  if (plan === "monthly") {
    expires.setMonth(expires.getMonth() + 1);
  } else {
    expires.setFullYear(expires.getFullYear() + 1);
  }
  db.profile.subscriptionExpires = expires.toISOString();

  // Award 200 SaveCoins bonus for upgrading!
  awardSaveCoinsAndXP(db, 200, 100, `Upgraded to PennyPilot Pro (${plan} plan)! 👑`);

  saveDatabase(db);
  res.json(db.profile);
});

app.post("/api/subscription/cancel", (req, res) => {
  const db = getDatabase();
  db.profile.isPremium = false;
  db.profile.subscriptionPlan = "none";
  db.profile.subscriptionExpires = undefined;
  
  db.notifications.unshift({
    id: "notif-" + Math.random().toString(36).substr(2, 9),
    text: "Your PennyPilot Pro subscription has been cancelled. Active goals limit is set back to 3.",
    type: "info",
    date: new Date().toISOString(),
    read: false
  });

  saveDatabase(db);
  res.json(db.profile);
});

// 11. AI Coach API using Gemini 3.5 Flash
app.post("/api/coach/chat", async (req, res) => {
  const db = getDatabase();
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }

  // AI assistant premium enforcement (Pro users or basic overview trial)
  // Let's allow everyone but provide special coaching messages if premium.

  // Build current state summary for Gemini context
  const activeGoalsSummary = db.goals
    .filter((g: any) => g.status === "active")
    .map((g: any) => `- Goal: ${g.name}, Priority: ${g.priority}, Target: ${db.profile.currency}${g.targetAmount}, Current Saved: ${db.profile.currency}${g.currentSavings} (${Math.round((g.currentSavings / g.targetAmount) * 100)}% complete), Category: ${g.category}, AutoSave: ${g.autoSaveAmount > 0 ? `${db.profile.currency}${g.autoSaveAmount} (${g.autoSaveFrequency})` : 'None'}, Deadline: ${g.targetDate || "None"}`)
    .join("\n");

  const completedGoalsSummary = db.goals
    .filter((g: any) => g.status === "completed")
    .map((g: any) => `- ${g.name} (${db.profile.currency}${g.targetAmount} saved!)`)
    .join("\n") || "No completed goals yet.";

  const totalSaved = db.goals.reduce((acc: number, g: any) => acc + g.currentSavings, 0);

  const systemInstruction = `You are "PennyPilot AI Savings Coach", an intelligent, gamified financial counselor.
Your role is to guide ${db.profile.name} to optimize savings, compound SaveCoins, complete savings challenges, and predict completion dates.

Abhiram's real-time gamified dashboard context:
- Preferred currency: ${db.profile.currency}
- Total money saved across goals: ${db.profile.currency}${totalSaved}
- Wallet Balance: ${db.profile.currency}${db.wallet.balance}
- SaveCoins balance: ${db.profile.saveCoins} (Level ${db.profile.level} - ${getLevelName(db.profile.level)})
- Current Saving Streak: 🔥 ${db.profile.streak} Days
- Pro Status: ${db.profile.isPremium ? "Active Pro Member" : "Standard Free Trial"}
- Active Savings Goals:
${activeGoalsSummary || "No active savings goals at the moment."}
- Completed Goals:
${completedGoalsSummary}

Your advice MUST follow these instructions:
1. Speak with professional, highly encouraging financial authority.
2. Calculate completion forecasts! Analyze user's goals and give precise numbers. (e.g. "To buy the Rolex in 3 months, you'll need to save ₹4,166/month").
3. Suggest clear action items to cut budget leaks (like canceling unused app trials, eating home cooked meals, reducing cab rides).
4. Prompt the user to participate in "Savings Challenges" (like 30-Day Saving or No-Spend Weekends) to unlock premium SaveCoins.
5. Refer to Abhiram by name naturally. Keep responses structured with beautiful, clean markdown and clear bullet points.
6. If the user asks about adding external accounts, say: "We are currently simulating safe bank sandboxes. In the next releases, you can connect live Plaid APIs directly!"`;

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      // High-fidelity fallback simulated advice with correct currency and state metrics
      const simulatedResponses = [
        `Hey **${db.profile.name}**! I see you are saving ₹9,000 weekly! At this rate, your **Tokyo Trip** goal is on track to be finished in exactly **9 days** (around late September target)! To speed it up, try our active **No-Spend Weekend Challenge** to pocket an extra ₹2,000 and earn **200 SaveCoins**!`,
        `Amazing streak, **${db.profile.name}**! You've already completed the **iPhone 17 Pro**! Let's redirect that momentum. If you transfer those funds to the **Stanford Leadership Program**, you can cover the remaining amount 3 weeks ahead of schedule. Let me know if you'd like custom budget cuts suggestions!`,
        `Hi **${db.profile.name}**, regarding your **Rolex Submariner Watch** goal: saving ₹5,000 weekly is fantastic. You need ₹112,500 more. At this rate, you'll complete it in **22.5 weeks** (by late December 2026). Let's squeeze ₹1,500/week from dining out to pull your target date to October!`
      ];
      const randomSim = simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];
      
      const userMsgObj = { id: "msg-" + Math.random().toString(36).substr(2, 9), sender: "user" as const, text: userMessage, timestamp: new Date().toISOString() };
      const coachMsgObj = { id: "msg-" + Math.random().toString(36).substr(2, 9), sender: "coach" as const, text: randomSim, timestamp: new Date().toISOString() };
      
      db.chatHistory.push(userMsgObj, coachMsgObj);
      saveDatabase(db);
      return res.json({ reply: randomSim, history: db.chatHistory });
    }

    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Compile previous conversation snippets to maintain context
    const lastSixMsgs = db.chatHistory.slice(-6).map((m: any) => `${m.sender === "user" ? "User" : "Coach"}: ${m.text}`).join("\n");
    const fullPrompt = `${lastSixMsgs}\nUser: ${userMessage}\nCoach:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.85,
      }
    });

    const replyText = response.text || "Analyzing your savings velocity! Could you check your wallet parameters first?";
    
    const userMsgObj = { id: "msg-" + Math.random().toString(36).substr(2, 9), sender: "user" as const, text: userMessage, timestamp: new Date().toISOString() };
    const coachMsgObj = { id: "msg-" + Math.random().toString(36).substr(2, 9), sender: "coach" as const, text: replyText, timestamp: new Date().toISOString() };
    
    db.chatHistory.push(userMsgObj, coachMsgObj);
    saveDatabase(db);

    res.json({ reply: replyText, history: db.chatHistory });

  } catch (error: any) {
    console.error("Gemini Coach Error:", error);
    res.status(500).json({ error: "Gemini server failed to respond", details: error.message });
  }
});

// Chat history retrieval API
app.get("/api/coach/history", (req, res) => {
  const db = getDatabase();
  res.json(db.chatHistory);
});

// Clear chat history
app.post("/api/coach/clear", (req, res) => {
  const db = getDatabase();
  db.chatHistory = [
    {
      id: "msg-1",
      sender: "coach",
      text: `Hello ${db.profile.name}! I am your PennyPilot AI Financial Coach. How can I help you optimize your savings today?`,
      timestamp: new Date().toISOString()
    }
  ];
  saveDatabase(db);
  res.json(db.chatHistory);
});

// Helper: Get level label
function getLevelName(level: number): string {
  if (level >= 20) return "Financial Champion";
  if (level >= 10) return "Money Master";
  if (level >= 5) return "Smart Saver";
  return "Beginner Saver";
}

// Integration with Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
