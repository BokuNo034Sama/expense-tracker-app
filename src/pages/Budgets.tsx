import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { SliceSection } from "@/components/budgets/SliceSection";
import { CategoryForm } from "@/components/budgets/CategoryForm";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { BentoCard } from "@/components/shared/BentoCard";
import type { Category, Slice, Expense } from "@/store/types";

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
  // 🟢 Defensive Guard: Guarantee state collections are always valid arrays before components try to read them
  const categories = useAppStore(s => Array.isArray(s.categories) ? s.categories : []) as Category[];
  const expenses = useAppStore(s => Array.isArray(s.expenses) ? s.expenses : []) as Expense[];
  const profile = useAppStore(s => s.profile);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [activeSliceFilter, setActiveSliceFilter] = useState<string>('all');
  const [showTrends, setShowTrends] = useState<boolean>(false);

  // Filter current month expenses (date prefix: "YYYY-MM")
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  
  // Safe filtering with a string-type check on the expense date property
  const targetExpenses = Array.isArray(expenses) ? expenses : [];
  const monthlyExpenses = targetExpenses.filter(e => e?.date && typeof e.date === "string" && e.date.startsWith(currentMonthPrefix));

  // Compute spend per category
  const categorySpends: { [id: string]: number } = {};
  monthlyExpenses.forEach(e => {
    if (e && e.category_id) {
      categorySpends[e.category_id] = (categorySpends[e.category_id] || 0) + Number(e.amount || 0);
    }
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  // Safe fallback array cast if the profile configuration column hasn't updated or synced locally yet
  const slices = (profile?.enabled_slices && Array.isArray(profile.enabled_slices)
    ? profile.enabled_slices 
    : ['Basic', 'Family', 'Wealth', 'Subscription']) as Slice[];

  const targetSlices = Array.isArray(slices) ? slices : [];
  const activeSlices = activeSliceFilter === 'all'
    ? targetSlices
    : targetSlices.filter(s => s === activeSliceFilter);

  // Filtered expenses based on selected categories/slices
  const filteredExpenses = monthlyExpenses.filter(e => {
    if (!e) return false;
    if (activeSliceFilter === 'all') return true;
    const cat = categories.find(c => c.id === e.category_id);
    return cat?.slice === activeSliceFilter;
  });

  // Calculate totals for Trends Breakdown
  const totalSpent = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalLimit = categories
    .filter(c => activeSliceFilter === 'all' ? true : c.slice === activeSliceFilter)
    .reduce((sum, c) => sum + Number(c.budget_limit || 0), 0);

  const percentage = totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full flex justify-center py-2 px-1"
    >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="w-full max-w-md flex flex-col h-[calc(100vh-140px)] border-4 border-black bg-[#F4F4F0] dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black dark:text-white rounded-none overflow-hidden relative">
        
        {/* A. The Anchored Control Cockpit (Sticky Top Container) */}
        <div className="sticky top-0 z-30 bg-[#F4F4F0] dark:bg-zinc-900 border-b-4 border-black p-4 space-y-4 select-none shrink-0">
          
          {/* Row 1: Header */}
          <div className="flex justify-between items-center gap-2">
            <h1 
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white uppercase truncate"
            >
              BUDGET TRACKER
            </h1>
            <button 
              className="px-2.5 py-1 bg-[#C6EF4E] text-black font-mono font-bold text-[9px] uppercase border-2 border-black shadow-[2px_2px_0px_0px_#000000] animate-sync-pulse rounded-none shrink-0 cursor-default"
              tabIndex={-1}
            >
              [ SYNCING ]
            </button>
          </div>

          {/* Row 2: Horizontal Filter Track */}
          <div 
            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button 
              onClick={() => {
                setActiveSliceFilter('all');
                setShowTrends(false);
              }}
              className={`px-3 py-1.5 font-mono text-[10px] font-bold border-2 border-black rounded-none shrink-0 transition-all ${
                activeSliceFilter === 'all' && !showTrends
                  ? 'bg-[#C6EF4E] text-black shadow-none translate-x-[2px] translate-y-[2px]'
                  : 'bg-white text-black shadow-[2px_2px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
              }`}
            >
              ALL
            </button>
            
            <div className="relative shrink-0">
              <select 
                value={activeSliceFilter} 
                onChange={(e) => {
                  setActiveSliceFilter(e.target.value);
                }}
                className="appearance-none pr-7 pl-3 py-1.5 font-mono text-[10px] font-bold bg-white text-black border-2 border-black rounded-none shadow-[2px_2px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus:outline-none cursor-pointer uppercase"
              >
                <option value="all">ALL CATEGORIES ▼</option>
                {targetSlices.map(slice => (
                  <option key={slice} value={slice}>{slice.toUpperCase()}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-black text-[9px]">
                ▼
              </div>
            </div>

            <button 
              onClick={() => setShowTrends(!showTrends)}
              className={`px-3 py-1.5 font-mono text-[10px] font-bold border-2 border-black rounded-none shrink-0 transition-all ${
                showTrends
                  ? 'bg-[#C6EF4E] text-black shadow-none translate-x-[2px] translate-y-[2px]'
                  : 'bg-white text-black shadow-[2px_2px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
              }`}
            >
              TRENDS
            </button>
          </div>

          {/* Row 3: Primary Call To Action (Split CTAs) */}
          <div className="flex gap-2 w-full pt-1">
            <button 
              onClick={() => setIsExpenseFormOpen(true)}
              className="flex-1 bg-white text-black text-[10px] font-mono font-black py-2.5 px-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase text-center rounded-none cursor-pointer"
            >
              + ADD EXPENDITURE
            </button>
            <button 
              onClick={handleCreate}
              className="flex-1 bg-[#C6EF4E] text-black text-[10px] font-mono font-black py-2.5 px-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase text-center rounded-none cursor-pointer"
            >
              + CREATE BUCKET
            </button>
          </div>
        </div>

        {/* B. The Fluid Scroll Trench (Scrollable Content Container) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#F4F4F0] dark:bg-zinc-900">
          
          {/* Trends Summary Panel */}
          {showTrends && (
            <div className="border-4 border-black p-4 bg-white dark:bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4 rounded-none">
              <h4 className="font-display font-black text-xs uppercase text-black dark:text-white">MONTHLY PROGRESS</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono font-bold text-black dark:text-white">
                  <span>SPENT: ₦{totalSpent.toLocaleString('en-NG')}</span>
                  <span>LIMIT: ₦{totalLimit.toLocaleString('en-NG')}</span>
                </div>
                <div className="h-6 w-full bg-[#F4F4F0] dark:bg-zinc-900 border-2 border-black rounded-none overflow-hidden relative flex items-center">
                  <div 
                    className="h-full bg-[#C6EF4E] border-r-2 border-black" 
                    style={{ width: `${percentage}%` }}
                  />
                  <span className="absolute w-full text-center text-[10px] font-mono font-black text-black z-10">
                    {percentage.toFixed(1)}% CONSUMED
                  </span>
                </div>
              </div>
              
              <div className="border-t-2 border-black pt-4 space-y-3">
                <h5 className="font-mono text-[9px] font-bold text-gray-500 uppercase">BREAKDOWN_BY_SLICE</h5>
                {targetSlices.map(slice => {
                  const sliceCats = categories.filter(c => c.slice === slice);
                  if (sliceCats.length === 0) return null;
                  
                  const sliceLimit = sliceCats.reduce((sum, c) => sum + Number(c.budget_limit || 0), 0);
                  const sliceSpent = filteredExpenses
                    .filter(e => {
                      const cat = categories.find(c => c.id === e.category_id);
                      return cat?.slice === slice;
                    })
                    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
                    
                  const slicePercent = sliceLimit > 0 ? Math.min((sliceSpent / sliceLimit) * 100, 100) : 0;
                  
                  return (
                    <div key={slice} className="space-y-1 font-mono text-[10px] text-black dark:text-white">
                      <div className="flex justify-between font-bold">
                        <span>{slice.toUpperCase()}</span>
                        <span>₦{sliceSpent.toLocaleString('en-NG')} / ₦{sliceLimit.toLocaleString('en-NG')}</span>
                      </div>
                      <div className="h-2 w-full bg-[#F4F4F0] dark:bg-zinc-900 border border-black rounded-none overflow-hidden">
                        <div 
                          className="h-full bg-[#C6EF4E]" 
                          style={{ width: `${slicePercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Budget Metric Bento Cards Section */}
          {!showTrends && (
            <div className="space-y-6">
              {categories.length === 0 ? (
                <BentoCard hoverEffect={false} className="space-y-4 text-center py-8 flex flex-col items-center border-4 border-black rounded-none bg-white dark:bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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
                </BentoCard>
              ) : (
                <div className="space-y-6">
                  {activeSlices.map(slice => (
                    <SliceSection
                      key={slice}
                      slice={slice}
                      categories={categories}
                      categorySpends={categorySpends}
                      onEditCategory={handleEdit}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sticky narrow data legend banner at cockpit transition */}
          <div className="sticky top-0 z-20 bg-black text-[#C6EF4E] text-[9px] font-mono font-bold px-3 py-2 flex justify-between uppercase border-2 border-black rounded-none shadow-[2px_2px_0px_0px_#000000]">
            <span className="w-1/4 text-left">DATE</span>
            <span className="w-1/4 text-left">VENDOR</span>
            <span className="w-1/4 text-left">CATEGORY</span>
            <span className="w-1/4 text-right">AMOUNT</span>
          </div>

          {/* Expenditures List */}
          <div className="border-4 border-black bg-white dark:bg-zinc-800 p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none space-y-1">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-[10px] font-mono text-gray-500 uppercase">
                NO_EXPENDITURES_RECORDED
              </div>
            ) : (
              filteredExpenses.map((exp: Expense) => {
                if (!exp) return null;
                const matchedCat = categories.find(c => c.id === exp.category_id);
                return (
                  <div 
                    key={exp.id} 
                    className="flex justify-between items-center text-[10px] font-mono py-2 px-1 border-b border-black/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="w-1/4 text-left font-bold text-gray-400">
                      {exp.date ? exp.date.substring(5) : 'N/A'}
                    </span>
                    <span className="w-1/4 text-left font-black uppercase truncate text-black dark:text-white" title={exp.vendor}>
                      {exp.vendor || 'UNKNOWN'}
                    </span>
                    <span className="w-1/4 text-left truncate">
                      <span className="bg-[#C6EF4E]/20 text-black dark:text-white px-1.5 py-0.5 border border-black/20 rounded-none font-bold text-[8px]">
                        {matchedCat?.name || 'UNGROUPED'}
                      </span>
                    </span>
                    <span className="w-1/4 text-right font-black text-black dark:text-white">
                      ₦{Number(exp.amount || 0).toLocaleString('en-NG')}
                    </span>
                  </div>
                );
              })
            )}
          </div>
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