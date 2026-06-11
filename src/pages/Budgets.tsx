import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { SliceSection } from "@/components/budgets/SliceSection";
import { CategoryForm } from "@/components/budgets/CategoryForm";
import { BentoCard } from "@/components/shared/BentoCard";
import type { Category, Slice } from "@/store/types";

export default function Budgets() {
  const categories = useAppStore(s => s.categories);
  const expenses = useAppStore(s => s.expenses);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filter current month expenses (date prefix: "YYYY-MM")
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonthPrefix));

  // Compute spend per category
  const categorySpends: { [id: string]: number } = {};
  monthlyExpenses.forEach(e => {
    if (e.category_id) {
      categorySpends[e.category_id] = (categorySpends[e.category_id] || 0) + Number(e.amount);
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

  const slices: Slice[] = ['Basic', 'Family', 'Wealth', 'Subscription'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col items-start gap-1">
        <h1 
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-ink)] uppercase"
        >
          BUDGET_BUCKETS
        </h1>
        <p 
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-xs text-[var(--color-ink-muted)] uppercase"
        >
          Allocate monthly caps and monitor category spending
        </p>
      </div>

      {/* Slices group / Onboarding Empty State */}
      {categories.length === 0 ? (
        <BentoCard hoverEffect={false} className="space-y-6 max-w-2xl mx-auto text-center py-12 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] flex flex-col items-center">
          <div className="space-y-3">
            <h3 
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-xl font-extrabold uppercase text-[var(--color-ink)]"
            >
              YOUR_BUCKETS_ARE_DRY
            </h3>
            <p 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-xs text-[var(--color-ink-muted)] leading-relaxed uppercase max-w-lg mx-auto"
            >
              Your budget buckets are completely empty. Budgeting isn't about moving like a miser; it's about giving your money a strict assignment before your village people assign it for you. Tap below to create your first spending baseline.
            </p>
          </div>
          <button
            onClick={handleCreate}
            style={{ fontFamily: 'var(--font-display)' }}
            className="px-5 py-3 bg-[var(--color-primary)] text-[var(--color-ink)] border-[var(--border-default)] rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-btn-active)] font-bold text-xs uppercase transition-all duration-100 flex items-center gap-2"
          >
            [ + DEFINE_A_BUCKET ]
          </button>
        </BentoCard>
      ) : (
        <div className="space-y-8">
          {slices.map(slice => (
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

      <CategoryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        category={editingCategory}
      />
    </motion.div>
  );
}
