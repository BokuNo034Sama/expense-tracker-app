import { useBudgetSummary } from '../../hooks/useBudgetSummary';
import { BudgetProgressBar } from './BudgetProgressBar';

export function BudgetProgress() {
  const { categoryMetrics } = useBudgetSummary();

  // Only categories that have a budget limit configured (> 0)
  const budgetedCategories = categoryMetrics.filter(c => c.limit > 0);

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
            return (
              <div 
                key={cat.id} 
                className="border-2 border-[var(--color-ink)] bg-[var(--color-surface)] p-2.5 flex flex-col justify-between rounded-none gap-2 relative"
              >
                <BudgetProgressBar
                  label={cat.name}
                  spent={cat.spent}
                  limit={cat.limit}
                  progressPct={cat.progressPct}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
