import { useAppStore } from '../../store';
import { RecentExpenseCard } from './RecentExpenseCard';

export function RecentExpenses() {
  const expenses = useAppStore(s => s.expenses);
  const categories = useAppStore(s => s.categories);

  // Get all expenses to let container scroll
  const recent = expenses;

  return (
    <div className="w-full space-y-4">
      <h3 
        style={{ fontFamily: 'var(--font-display)' }}
        className="text-lg font-extrabold uppercase tracking-wide text-[var(--color-ink)] dark:text-white"
      >
        RECENT_LOGS
      </h3>

      {recent.length === 0 ? (
        <div 
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-xs text-[var(--color-ink-muted)] py-8 text-center uppercase border-2 border-[var(--color-ink)] rounded-none bg-[var(--color-surface)]"
        >
          No expenses recorded yet.
        </div>
      ) : (
        <div 
          className="border-2 border-[var(--color-ink)] bg-[var(--color-surface)] p-4 rounded-none overflow-y-auto space-y-1"
          style={{ maxHeight: 'calc(100vh - 280px)' }}
        >
          {recent.map(exp => (
            <RecentExpenseCard
              key={exp.id}
              expense={exp}
              category={categories.find(c => c.id === exp.category_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
