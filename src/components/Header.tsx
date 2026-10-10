import React, { useState } from "react";
import { Bell, CreditCard, ChevronDown, User, Check, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, AppNotification } from "../types";

interface HeaderProps {
  profile: UserProfile;
  walletBalance: number;
  notifications: AppNotification[];
  onMarkNotificationsRead: () => void;
  onOpenDeposit: () => void;
  currency: string;
}

export default function Header({
  profile,
  walletBalance,
  notifications,
  onMarkNotificationsRead,
  onOpenDeposit,
  currency
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header id="app-header" className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 px-4 py-3 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center space-x-2">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/15">
          <span className="font-display font-bold text-lg text-slate-950">P</span>
        </div>
        <div>
          <div className="flex items-center space-x-1">
            <h1 className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              PennyPilot
            </h1>
            {profile.isPremium && (
              <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                PRO 👑
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
            <span className="font-mono bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800 text-cyan-400">
              Lvl {profile.level || 1}
            </span>
            <span className="flex items-center text-amber-400 font-bold">
              🔥 {profile.streak || 0}
            </span>
            <span className="flex items-center text-yellow-400 font-bold">
              🪙 {profile.saveCoins?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Wallet Pill */}
        <button
          id="wallet-trigger"
          onClick={onOpenDeposit}
          className="flex items-center space-x-2 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/30 px-3 py-1.5 rounded-full transition-all duration-200"
        >
          <CreditCard className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-medium text-slate-300">Wallet:</span>
          <span className="text-xs font-mono font-semibold text-emerald-400">
            {currency}{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </span>
        </button>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            id="notifications-bell"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications && unreadCount > 0) {
                onMarkNotificationsRead();
              }
            }}
            className="p-2 bg-slate-900 hover:bg-slate-850 rounded-full border border-slate-800 text-slate-300 hover:text-emerald-400 transition-colors relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 text-[10px] font-bold text-slate-950 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Backdrop overlay */}
                <div 
                  className="fixed inset-0 z-45" 
                  onClick={() => setShowNotifications(false)} 
                />
                <motion.div
                  id="notifications-dropdown"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 z-50 p-1"
                >
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">System Alerts</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-slate-850">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 font-sans">
                        No recent system alerts.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 text-xs transition-colors ${
                            notif.read ? "bg-slate-900 text-slate-400" : "bg-slate-850/55 text-slate-200"
                          }`}
                        >
                          <div className="flex justify-between items-start space-x-1">
                            <span className="font-sans leading-relaxed">{notif.text}</span>
                            {!notif.read && (
                              <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">
                            {new Date(notif.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Badge */}
        <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 p-[1px] shadow">
            <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center">
              <User className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-medium text-slate-300 leading-none">{profile.name}</p>
            <p className="text-[9px] font-mono text-slate-500 mt-0.5">{profile.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
