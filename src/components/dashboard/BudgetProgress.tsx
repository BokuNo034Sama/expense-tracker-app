import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';

export function BudgetProgress() {
  const categories = useAppStore(s => s.categories);
  const expenses = useAppStore(s => s.expenses);

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Filter current month expenses
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonthPrefix));

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
    <BentoCard className="h-full flex flex-col justify-between">
      <div>
        <h3 
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-lg font-extrabold uppercase tracking-wide mb-4 text-[var(--color-ink)]"
        >
          BUDGET_LIMITS
        </h3>

        {budgetedCategories.length === 0 ? (
          <div 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs text-[var(--color-ink-muted)] py-8 text-center uppercase"
          >
            No active budget limits set. Configure them in Budgets settings.
          </div>
        ) : (
          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
            {budgetedCategories.map(cat => {
              const spent = categorySpends[cat.id] || 0;
              const limit = Number(cat.budget_limit);
              const percentage = Math.min((spent / limit) * 100, 100);
              const isOver = spent > limit;

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex justify-between items-start gap-2 text-xs flex-wrap">
                    <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-[var(--color-ink)] uppercase break-all">
                      {cat.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)' }} className={`font-semibold shrink-0 ${isOver ? 'text-[var(--color-danger)] font-bold' : 'text-[var(--color-ink-muted)]'}`}>
                      {formatNaira(spent)} / {formatNaira(limit)}
                    </span>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div className="h-4 w-full bg-[var(--color-surface)] border-[var(--border-default)] rounded-full overflow-hidden">
                    <div 
                      className={`h-full border-r-[var(--border-default)] transition-all duration-300 ${isOver ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-primary)]'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {isOver && (
                    <div 
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="text-[9px] text-[var(--color-danger)] uppercase font-bold text-right"
                    >
                      OVER_BUDGET_ALERT!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
