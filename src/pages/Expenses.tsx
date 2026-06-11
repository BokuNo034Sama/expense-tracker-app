import { useState } from "react";
import { motion } from "framer-motion";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { BentoCard } from "@/components/shared/BentoCard";
import { useAppStore } from "@/store/useAppStore";
import { Plus } from "lucide-react";
import type { Expense } from "@/store/types";

export default function Expenses() {
  const expenses = useAppStore(s => s.expenses);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-3xl font-extrabold tracking-tight text-[var(--color-ink)] uppercase"
          >
            TRANSACTIONS
          </h1>
          <p 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs text-[var(--color-ink-muted)] uppercase mt-1"
          >
            Manage and audit your logged expenditures
          </p>
        </div>

        <button
          onClick={handleCreate}
          style={{ fontFamily: 'var(--font-display)' }}
          className="px-4 py-2.5 bg-[var(--color-primary)] text-[var(--color-ink)] border-[var(--border-default)] rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-btn-active)] font-bold text-xs uppercase transition-all duration-100 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          LOG_TRANSACTION
        </button>
      </div>

      {expenses.length === 0 ? (
        <BentoCard hoverEffect={false} className="space-y-4 max-w-2xl mx-auto text-center py-12 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff]">
          <h3 
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-xl font-extrabold uppercase text-[var(--color-ink)]"
          >
            FIRST_LOG_IS_THE_HARDEST
          </h3>
          <p 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs text-[var(--color-ink-muted)] leading-relaxed uppercase max-w-lg mx-auto"
          >
            Every big wealth journey starts with a single coffee or grocery log. Track your very first transaction right now to activate your automated Kiny advice metrics.
          </p>
        </BentoCard>
      ) : (
        <ExpenseTable onEdit={handleEdit} />
      )}

      <ExpenseForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        expense={selectedExpense}
      />
    </motion.div>
  );
}
