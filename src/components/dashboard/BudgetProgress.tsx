import { useAppStore, getCycleBoundaries } from '../../store';
import { BudgetProgressBar } from './BudgetProgressBar';

export function BudgetProgress() {
  const categories = useAppStore(s => Array.isArray(s.categories) ? s.categories : []);
  const expenses = useAppStore(s => Array.isArray(s.expenses) ? s.expenses : []);

  const profile = useAppStore(s => s.profile);
  const currentCycle = getCycleBoundaries(profile);
  const monthlyExpenses = expenses.filter(e => {
    if (!e || !e.date || typeof e.date !== 'string') return false;
    const d = new Date(e.date);
    return d >= currentCycle.startDate && d <= currentCycle.endDate;
  });

  // Compute spend per category
  const categorySpends: { [id: string]: number } = {};
  monthlyExpenses.forEach(e => {
    if (e && e.category_id) {
      categorySpends[e.category_id] = (categorySpends[e.category_id] || 0) + Number(e.amount || 0);
    }
  });

  // Only categories that have a budget limit configured (> 0)
  const budgetedCategories = categories.filter(c => c && Number(c.budget_limit || 0) > 0);

  return (
    <div className="w-full space-y-4">
      <h3 
        style={{ fontFamily: 'var(--font-display)' }}
        className="text-lg font-extrabold uppercase tracking-wide text-[var(--color-ink)] dark:text-white"
      >
        BUDGET_LIMITS
      </h3>

      {budgetedCategories.length === 0 ? (
        <div 
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-xs text-[var(--color-ink-muted)] py-8 text-center uppercase border-2 border-[var(--color-ink)] rounded-none bg-[var(--color-surface)]"
        >
          No active budget limits set. Configure them in Budgets settings.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 w-full md:max-h-[360px] md:overflow-y-auto md:pr-1">
          {budgetedCategories.map(cat => {
            const spent = categorySpends[cat.id] || 0;
            const limit = Number(cat.budget_limit);
            const percentage = Math.min((spent / limit) * 100, 100);

            return (
              <div 
                key={cat.id} 
                className="border-2 border-[var(--color-ink)] bg-[var(--color-surface)] p-2.5 flex flex-col justify-between rounded-none gap-2 relative"
              >
                <BudgetProgressBar
                  label={cat.name}
                  spent={spent}
                  limit={limit}
                  progressPct={percentage}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
