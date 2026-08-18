import { useState } from "react";
import { motion } from "framer-motion";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useAppStore, getCycleBoundaries } from "@/store/useAppStore";
import type { Expense, Category } from "@/store/types";

const customStyles = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

export default function Expenses() {
  const expenses = useAppStore(s => s.expenses);
  const profile = useAppStore(s => s.profile);
  const categories = useAppStore(s => Array.isArray(s.categories) ? s.categories : []) as Category[];
  const filterMonth = useAppStore(s => s.filterMonth);
  const setFilterMonth = useAppStore(s => s.setFilterMonth);
  
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedExpense(null);
    setIsFormOpen(true);
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

  const targetExpenses = Array.isArray(expenses) ? expenses : [];
  
  const cycle = filterMonth !== 'all' ? getCycleBoundaries(profile, new Date(filterMonth + "-15")) : null;

  // Filter expenses by month first
  const monthlyExpenses = targetExpenses.filter(e => {
    if (!e) return false;
    if (filterMonth === 'all') return true;
    if (!e.date || typeof e.date !== "string") return false;
    const txnDate = new Date(e.date);
    return cycle ? (txnDate >= cycle.startDate && txnDate <= cycle.endDate) : false;
  });

  // Filter expenses by category next
  const filteredExpenses = monthlyExpenses.filter(e => {
    if (!e) return false;
    if (filterCategory === 'all') return true;
    return e.category_id === filterCategory;
  });

  const recordCount = filteredExpenses.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[var(--color-bg)] pb-24 md:pb-8 px-1 text-black dark:text-white"
    >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="w-full flex flex-col relative">
        
        {/* 1. FIXED COCKPIT (Top 30%) */}
        <div className="bg-[var(--color-bg)] dark:bg-zinc-900 pb-3 space-y-3 select-none shrink-0 border-b-2 border-black dark:border-white">
          
          {/* Row 1: The Filter Strip */}
          <div className="flex items-center gap-2 py-0.5 text-xs font-mono font-bold">
            {/* Month Picker Select */}
            <div className="relative shrink-0">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="appearance-none pr-7 pl-3 py-1 bg-white text-black border-2 border-black rounded-none text-[10px] font-mono font-bold focus:outline-none cursor-pointer uppercase"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
                <option value="all">ALL TIME</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-black text-[9px]">
                ▼
              </div>
            </div>

            <span>|</span>

            {/* Category Picker Select */}
            <div className="relative shrink-0">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="appearance-none pr-7 pl-3 py-1 bg-white text-black border-2 border-black rounded-none text-[10px] font-mono font-bold focus:outline-none cursor-pointer uppercase"
              >
                <option value="all">ALL CATEGORIES ▼</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-black text-[9px]">
                ▼
              </div>
            </div>

            <span>|</span>

            {/* Record Counter Badge */}
            <div className="px-2.5 py-1 bg-black text-[#C6EF4E] font-mono font-bold text-[9px] uppercase border-2 border-black dark:border-white rounded-none shrink-0 cursor-default">
              {recordCount} {recordCount === 1 ? 'RECORD' : 'RECORDS'}
            </div>
          </div>

          {/* Row 2: Primary Action Block */}
          <button 
            onClick={handleCreate}
            className="w-full bg-[#C6EF4E] text-black text-[10px] font-mono font-black py-2.5 px-3 border-2 border-black shadow-[3px_3px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all uppercase text-center rounded-none cursor-pointer"
          >
            + ADD NEW EXPENDITURE
          </button>
        </div>

        {/* Horizon Divider Row */}
        <div className="bg-black text-[#C6EF4E] text-[9px] font-mono font-bold px-3 py-2 flex justify-between uppercase border-2 border-black dark:border-white rounded-none shrink-0">
          <span className="w-1/4 text-left">DATE</span>
          <span className="w-1/4 text-left">VENDOR</span>
          <span className="w-1/4 text-left">CATEGORY</span>
          <span className="w-1/4 text-right">AMOUNT</span>
        </div>

        {/* 2. Content Container */}
        <div className="py-3 space-y-4 bg-transparent">
          {/* Transaction Item Rows list */}
          <div className="border-2 border-black dark:border-white bg-white dark:bg-zinc-800 p-2 rounded-none space-y-1">
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
                    onClick={() => handleEdit(exp)}
                    className="flex justify-between items-center text-[10px] font-mono py-2.5 px-1 border-b border-black/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span className="w-1/4 text-left font-bold text-gray-400">
                      {exp.date ? exp.date.substring(5) : 'N/A'}
                    </span>
                    <span className="w-1/4 text-left font-black uppercase truncate text-black dark:text-white" title={exp.vendor}>
                      {exp.vendor || 'UNKNOWN'}
                    </span>
                    <span className="w-1/4 text-left truncate">
                      <span className="bg-[#C6EF4E]/20 text-black dark:text-white px-1.5 py-0.5 border border-black/20 rounded-none font-bold text-[8px] uppercase">
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

      {/* Expense Form Modal */}
      <ExpenseForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        expense={selectedExpense}
      />
    </motion.div>
  );
}
