import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { WealthCard } from "@/components/dashboard/WealthCard";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { SpendingChart } from "@/components/SpendingChart";
import { AdviceCard } from "@/components/dashboard/AdviceCard";
import { BudgetProgress } from "@/components/dashboard/BudgetProgress";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";
import { SpendingRadar } from "@/components/dashboard/SpendingRadar";
import { InvestmentNudge } from "@/components/dashboard/InvestmentNudge";
import { WealthAnalytics } from "@/components/analytics/WealthAnalytics";

export default function Dashboard() {
  const profile = useAppStore(s => s.profile);
  const expenses = useAppStore(s => s.expenses);
  const filterMonth = useAppStore(s => s.filterMonth);
  const setFilterMonth = useAppStore(s => s.setFilterMonth);
  const activeWealthBanner = useAppStore(s => s.activeWealthBanner);
  const dismissWealthBanner = useAppStore(s => s.dismissWealthBanner);
  const [activeTab, setActiveTab] = useState<'summary' | 'buckets' | 'receipts'>('summary');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 260, damping: 20 } 
    }
  };

  const username = profile?.name || 'USER';

  // Generate month options dynamically: last 12 months
  const monthOptions = [];
  const currentDate = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const value = d.toISOString().substring(0, 7);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    monthOptions.push({ value, label });
  }

  const isWealthEnabled = profile?.enabled_slices?.includes('Wealth') ?? true;

  return (
    <div className="h-[calc(100vh-200px)] md:h-auto max-h-[calc(100vh-200px)] md:max-h-none overflow-hidden md:overflow-visible flex flex-col gap-4 md:space-y-6">
      {/* Wealth Banner Alert */}
      {activeWealthBanner && (
        <div className="bg-[#C6EF4E] text-black border-4 border-black p-4 font-mono font-extrabold text-xs uppercase flex justify-between items-center shadow-[4px_4px_0px_0px_#000000] rounded-[var(--border-radius)] mb-2 animate-[pulse_1s_infinite] shrink-0">
          <span>{activeWealthBanner}</span>
          <button 
            onClick={dismissWealthBanner}
            className="ml-4 bg-black text-white px-2 py-1 text-[10px] border border-white hover:bg-zinc-800 transition-colors uppercase cursor-pointer shrink-0"
          >
            DISMISS
          </button>
        </div>
      )}
      {/* Dashboard Top bar */}
      <div className="flex justify-between items-start md:items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-ink)] uppercase"
            >
              DASHBOARD
            </h1>
            <div 
              style={{ border: '2px solid black', fontFamily: 'var(--font-mono)' }}
              className="bg-[var(--color-primary)] text-black px-2 py-1 text-xs font-bold uppercase shadow-[var(--shadow-btn-active)] rounded-[var(--border-radius)] whitespace-nowrap shrink-0"
            >
              🔥 {profile?.financial_streak || 0}_DAY_FINANCIAL_SHIELD
            </div>
          </div>
          <p 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs text-[var(--color-ink-muted)] uppercase mt-1"
          >
            WELCOME_BACK, {username.toUpperCase()} // STATUS_CONNECTED
          </p>
        </div>

        {/* Dynamic Month/Year Dropdown Filter */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[var(--color-ink-muted)] uppercase hidden sm:inline">VIEW_MONTH:</span>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border-2 border-black bg-white dark:bg-zinc-900 text-black dark:text-white p-2 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase cursor-pointer outline-none rounded-[var(--border-radius)] transition-transform active:translate-y-[1px]"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            <option value="all">ALL_TIME</option>
          </select>
        </div>
      </div>

      {/* Welcome guide card if no expenses logged */}
      {expenses.length === 0 && (
        <div 
          style={{ 
            fontFamily: 'var(--font-mono)' 
          }}
          className="bg-[var(--color-surface)] text-[var(--color-text-main)] border-2 border-[var(--color-border)] shadow-[var(--shadow-neubrutalist)] p-4 rounded-[var(--border-radius)] text-xs font-bold leading-relaxed transition-all duration-200 shrink-0"
        >
          🚀 WELCOME_TO_KINY! Your finance OS is online. To get started and generate your automated advice metrics, use the sidebar actions to log your current fixed categories and add your first expense entry.
        </div>
      )}

      {/* Investment Nudge */}
      <div className="shrink-0 md:block hidden">
        <InvestmentNudge />
      </div>

      {/* Mobile Tab Navigation */}
      <div className="flex md:hidden border-2 border-black rounded-[var(--border-radius)] overflow-hidden bg-white shadow-[var(--shadow-btn)] shrink-0">
        <button
          onClick={() => setActiveTab('summary')}
          style={{ fontFamily: 'var(--font-display)' }}
          className={`flex-1 py-2.5 text-[10px] font-extrabold uppercase border-r-2 border-black transition-all duration-150
            ${activeTab === 'summary' ? 'bg-[var(--color-primary)] text-black' : 'bg-white text-gray-500'}
          `}
        >
          SUMMARY
        </button>
        <button
          onClick={() => setActiveTab('buckets')}
          style={{ fontFamily: 'var(--font-display)' }}
          className={`flex-1 py-2.5 text-[10px] font-extrabold uppercase border-r-2 border-black transition-all duration-150
            ${activeTab === 'buckets' ? 'bg-[var(--color-primary)] text-black' : 'bg-white text-gray-500'}
          `}
        >
          BUCKETS
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          style={{ fontFamily: 'var(--font-display)' }}
          className={`flex-1 py-2.5 text-[10px] font-extrabold uppercase transition-all duration-150
            ${activeTab === 'receipts' ? 'bg-[var(--color-primary)] text-black' : 'bg-white text-gray-500'}
          `}
        >
          RECEIPTS
        </button>
      </div>

      {/* Mobile Viewports: Conditionally rendering active tab contents */}
      <div className="flex-1 md:hidden overflow-hidden flex flex-col min-h-0">
        {activeTab === 'summary' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 pb-4">
            <WealthCard />
            {isWealthEnabled && <WealthAnalytics />}
            <SummaryCard type="totalSpent" />
            <SummaryCard type="topCategory" />
            <div className="w-full h-auto">
              <SpendingChart />
            </div>
            <div className="w-full h-auto flex flex-col gap-4 mt-4">
              <AdviceCard />
              <SpendingRadar />
            </div>
          </div>
        )}
        {activeTab === 'buckets' && (
          <div className="flex-1 overflow-y-auto pr-1 min-h-0 pb-4">
            <BudgetProgress />
          </div>
        )}
        {activeTab === 'receipts' && (
          <div className="flex-1 overflow-y-auto pr-1 min-h-0 pb-4">
            <RecentExpenses />
          </div>
        )}
      </div>

      {/* Desktop Viewport Bento Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="hidden md:grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {/* Row 1 Summaries */}
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
          <WealthCard />
        </motion.div>
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
          <SummaryCard type="totalSpent" />
        </motion.div>
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
          <SummaryCard type="topCategory" />
        </motion.div>

        {isWealthEnabled && (
          <motion.div variants={itemVariants} className="col-span-full">
            <WealthAnalytics />
          </motion.div>
        )}

        {/* Row 2: Transactions & Chart */}
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
          <SummaryCard type="transactions" />
        </motion.div>
        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2">
          <SpendingChart />
        </motion.div>

        {/* Row 3: Budget Progress & Recent Expenses */}
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
          <BudgetProgress />
        </motion.div>
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-2">
          <RecentExpenses />
        </motion.div>
        
        {/* Row 4: Advice & Spending Radar */}
        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-1">
          <AdviceCard />
        </motion.div>
        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2">
          <SpendingRadar />
        </motion.div>
      </motion.div>
    </div>
  );
}
