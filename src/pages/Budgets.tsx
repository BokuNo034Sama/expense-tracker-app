import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore, getCycleBoundaries } from "@/store/useAppStore";
import { CategoryCard } from "@/components/budgets/CategoryCard";
import { CategoryForm } from "@/components/budgets/CategoryForm";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
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
  const budgetSlices = useAppStore(s => s.budgetSlices || []);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [activeSliceFilter, setActiveSliceFilter] = useState<string>('all');
  const [showTrends, setShowTrends] = useState<boolean>(false);

  const currentCycle = getCycleBoundaries(profile);
  
  // Safe filtering with a dynamic boundary check
  const targetExpenses = Array.isArray(expenses) ? expenses : [];
  const monthlyExpenses = targetExpenses.filter(e => {
    if (!e || !e.date || typeof e.date !== "string") return false;
    const txnDate = new Date(e.date);
    return txnDate >= currentCycle.startDate && txnDate <= currentCycle.endDate;
  });

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

  const targetSlices = budgetSlices.length > 0
    ? budgetSlices.map(s => s.slice_name)
    : (profile?.enabled_slices || ['Basic Needs', 'Feeding', 'Flex Money', 'Savings']) as Slice[];

  // Filtered expenses based on selected categories/slices
  const filteredExpenses = monthlyExpenses.filter(e => {
    if (!e) return false;
    if (activeSliceFilter === 'all') return true;
    const cat = categories.find(c => c.id === e.category_id);
    return cat?.slice === activeSliceFilter;
  });

  const filteredCategories = categories.filter(c => {
    if (!c) return false;
    if (activeSliceFilter === 'all') return true;
    return c.slice === activeSliceFilter;
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
      className="w-full py-2 px-1 text-black dark:text-white"
    >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="w-full flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-120px)] relative">
        
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
                {targetSlices.map(slice => (
                  <option key={slice} value={slice}>{slice.toUpperCase()}</option>
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

        {/* B. The Fluid Scroll Trench (Scrollable Content Container) */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 bg-transparent">
          
          {/* Trends Summary Panel */}
          {showTrends && (
            <div className="border-2 border-black dark:border-white p-4 bg-white dark:bg-zinc-800 space-y-4 rounded-none">
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
              
              <div className="border-t-2 border-black dark:border-white pt-4 space-y-3">
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
                      <div className="h-2 w-full bg-[#F4F4F0] dark:bg-zinc-900 border border-black dark:border-white rounded-none overflow-hidden">
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
                  {filteredCategories.map(cat => (
                    <CategoryCard
                       key={cat.id}
                       category={cat}
                       spent={categorySpends[cat.id] || 0}
                       onEdit={handleEdit}
                    />
                  ))}
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