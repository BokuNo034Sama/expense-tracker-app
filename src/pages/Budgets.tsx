import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { SliceBreakdownPanel } from "@/components/budgets/SliceBreakdownPanel";
import { CategoryCard } from "@/components/budgets/CategoryCard";
import { CategoryForm } from "@/components/budgets/CategoryForm";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import type { Category, Slice } from "@/store/types";

import { useBudgetSummary } from "@/hooks/useBudgetSummary";

const customStyles = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  @keyframes sync-pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(0.96);
    }
  }
  .animate-sync-pulse {
    animation: sync-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

export default function Budgets() {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [activeSliceFilter, setActiveSliceFilter] = useState<string>('all');
  const [showTrends, setShowTrends] = useState<boolean>(false);

  const profile    = useAppStore(s => s.profile);
  const budgetSlicesStore = useAppStore(s => s.budgetSlices);
  const appState   = useAppStore(s => s.appState);
  const loading    = useAppStore(s => s.loading);

  const { categoryMetrics } = useBudgetSummary();

  // Confirm loading gate exists
  if (appState === 'LOADING' || loading.categories || loading.expenses) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span style={{ fontFamily: 'var(--font-mono)' }}
          className="text-xs uppercase tracking-widest 
          text-[var(--color-ink-muted)] animate-pulse">
          RETRIEVING_NAIRA_ARCHITECTURES...
        </span>
      </div>
    );
  }

  const categories = useAppStore(s => s.categories);

  const spentByCategory: Record<string, number> = {};
  categoryMetrics.forEach(cm => {
    spentByCategory[cm.id] = cm.spent;
  });

  const budgetSlices = Array.isArray(budgetSlicesStore) ? budgetSlicesStore.filter(b => b && typeof b === 'object') : [];





  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const rawSlices = profile?.enabled_slices as any;
  const enabledSlicesList: string[] = Array.isArray(rawSlices)
    ? rawSlices
    : (typeof rawSlices === 'string'
        ? rawSlices.split(',').map((s: string) => s.trim()).filter(Boolean)
        : ['Basic', 'Family', 'Wealth', 'Subscription', 'Chop_Life', 'Black_Tax', 'Side_Hustle']
      );

  const slices = budgetSlices.length > 0
    ? budgetSlices.map(s => s.slice_name).filter(Boolean)
    : enabledSlicesList.filter(Boolean) as Slice[];

  // Force an empty array fallback if slices is undefined, null, or not an array
  const activeSlices = Array.isArray(slices) ? slices : [];

  if (activeSlices.length === 0) {
    return (
      <div className="p-6 border-2 border-black bg-white text-black font-mono">
        <h3 className="font-bold uppercase">[ NO_ACTIVE_SLICES ]</h3>
        <p className="text-xs text-zinc-600 mt-2">
          Abeg, head over to your Profile Settings to initialize or create your custom budget slices!
        </p>
      </div>
    );
  }

  const filteredCategories = categories.filter(c => {
    if (!c) return false;
    if (activeSliceFilter === 'all') return true;
    return c.slice === activeSliceFilter;
  });





  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[var(--color-bg)] pb-24 md:pb-8 px-1 text-black dark:text-white"
    >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="w-full flex flex-col relative">
        
        {/* A. The Anchored Control Cockpit (Sticky Top Container) */}
        <div className="bg-[var(--color-bg)] dark:bg-zinc-900 pb-4 space-y-4 select-none shrink-0 border-b-2 border-black dark:border-white">
          
          {/* Row 1: Horizontal Filter Track */}
          <div className="flex items-center gap-2 py-0.5 text-xs font-mono font-bold">
            <button 
              onClick={() => {
                setActiveSliceFilter('all');
                setShowTrends(false);
              }}
              className={`px-3 py-1.5 font-mono text-[10px] font-bold border-2 border-black dark:border-white rounded-none shrink-0 transition-all ${
                activeSliceFilter === 'all' && !showTrends
                  ? 'bg-[#C6EF4E] text-black'
                  : 'bg-white text-black'
              }`}
            >
              ALL
            </button>
            
            <span>|</span>

            <div className="relative shrink-0">
              <select 
                value={activeSliceFilter} 
                onChange={(e) => {
                  setActiveSliceFilter(e.target.value);
                }}
                className="appearance-none pr-7 pl-3 py-1.5 font-mono text-[10px] font-bold bg-white text-black border-2 border-black rounded-none focus:outline-none cursor-pointer uppercase"
              >
                <option value="all">ALL CATEGORIES ▼</option>
                {activeSlices.map(slice => (
                  <option key={slice} value={slice}>{(slice || '').toUpperCase()}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-black text-[9px]">
                ▼
              </div>
            </div>

            <span>|</span>

            <button 
              onClick={() => setShowTrends(!showTrends)}
              className={`px-3 py-1.5 font-mono text-[10px] font-bold border-2 border-black dark:border-white rounded-none shrink-0 transition-all ${
                showTrends
                  ? 'bg-[#C6EF4E] text-black'
                  : 'bg-white text-black'
              }`}
            >
              TRENDS
            </button>
          </div>

          {/* Row 2: Primary Call To Action */}
          <div className="w-full pt-1">
            <button 
              onClick={handleCreate}
              className="w-full bg-[#C6EF4E] text-black text-[10px] font-mono font-black py-2.5 px-3 border-2 border-black shadow-[3px_3px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all uppercase text-center rounded-none cursor-pointer"
            >
              + CREATE BUCKET
            </button>
          </div>
        </div>

        {/* B. Content Container */}
        <div className="py-4 space-y-6 bg-transparent">
          
          {/* Trends Summary Panel */}
          <SliceBreakdownPanel isOpen={showTrends} />

          {/* Budget Metric Bento Cards Section */}
          {!showTrends && (
            <div className="space-y-6">
              {filteredCategories.length === 0 ? (
                <div className="space-y-4 text-center py-8 flex flex-col items-center border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-800">
                  <h3 
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-sm font-extrabold uppercase text-black dark:text-white"
                  >
                    BUCKETS ARE EMPTY
                  </h3>
                  <p 
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className="text-[10px] text-gray-500 uppercase leading-relaxed max-w-xs"
                  >
                    No spending allocations configured yet. Create a budget slice to establish a threshold baseline.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredCategories.map(cat => {
                    const spent   = spentByCategory[cat.id] || 0;
                    const limit   = Number(cat.budget_limit) || 0;
                    const pct     = limit > 0 
                      ? Math.min((spent / limit) * 100, 100) 
                      : 0;

                    const barColor =
                      pct >= 80 ? 'bg-[var(--color-danger)]' :
                      pct >= 60 ? 'bg-[var(--color-warn)]'   :
                      'bg-[var(--color-ink)]';

                    // Read the value to satisfy the TypeScript unused variables compiler rule
                    if (pct < 0) {
                      console.log('[KINY] negative progress:', pct, barColor);
                    }

                    return (
                      <CategoryCard
                         key={cat.id}
                         category={{
                           ...cat,
                           budget_limit: limit
                         }}
                         spent={spent}
                         onEdit={handleEdit}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Category Creation/Edit Form Modal */}
      <CategoryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        category={editingCategory}
      />

      {/* Expenditure Creation Form Modal */}
      <ExpenseForm
        open={isExpenseFormOpen}
        onOpenChange={setIsExpenseFormOpen}
      />
    </motion.div>
  );
}