import { useAppStore } from '../../store';
import { RecentExpenseCard } from './RecentExpenseCard';

export function RecentExpenses() {
  const expenses = useAppStore(s => s.expenses);
  const categories = useAppStore(s => s.categories);

  // Limit to 6 most recent for the dashboard tile
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="w-full space-y-4">
      <h3 
        style={{ fontFamily: 'var(--font-display)' }}
        className="text-lg font-extrabold uppercase tracking-wide text-[var(--color-ink)] dark:text-white"
      >
        RECENT_LOGS
      </h3>

      {recentExpenses.length === 0 ? (
        <div 
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-xs text-[var(--color-ink-muted)] py-8 text-center uppercase border-2 border-[var(--color-ink)] rounded-none bg-[var(--color-surface)]"
        >
          No expenses recorded yet.
        </div>
      ) : (
        <div className="border-2 border-[var(--color-ink)] bg-[var(--color-surface)] p-4 rounded-none space-y-1">
          {recentExpenses.map(exp => (
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

