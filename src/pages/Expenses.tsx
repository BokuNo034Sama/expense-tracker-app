import { useState } from "react";
import { motion } from "framer-motion";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { BentoCard } from "@/components/shared/BentoCard";
import { useAppStore } from "@/store/useAppStore";
import type { Expense } from "@/store/types";

export default function Expenses() {
  const expenses = useAppStore(s => s.expenses);
  const filterMonth = useAppStore(s => s.filterMonth);
  const setFilterMonth = useAppStore(s => s.setFilterMonth);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-start sm:items-center gap-4 flex-wrap shrink-0">
        <div className="flex flex-col items-start gap-1">
          <h1 
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-ink)] uppercase"
          >
            TRANSACTIONS
          </h1>
          <p 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs text-[var(--color-ink-muted)] uppercase"
          >
            Manage and audit your logged expenditures
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

      {expenses.length === 0 ? (
        <BentoCard hoverEffect={false} className="space-y-6 max-w-2xl mx-auto text-center py-12 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] flex flex-col items-center">
          <div className="space-y-3">
            <h3 
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-xl font-extrabold uppercase text-[var(--color-ink)]"
            >
              NO_RECEIPTS_YET?_GOD_WHEN?
            </h3>
            <p 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-xs text-[var(--color-ink-muted)] leading-relaxed uppercase max-w-lg mx-auto"
            >
              Every legendary wealth run starts with a single log. Whether it's a ₦1,500 data top-up, quick transport, or heavy infrastructure, track it right now to activate your automated advice metrics.
            </p>
          </div>
          <button
            onClick={handleCreate}
            style={{ fontFamily: 'var(--font-display)' }}
            className="px-5 py-3 bg-[var(--color-primary)] text-[var(--color-ink)] border-[var(--border-default)] rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-btn-active)] font-bold text-xs uppercase transition-all duration-100 flex items-center gap-2"
          >
            [ + DROP_A_RECEIPT ]
          </button>
        </BentoCard>
      ) : (
        <div className="space-y-6">
          <ExpenseTable onEdit={handleEdit} />
          <button
            onClick={handleCreate}
            className="bg-[var(--color-primary)] border-2 border-black font-mono font-bold p-3 shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-btn-active)] transition-all duration-100 w-full block text-center mt-6 text-black uppercase text-xs rounded-[var(--border-radius)] cursor-pointer"
          >
            [ + REPORT_NEW_EXPENDITURE ]
          </button>
        </div>
      )}

      <ExpenseForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        expense={selectedExpense}
      />
    </motion.div>
  );
}
