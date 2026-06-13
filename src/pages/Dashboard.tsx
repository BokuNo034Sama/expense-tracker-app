import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { useAppStore, getLocalDateString } from "@/store/useAppStore";
import { WealthCard } from "@/components/dashboard/WealthCard";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { SpendingChart } from "@/components/SpendingChart";
import { AdviceCard } from "@/components/dashboard/AdviceCard";
import { BudgetProgress } from "@/components/dashboard/BudgetProgress";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";
import { SpendingRadar } from "@/components/dashboard/SpendingRadar";
import { InvestmentNudge } from "@/components/dashboard/InvestmentNudge";
import { WealthAnalytics } from "@/components/analytics/WealthAnalytics";
import { Eye, EyeOff } from "lucide-react";
import { SyncIndicator } from "@/components/shared/SyncIndicator";

export default function Dashboard() {
  const profile = useAppStore(s => s.profile);
  const expenses = useAppStore(s => s.expenses);
  const incomes = useAppStore(s => s.incomes);
  const categories = useAppStore(s => s.categories);
  const isDataMasked = useAppStore(s => s.isDataMasked);
  const toggleDataMasked = useAppStore(s => s.toggleDataMasked);

  const totalMonthlyIncome = useAppStore(s => s.totalMonthlyIncome);
  const netMonthlySurplus = useAppStore(s => s.netMonthlySurplus);
  const investmentTriggers = useAppStore(s => s.investmentTriggers);

  const filterMonth = useAppStore(s => s.filterMonth);
  const setFilterMonth = useAppStore(s => s.setFilterMonth);
  const activeWealthBanner = useAppStore(s => s.activeWealthBanner);
  const dismissWealthBanner = useAppStore(s => s.dismissWealthBanner);

  const [activeTab, setActiveTab] = useState<'summary' | 'analytics' | 'buckets' | 'receipts'>('summary');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

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

  // Streak computations
  const streak = profile?.current_streak || profile?.financial_streak || 0;
  const filledSegments = streak > 0 ? (streak % 5 === 0 ? 5 : streak % 5) : 0;

  // Naira formatters
  const formatNaira = (amount: number) => {
    if (isDataMasked) return '••••••';
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatNairaNoDecimals = (amount: number) => {
    if (isDataMasked) return '••••••';
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatNairaShort = (amount: number) => {
    if (isDataMasked) return '•••';
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(0)}M`;
    }
    if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(0)}k`;
    }
    return `₦${amount}`;
  };

  // Milestone routing platform router
  const handleGoToPlatform = (platform: string, triggerName: string, targetAmount: number) => {
    const cleanName = triggerName.toUpperCase().replace(/\s+/g, '-');
    const copyText = `KINY-INVEST-${platform.toUpperCase()}-${cleanName}-${targetAmount}`;
    navigator.clipboard.writeText(copyText).then(() => {
      setCopiedToken(`Token copied! Directing you to ${platform}...`);
      setTimeout(() => setCopiedToken(null), 3000);
    }).catch(() => {
      setCopiedToken(`Directing you to ${platform}...`);
      setTimeout(() => setCopiedToken(null), 3000);
    });

    const links: Record<string, string> = {
      bamboo: 'https://investbamboo.com',
      cowrywise: 'https://cowrywise.com',
      trove: 'https://troveapp.co',
      piggyvest: 'https://piggyvest.com'
    };

    const targetUrl = links[platform.toLowerCase()] || 'https://google.com';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Liquid metrics calculations aligned with getLocalDateString()
  const currentMonthPrefix = getLocalDateString().substring(0, 7);

  const baseSalary = parseFloat(String(profile?.estimated_monthly_salary || 0));
  const loggedIncomesSum = incomes
    .filter(i => i.date.startsWith(currentMonthPrefix))
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalIncome = baseSalary + loggedIncomesSum;

  const totalExpenses = expenses
    .filter(e => e.date.startsWith(currentMonthPrefix))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Compute top category
  const categorySpends: { [id: string]: number } = {};
  expenses
    .filter(e => e.date.startsWith(currentMonthPrefix))
    .forEach(e => {
      if (e.category_id) {
        categorySpends[e.category_id] = (categorySpends[e.category_id] || 0) + Number(e.amount);
      }
    });

  let topCategoryId = '';
  let topCategoryAmount = 0;
  Object.entries(categorySpends).forEach(([id, amt]) => {
    if (amt > topCategoryAmount) {
      topCategoryAmount = amt;
      topCategoryId = id;
    }
  });

  const topCategoryName = categories.find(c => c.id === topCategoryId)?.name || 'None';
  const surplusPercent = totalMonthlyIncome > 0 
    ? Math.max(0, Math.min(100, (netMonthlySurplus / totalMonthlyIncome) * 100)) 
    : 0;

  return (
    <div className="h-[calc(100vh-200px)] md:h-auto max-h-[calc(100vh-200px)] md:max-h-none overflow-hidden md:overflow-visible flex flex-col gap-3 md:space-y-6">
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

      {/* Copy notification status alert banner */}
      {copiedToken && (
        <div 
          style={{ fontFamily: 'var(--font-mono)' }}
          className="bg-[#C6EF4E] text-black border-2 border-black font-extrabold text-[11px] p-2 py-1 uppercase text-center rounded-none animate-[pulse_1s_infinite] shadow-[2px_2px_0px_0px_#000000] shrink-0"
        >
          {copiedToken}
        </div>
      )}

      {/* Row 1: System Status Bar */}
      <div className="flex justify-between items-center pb-2 border-b border-black/10 dark:border-white/10 shrink-0">
        <span style={{ fontFamily: 'var(--font-mono)' }} className="text-xs font-bold text-[var(--color-ink-muted)] uppercase tracking-tight">
          // KINY_OS_STANDBY
        </span>
        <SyncIndicator />
      </div>

      {/* Row 2: Horizontal Utility Bar */}
      <div className="flex items-center justify-between border-2 border-black dark:border-white p-1.5 bg-white dark:bg-zinc-800 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FFFFFF] shrink-0 rounded-none font-mono text-xs">
        {/* Left Side: compact date-filter widget */}
        <div className="flex items-center">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-black dark:border-white bg-white dark:bg-zinc-900 text-black dark:text-white px-2 py-0.5 font-bold uppercase cursor-pointer outline-none rounded-none text-xs transition-transform active:translate-y-[1px]"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            <option value="all">ALL_TIME</option>
          </select>
        </div>

        {/* Center Divider & Right Side: tight streak container & retro block-meter */}
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
          style={{ 
            fontFamily: 'var(--font-mono)' 
          }}
          className="bg-[var(--color-surface)] text-[var(--color-text-main)] border-2 border-[var(--color-border)] shadow-[var(--shadow-neubrutalist)] p-3 rounded-[var(--border-radius)] text-xs font-bold leading-relaxed transition-all duration-200 shrink-0"
        >
          🚀 WELCOME_TO_KINY! Your finance OS is online. To get started and generate your automated advice metrics, use the sidebar actions to log your current fixed categories and add your first expense entry.
        </div>
      )}

      {/* Investment Nudge */}
      <div className="shrink-0 md:block hidden">
        <InvestmentNudge />
      </div>

      {/* Mobile 4-Tab Navigation Grid */}
      <div className="md:hidden w-full grid grid-cols-4 border-b-4 border-black dark:border-white shrink-0">
        {(['summary', 'analytics', 'buckets', 'receipts'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-bold uppercase tracking-tighter py-1.5 px-1 text-center border-r-2 border-black dark:border-white last:border-r-0 transition-all duration-150 outline-none
                ${isActive 
                  ? 'bg-[#CCFF00] text-black font-extrabold' 
                  : 'bg-white text-gray-500 dark:bg-zinc-900 dark:text-zinc-400'}
              `}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Mobile Viewports: Conditionally rendering active tab contents */}
      <div className="flex-1 md:hidden overflow-hidden flex flex-col min-h-0">
        {activeTab === 'summary' && (
          <div className="flex-1 flex flex-col gap-2.5 min-h-0">
            {/* The Hero Component (Full Width) */}
            <div className="border-2 border-black dark:border-white bg-[#CCFF00] text-black p-2.5 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FFFFFF] w-full shrink-0 rounded-none">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-black/75">
                  NET_MONTHLY_FLOW
                </span>
                <button
                  onClick={toggleDataMasked}
                  className="p-0.5 border border-black bg-white hover:bg-gray-100 rounded-none text-black transition-colors focus:outline-none flex items-center justify-center cursor-pointer active:translate-y-[1px]"
                  title={isDataMasked ? "Show balances" : "Hide balances"}
                >
                  {isDataMasked ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)' }} className="text-2xl font-black mt-0.5 leading-none">
                {formatNaira(netSavings)}
              </div>
            </div>

            {/* The 2x2 Secondary Macro-Metric Grid */}
            <div className="grid grid-cols-2 gap-2 w-full shrink-0">
              {/* Top Left: TOTAL_INCOME */}
              <div className="border-2 border-black dark:border-white bg-white dark:bg-zinc-800 p-2 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FFFFFF] flex flex-col justify-between rounded-none">
                <span className="text-[9px] font-bold uppercase tracking-wider font-mono text-gray-500 dark:text-zinc-400">
                  TOTAL_INCOME
                </span>
                <span style={{ fontFamily: 'var(--font-mono)' }} className="text-sm font-black mt-0.5 text-black dark:text-white leading-none">
                  {formatNairaNoDecimals(totalIncome)}
                </span>
              </div>

              {/* Top Right: TOTAL_SPENT */}
              <div className="border-2 border-black dark:border-white bg-white dark:bg-zinc-800 p-2 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FFFFFF] flex flex-col justify-between rounded-none">
                <span className="text-[9px] font-bold uppercase tracking-wider font-mono text-gray-500 dark:text-zinc-400">
                  TOTAL_SPENT
                </span>
                <span style={{ fontFamily: 'var(--font-mono)' }} className="text-sm font-black mt-0.5 text-black dark:text-white leading-none">
                  {formatNairaNoDecimals(totalExpenses)}
                </span>
              </div>

              {/* Bottom Left: SAVINGS_RATE */}
              <div className="border-2 border-black dark:border-white bg-white dark:bg-zinc-800 p-2 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FFFFFF] flex flex-col justify-between rounded-none">
                <div className="flex justify-between items-center w-full">
                  <span className="text-[9px] font-bold uppercase tracking-wider font-mono text-gray-500 dark:text-zinc-400">
                    SAVINGS_RATE
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] font-black text-black dark:text-white leading-none">
                    {savingsRate.toFixed(0)}%
                  </span>
                </div>
                {/* Micro inline horizontal bar indicator */}
                <div className="w-full h-1.5 bg-gray-150 dark:bg-zinc-700 border border-black dark:border-white rounded-none mt-1 overflow-hidden">
                  <div
                    style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
                    className="h-full bg-[#CCFF00] rounded-none"
                  />
                </div>
              </div>

              {/* Bottom Right: TOP_EXPENSE */}
              <div className="border-2 border-black dark:border-white bg-white dark:bg-zinc-800 p-2 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FFFFFF] flex flex-col justify-between rounded-none">
                <span className="text-[9px] font-bold uppercase tracking-wider font-mono text-gray-500 dark:text-zinc-400">
                  TOP_EXPENSE
                </span>
                <div className="mt-1 flex items-center justify-between w-full min-h-[16px]">
                  <span className="text-[9px] font-black font-mono text-white bg-black dark:bg-white dark:text-black px-1 py-0.5 leading-none truncate max-w-[70%] uppercase">
                    {topCategoryName}
                  </span>
                  {topCategoryAmount > 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[9px] font-bold text-gray-500 dark:text-zinc-400 shrink-0">
                      {formatNairaShort(topCategoryAmount)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="flex-1 flex flex-col gap-2.5 min-h-0">
            {/* The Anchor Card (Full Width) */}
            <div className="border-2 border-black dark:border-white p-2.5 bg-white dark:bg-zinc-800 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FFFFFF] shrink-0 rounded-none">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-gray-500 dark:text-zinc-400">
                  NET_FLOW_SURPLUS_MONITOR
                </span>
                <span style={{ fontFamily: 'var(--font-mono)' }} className="text-sm font-black text-green-600 dark:text-green-400 leading-none">
                  {formatNairaNoDecimals(netMonthlySurplus)}
                </span>
              </div>
              {/* Primary Efficiency Horizontal Meter */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-mono font-bold text-gray-500 dark:text-zinc-400">
                  <span className="uppercase">SURPLUS_EFFICIENCY_RATE:</span>
                  <span>{surplusPercent.toFixed(1)}%</span>
                </div>
                {/* Horizontal Progress Bar Container */}
                <div className="w-full h-3 bg-gray-100 dark:bg-zinc-900 border border-black dark:border-white rounded-none overflow-hidden p-0">
                  <div 
                    style={{ width: `${surplusPercent}%` }}
                    className="h-full bg-[#CCFF00] transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Flattened Milestone Stream List */}
            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-0.5">
              <div className="text-[10px] font-black uppercase tracking-wider font-mono text-gray-500 dark:text-zinc-400 mb-0.5">
                INVESTMENT_MILESTONES
              </div>
              <div className="space-y-1.5">
                {investmentTriggers.map((trigger) => {
                  const isMet = trigger.status === 'THRESHOLD_MET';
                  const pct = Math.max(0, Math.min(100, (trigger.currentProgress / trigger.targetThreshold) * 100));
                  
                  return (
                    <div 
                      key={trigger.id}
                      className={`border-2 p-2 flex flex-col gap-1 transition-all duration-205 rounded-none
                        ${isMet 
                          ? 'border-[#CCFF00] dark:border-[#CCFF00] bg-lime-50/10 dark:bg-zinc-800/20 shadow-[2px_2px_0px_0px_#CCFF00]' 
                          : 'border-black dark:border-white bg-white dark:bg-zinc-800'}
                      `}
                    >
                      <div className="flex items-center justify-between w-full">
                        {/* Left Alignment: target name and structural type badge side-by-side */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-black font-mono uppercase truncate text-black dark:text-white">
                            {trigger.name}
                          </span>
                          <span className="text-[8px] font-bold font-mono bg-black text-white dark:bg-white dark:text-black px-1 py-0.5 rounded-none uppercase shrink-0">
                            {trigger.assetClass}
                          </span>
                        </div>

                        {/* Right Alignment: compact progress bar running inline with numeric fraction */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-bold font-mono text-gray-500 dark:text-zinc-400">
                            {formatNairaShort(trigger.currentProgress)} / {formatNairaShort(trigger.targetThreshold)}
                          </span>
                          {/* Compressed progress bar */}
                          <div className="border border-black dark:border-white bg-white dark:bg-zinc-900 h-2 w-16 rounded-none overflow-hidden p-0 shrink-0">
                            <div 
                              style={{ width: `${pct}%` }}
                              className="h-full bg-[#CCFF00] rounded-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Expand row container downward to expose routing anchor if Met */}
                      {isMet && (
                        <div className="flex justify-end pt-1 mt-0.5 border-t border-dashed border-black/10 dark:border-white/10">
                          <button
                            onClick={() => handleGoToPlatform(trigger.targetPlatform, trigger.name, trigger.targetThreshold)}
                            className="text-[9px] font-black font-mono text-black dark:text-white hover:text-[#CCFF00] flex items-center gap-0.5 uppercase cursor-pointer"
                          >
                            [GO TO {trigger.targetPlatform.toUpperCase()}] ↗
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'buckets' && (
          <div className="flex-1 overflow-y-auto pr-1 min-h-0 pb-4 animate-fade-in">
            <BudgetProgress />
          </div>
        )}

        {activeTab === 'receipts' && (
          <div className="flex-1 overflow-y-auto pr-1 min-h-0 pb-4 animate-fade-in">
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
