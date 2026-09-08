import React, { useState } from "react";
import { TrendingUp, Award, Calendar, Flame, DollarSign, PieChart, Sparkles, Activity } from "lucide-react";
import { motion } from "motion/react";
import { SavingsGoal, WalletTransaction } from "../types";

interface AnalyticsProps {
  goals: SavingsGoal[];
  transactions: WalletTransaction[];
  currency: string;
}

export default function Analytics({ goals, transactions, currency }: AnalyticsProps) {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  const totalActiveSaved = goals
    .filter((g) => g.status === "active")
    .reduce((acc, g) => acc + g.currentSavings, 0);

  const totalCompletedSaved = goals
    .filter((g) => g.status === "completed" || g.status === "withdrawn")
    .reduce((acc, g) => acc + g.targetAmount, 0);

  const totalSavedAllTime = totalActiveSaved + totalCompletedSaved;

  // Streak calculation (simulate a 14-day savings streak based on recent saves!)
  const savingStreak = 14;

  // 1. Calculate Category Breakdown
  const categories: { [key: string]: { amount: number; color: string; hoverColor: string } } = {
    Shopping: { amount: 0, color: "#f59e0b", hoverColor: "#fbbf24" }, // amber
    Travel: { amount: 0, color: "#06b6d4", hoverColor: "#22d3ee" }, // cyan
    Education: { amount: 0, color: "#6366f1", hoverColor: "#818cf8" }, // indigo
    Emergency: { amount: 0, color: "#f43f5e", hoverColor: "#fb7185" }, // rose
    Other: { amount: 0, color: "#10b981", hoverColor: "#34d399" } // emerald
  };

  goals.forEach((g) => {
    if (categories[g.category]) {
      categories[g.category].amount += g.currentSavings;
    }
  });

  const categoryData = Object.entries(categories)
    .map(([name, val]) => ({
      name,
      value: val.amount,
      color: val.color,
      hoverColor: val.hoverColor
    }))
    .filter((c) => c.value > 0);

  const totalCategoryVal = categoryData.reduce((acc, c) => acc + c.value, 0);

  // 2. SVG Donut chart calculation
  let accumulatedPercent = 0;
  const donutSlices = categoryData.map((slice, idx) => {
    const percentage = totalCategoryVal > 0 ? (slice.value / totalCategoryVal) : 0;
    const startAngle = (accumulatedPercent * 360) - 90;
    accumulatedPercent += percentage;
    const endAngle = (accumulatedPercent * 360) - 90;

    // Convert polar coordinates to Cartesian
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = ((angleInDegrees) * Math.PI) / 180.0;
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians)
      };
    };

    const radius = 70;
    const innerRadius = 45;
    const cx = 100;
    const cy = 100;

    const startOuter = polarToCartesian(cx, cy, radius, startAngle);
    const endOuter = polarToCartesian(cx, cy, radius, endAngle);
    const startInner = polarToCartesian(cx, cy, innerRadius, startAngle);
    const endInner = polarToCartesian(cx, cy, innerRadius, endAngle);

    const largeArcFlag = percentage > 0.5 ? 1 : 0;

    // SVG Path for Donut Slice
    const pathData = `
      M ${startOuter.x} ${startOuter.y}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}
      L ${endInner.x} ${endInner.y}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}
      Z
    `;

    return {
      ...slice,
      pathData,
      percentage: Math.round(percentage * 100),
      index: idx
    };
  });

  // 3. SVG Timeline/Line area chart data (Simulating historical progress over 5 months)
  const monthlyTimeline = [
    { label: "Mar", value: 80000 },
    { label: "Apr", value: 160000 },
    { label: "May", value: 290000 },
    { label: "Jun", value: 410000 },
    { label: "Jul", value: totalSavedAllTime }
  ];

  const maxTimelineVal = Math.max(...monthlyTimeline.map((d) => d.value), 100000);
  const chartHeight = 120;
  const chartWidth = 320;
  const paddingLeft = 10;
  const paddingRight = 10;
  const ptInterval = (chartWidth - paddingLeft - paddingRight) / (monthlyTimeline.length - 1);

  // Map points to SVG coordinates
  const linePoints = monthlyTimeline.map((pt, idx) => {
    const x = paddingLeft + idx * ptInterval;
    const y = chartHeight - (pt.value / maxTimelineVal) * (chartHeight - 20) - 10;
    return { x, y, ...pt };
  });

  // Construct Area Path (for gradient fill under the line)
  const areaPath = linePoints.length > 0
    ? `M ${linePoints[0].x} ${chartHeight} ` +
      linePoints.map((pt) => `L ${pt.x} ${pt.y}`).join(" ") +
      ` L ${linePoints[linePoints.length - 1].x} ${chartHeight} Z`
    : "";

  // Construct Line Path
  const strokePath = linePoints.length > 0
    ? linePoints.map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ")
    : "";

  return (
    <div className="space-y-6">
      {/* Quick summary bento grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total saved all time */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute right-3 top-3 bg-emerald-500/10 p-2 rounded-xl">
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">Saved All Time</span>
          <p className="text-xl font-display font-bold text-slate-100 mt-1">
            {currency}
            {totalSavedAllTime.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
          <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-mono mt-1">
            <TrendingUp className="h-3 w-3" />
            <span>+15.2% monthly</span>
          </div>
        </div>

        {/* Streak card */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute right-3 top-3 bg-rose-500/10 p-2 rounded-xl">
            <Flame className="h-4 w-4 text-rose-500" />
          </div>
          <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">Savings Streak</span>
          <p className="text-xl font-display font-bold text-slate-100 mt-1">
            {savingStreak} Days
          </p>
          <div className="text-[10px] text-slate-500 font-sans mt-1">
            Keep saving to beat your record!
          </div>
        </div>

        {/* Active Goals card */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute right-3 top-3 bg-cyan-500/10 p-2 rounded-xl">
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">Active Goals</span>
          <p className="text-xl font-display font-bold text-slate-100 mt-1">
            {goals.filter((g) => g.status === "active").length} Goals
          </p>
          <p className="text-[10px] text-slate-500 font-sans mt-1">
            {goals.filter((g) => g.status === "completed").length} pending withdraw
          </p>
        </div>

        {/* Automated Savings Coverage */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute right-3 top-3 bg-indigo-500/10 p-2 rounded-xl">
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </div>
          <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">Auto Velocity</span>
          <p className="text-xl font-display font-bold text-slate-100 mt-1">
            {currency}
            {goals
              .filter((g) => g.status === "active" && g.autoSaveFrequency !== "none")
              .reduce((acc, g) => {
                let weeklyVal = g.autoSaveAmount;
                if (g.autoSaveFrequency === "daily") weeklyVal = g.autoSaveAmount * 7;
                if (g.autoSaveFrequency === "monthly") weeklyVal = g.autoSaveAmount / 4.3;
                return acc + weeklyVal;
              }, 0)
              .toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-[11px] font-normal text-slate-400">/wk</span>
          </p>
          <p className="text-[10px] text-slate-500 font-sans mt-1">
            Powered by automatic schedules
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown Donut */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald-400" /> Target allocation of funds
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            {/* SVG Donut */}
            <div className="relative h-44 w-44">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {donutSlices.length === 0 ? (
                  <circle cx="100" cy="100" r="55" fill="none" stroke="#1e293b" strokeWidth="25" />
                ) : (
                  donutSlices.map((slice) => (
                    <motion.path
                      key={slice.index}
                      d={slice.pathData}
                      fill={hoveredSlice === slice.index ? slice.hoverColor : slice.color}
                      stroke="#020617"
                      strokeWidth="1.5"
                      onMouseEnter={() => setHoveredSlice(slice.index)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: slice.index * 0.05 }}
                      className="cursor-pointer transition-all duration-200"
                    />
                  ))
                )}
              </svg>
              {/* Inner Label text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                {hoveredSlice !== null && donutSlices[hoveredSlice] ? (
                  <>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      {donutSlices[hoveredSlice].name}
                    </span>
                    <span className="text-lg font-display font-bold text-slate-100">
                      {donutSlices[hoveredSlice].percentage}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      Allocated
                    </span>
                    <span className="text-lg font-display font-bold text-emerald-400">
                      {currency}
                      {totalCategoryVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Legends */}
            <div className="space-y-2">
              {donutSlices.length === 0 ? (
                <p className="text-xs text-slate-500 font-sans">No data to display allocation.</p>
              ) : (
                donutSlices.map((slice) => (
                  <div
                    key={slice.index}
                    className="flex items-center space-x-3 cursor-pointer p-1 rounded-lg hover:bg-slate-900/40 transition-colors"
                    onMouseEnter={() => setHoveredSlice(slice.index)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    <span className="h-3 w-3 rounded" style={{ backgroundColor: slice.color }} />
                    <div>
                      <p className="text-xs font-semibold text-slate-200 leading-none">
                        {slice.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {currency}
                        {slice.value.toLocaleString()} ({slice.percentage}%)
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Growth Trend Timeline Chart */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-400" /> Historical savings projection
          </h3>

          <div className="pt-2">
            {/* Custom SVG Line Chart */}
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full overflow-visible">
              <defs>
                <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="10" x2={chartWidth} y2="10" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="110" x2={chartWidth} y2="110" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />

              {/* Shaded Gradient Area */}
              {areaPath && (
                <motion.path
                  d={areaPath}
                  fill="url(#area-gradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                />
              )}

              {/* SVG Line path */}
              {strokePath && (
                <motion.path
                  d={strokePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              )}

              {/* Data dots with tooltip-hover triggers */}
              {linePoints.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#10b981"
                    stroke="#020617"
                    strokeWidth="1.5"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {idx === linePoints.length - 1 ? "Live" : `${currency}${Math.round(pt.value/1000)}k`}
                  </text>
                  {/* Axis Label */}
                  <text
                    x={pt.x}
                    y={chartHeight + 12}
                    textAnchor="middle"
                    fill="#475569"
                    fontSize="9"
                    fontFamily="sans-serif"
                    fontWeight="500"
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-900/60 flex items-start gap-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-bold font-mono">INSIGHT:</span>
            <span>
              Your saving velocity surged in **May** following the setup of the automated weekly savers. You are on track to increase your total pool value by another **{currency}36,000** by the end of August.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
