import { useState } from "react";
import { motion } from "framer-motion";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { Plus } from "lucide-react";
import type { Expense } from "@/store/types";

export default function Expenses() {
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

      <ExpenseTable onEdit={handleEdit} />

      <ExpenseForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        expense={selectedExpense}
      />
    </motion.div>
  );
}
