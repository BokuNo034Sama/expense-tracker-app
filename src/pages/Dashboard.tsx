import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore, useCurrentStreak, getPastCycles } from "@/store/useAppStore";
import { WealthCard } from "@/components/dashboard/WealthCard";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";
import { DeveloperTipCard } from "@/components/dashboard/DeveloperTipCard";
import { InvestmentNudge } from "@/components/dashboard/InvestmentNudge";
import { KinyWrapExport } from "@/components/dashboard/KinyWrapExport";
import { SyncIndicator } from "@/components/shared/SyncIndicator";
import { SquadHomeTile } from "@/components/squads/SquadHomeTile";
import { WhatIfSimulator } from "@/components/dashboard/WhatIfSimulator";
import { BurnRateWarningCard } from "@/components/dashboard/BurnRateWarningCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const expenses = useAppStore(s => s.expenses);
  const profile = useAppStore(s => s.profile);
  const appState = useAppStore(s => s.appState);
  const loading = useAppStore(s => s.loading);

  const filterMonth = useAppStore(s => s.filterMonth);
  const setFilterMonth = useAppStore(s => s.setFilterMonth);
  const activeWealthBanner = useAppStore(s => s.activeWealthBanner);
  const dismissWealthBanner = useAppStore(s => s.dismissWealthBanner);

  // Streak computations
  const streak = useCurrentStreak();
  const filledSegments = streak > 0 ? (streak % 5 === 0 ? 5 : streak % 5) : 0;

  // Generate canonical financial cycles for the active user profile
  const availableCycles = useMemo(() => getPastCycles(profile, 12), [profile]);

  if (appState === 'LOADING' || loading?.profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-xs uppercase tracking-widest text-[var(--color-ink-muted)] animate-pulse"
        >
          LOADING_KINY_OS...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-24 md:pb-8">
      {/* Page content in a single scroll — no tabs */}
      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto md:max-w-none md:px-6">

        {/* Wealth Banner Alert */}
        {activeWealthBanner && (
          <div className="bg-[#C6EF4E] text-black border-2 border-black p-4 font-mono font-extrabold text-xs uppercase flex justify-between items-center rounded-[var(--border-radius)] mb-2 animate-[pulse_1s_infinite] shrink-0">
            <span>{activeWealthBanner}</span>
            <button 
              onClick={dismissWealthBanner}
              className="ml-4 bg-black text-white px-2 py-1 text-[10px] border border-white hover:bg-zinc-800 transition-colors uppercase cursor-pointer shrink-0"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* 1. System Status Bar & Utility Header */}
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-black/10 dark:border-white/10 shrink-0">
            <span style={{ fontFamily: 'var(--font-mono)' }} className="text-xs font-bold text-[var(--color-ink-muted)] uppercase tracking-tight">
              // KINY_OS_STANDBY
            </span>
            <SyncIndicator />
          </div>

          <div className="flex items-center justify-between border-2 border-black dark:border-white p-1.5 bg-white dark:bg-zinc-800 shrink-0 rounded-none font-mono text-xs">
            <div className="flex items-center">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="border border-black dark:border-white bg-white dark:bg-zinc-900 text-black dark:text-white px-2 py-0.5 font-bold uppercase cursor-pointer outline-none rounded-none text-xs transition-transform active:translate-y-[1px]"
              >
                {availableCycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.isCurrent ? 'current' : cycle.id}>
                    {cycle.label}
                  </option>
                ))}
                <option value="all">ALL_TIME</option>
              </select>
            </div>

            <div className="flex items-center">
              <div className="border-l-2 border-black dark:border-white h-4 mx-2" />
              <div className="flex items-center font-bold tracking-tighter gap-1">
                <span>⚡ {streak}-DAY STREAK</span>
                <span className="inline-flex tracking-tighter ml-1 text-xs">
                  <span className="text-[#CCFF00]">{'▰'.repeat(filledSegments)}</span>
                  <span className="text-gray-300 dark:text-zinc-700">{'▱'.repeat(5 - filledSegments)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Welcome guide card if no expenses logged */}
          {expenses.length === 0 && (
            <div 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="bg-[var(--color-surface)] text-[var(--color-text-main)] border-2 border-black dark:border-white p-3 rounded-[var(--border-radius)] text-xs font-bold leading-relaxed transition-all duration-200 shrink-0"
            >
              🚀 WELCOME_TO_KINY! Your finance OS is online. To get started and generate your automated advice metrics, use the sidebar actions to log your current fixed categories and add your first expense entry.
            </div>
          )}
        </div>

        {/* 2. Burn Rate Warning (Phase 2 — premium gated) */}
        <BurnRateWarningCard />

        {/* 3. What-If Simulator — premium feature */}
        <WhatIfSimulator />

        {/* 4. Investment Nudge (conditional) */}
        <InvestmentNudge />

        {/* 5. Squad Tile (read-only) */}
        <SquadHomeTile />

        {/* 6. Wealth Card */}
        <WealthCard />

        {/* 7. Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <SummaryCard type="totalSpent" />
          <SummaryCard type="transactions" />
          <SummaryCard type="topCategory" />
        </div>

        {/* 8. Recent Expenses with navigation link */}
        <RecentExpenses />
        <DeveloperTipCard />
        <button
          onClick={() => navigate('/expenses')}
          style={{ fontFamily: 'var(--font-mono)' }}
          className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] border border-[var(--color-ink)]/20 rounded-[var(--border-radius)] hover:bg-[var(--color-ink)]/5 transition-colors cursor-pointer"
        >
          VIEW_ALL_EXPENSES →
        </button>

        {/* 9. Budget shortcut */}
        <button
          onClick={() => navigate('/budgets')}
          style={{ fontFamily: 'var(--font-mono)' }}
          className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] border border-[var(--color-ink)]/20 rounded-[var(--border-radius)] hover:bg-[var(--color-ink)]/5 transition-colors cursor-pointer"
        >
          VIEW_FULL_BUDGETS →
        </button>

        <KinyWrapExport />
      </div>
    </div>
  );
}

