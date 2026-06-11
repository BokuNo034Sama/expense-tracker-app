import { motion, type Variants } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { WealthCard } from "@/components/dashboard/WealthCard";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { SpendingChart } from "@/components/SpendingChart";
import { AdviceCard } from "@/components/dashboard/AdviceCard";
import { BudgetProgress } from "@/components/dashboard/BudgetProgress";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";
import { SpendingRadar } from "@/components/dashboard/SpendingRadar";
import { SyncIndicator } from "@/components/shared/SyncIndicator";
import { InvestmentNudge } from "@/components/dashboard/InvestmentNudge";

export default function Dashboard() {
  const profile = useAppStore(s => s.profile);

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Dashboard Top bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-3xl font-extrabold tracking-tight text-[var(--color-ink)] uppercase"
          >
            DASHBOARD
          </h1>
          <p 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs text-[var(--color-ink-muted)] uppercase mt-1"
          >
            WELCOME_BACK, {username.toUpperCase()} // STATUS_CONNECTED
          </p>
        </div>
        
        {/* Sync Indicator */}
        <SyncIndicator />
      </div>

      {/* Investment Nudge */}
      <InvestmentNudge />
      
      {/* Bento Grid Layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
          <SummaryCard type="transactions" />
        </motion.div>

        {/* Row 2 Chart & Advice */}
        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3">
          <SpendingChart />
        </motion.div>
        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-1">
          <AdviceCard />
        </motion.div>

        {/* Row 3 Progress & Radar */}
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
          <BudgetProgress />
        </motion.div>
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
          <RecentExpenses />
        </motion.div>
        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2">
          <SpendingRadar />
        </motion.div>
      </div>
    </motion.div>
  );
}
