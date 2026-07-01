// src/components/dashboard/RecentExpenseCard.tsx
import type { Expense, Category } from '../../store/types';

interface RecentExpenseCardProps {
  expense:  Expense;
  category: Category | undefined;
}

export function RecentExpenseCard({ expense, category }: RecentExpenseCardProps) {
  const catName = category?.name || 'Uncategorized';

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--color-ink)]/10 last:border-0">
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-[var(--color-primary)] border-2 border-[var(--color-ink)] rounded">
        <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[9px] font-bold text-[var(--color-ink)]">
          {catName.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-semibold text-[var(--color-ink)] truncate">
          {expense.vendor}
        </p>
        <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-[var(--color-ink-muted)] uppercase">
          {catName}
        </p>
      </div>
      <span
        style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
        className="text-sm font-bold text-[var(--color-ink)] flex-shrink-0"
      >
        ₦{Number(expense.amount).toLocaleString('en-NG')}
      </span>
    </div>
  );
}
