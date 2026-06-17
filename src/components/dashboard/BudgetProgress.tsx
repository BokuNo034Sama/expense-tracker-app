import { useAppStore, getCycleBoundaries } from '../../store';

export function BudgetProgress() {
  const categories = useAppStore(s => s.categories);
  const expenses = useAppStore(s => s.expenses);
  const isDataMasked = useAppStore(s => s.isDataMasked);

  const formatNaira = (amount: number) => {
    if (isDataMasked) return '••••••';
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const profile = useAppStore(s => s.profile);
  const currentCycle = getCycleBoundaries(profile);
  const monthlyExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= currentCycle.startDate && d <= currentCycle.endDate;
  });

  // Compute spend per category
  const categorySpends: { [id: string]: number } = {};
  monthlyExpenses.forEach(e => {
    if (e.category_id) {
      categorySpends[e.category_id] = (categorySpends[e.category_id] || 0) + Number(e.amount);
    }
  });

  // Only categories that have a budget limit configured (> 0)
  const budgetedCategories = categories.filter(c => Number(c.budget_limit) > 0);

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
          className="text-xs text-[var(--color-ink-muted)] dark:text-zinc-400 py-8 text-center uppercase border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-800"
        >
          No active budget limits set. Configure them in Budgets settings.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 w-full md:max-h-[360px] md:overflow-y-auto md:pr-1">
          {budgetedCategories.map(cat => {
            const spent = categorySpends[cat.id] || 0;
            const limit = Number(cat.budget_limit);
            const percentage = Math.min((spent / limit) * 100, 100);
            const isOver = spent > limit;

            return (
              <div 
                key={cat.id} 
                className="border-2 border-black dark:border-white bg-white dark:bg-zinc-800 p-2.5 flex flex-col justify-between rounded-none gap-2 relative"
              >
                {/* Title on top */}
                <div style={{ fontFamily: 'var(--font-display)' }} className="font-extrabold text-[10px] uppercase text-black dark:text-white truncate">
                  {cat.name}
                </div>
                
                {/* Progress bar container */}
                <div className="h-2 w-full bg-[var(--color-surface)] dark:bg-zinc-900 border border-black dark:border-white rounded-none overflow-hidden shrink-0">
                  <div 
                    className={`h-full transition-all duration-300 ${isOver ? 'bg-[var(--color-danger)]' : 'bg-[#C6EF4E]'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Fractional Progress numbers below */}
                <div style={{ fontFamily: 'var(--font-mono)' }} className="flex justify-between items-center text-[9px] font-bold text-gray-500 dark:text-zinc-400 mt-auto shrink-0">
                  <span className={isOver ? 'text-[var(--color-danger)] font-black' : ''}>
                    {formatNaira(spent)}
                  </span>
                  <span>
                    /{formatNaira(limit)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
