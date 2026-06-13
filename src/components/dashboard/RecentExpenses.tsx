import { useAppStore } from '../../store';
import { parseLocalDate } from '../../lib/format';
import { BentoCard } from '../shared/BentoCard';
import * as Icons from 'lucide-react';

export function RecentExpenses() {
  const expenses = useAppStore(s => s.expenses);
  const categories = useAppStore(s => s.categories);
  const isDataMasked = useAppStore(s => s.isDataMasked);

  const formatNaira = (amount: number) => {
    if (isDataMasked) return '••••••';
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Get last 5 expenses
  const recent = expenses.slice(0, 5);

  const renderIcon = (iconName: string) => {
    const LucideIcon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName] || Icons.HelpCircle;
    return <LucideIcon className="h-4 w-4" />;
  };

  return (
    <BentoCard className="h-auto flex flex-col justify-between">
      <div>
        <h3 
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-lg font-extrabold uppercase tracking-wide mb-4 text-[var(--color-ink)]"
        >
          RECENT_LOGS
        </h3>

        {recent.length === 0 ? (
          <div 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs text-[var(--color-ink-muted)] py-8 text-center uppercase"
          >
            No expenses recorded yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recent.map(exp => {
              const category = categories.find(c => c.id === exp.category_id);
              const categoryName = category?.name || 'Uncategorized';
              const iconName = category?.icon || 'MoreHorizontal';

              return (
                <div 
                  key={exp.id}
                  className="flex items-center justify-between p-2.5 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-[var(--color-primary)] border-[var(--border-default)] rounded-full text-[var(--color-ink)] shrink-0">
                      {renderIcon(iconName)}
                    </div>
                    <div className="min-w-0">
                      <div 
                        style={{ fontFamily: 'var(--font-display)' }}
                        className="text-xs font-bold text-[var(--color-ink)] truncate uppercase"
                      >
                        {exp.vendor}
                      </div>
                      <div 
                        style={{ fontFamily: 'var(--font-mono)' }}
                        className="text-[9px] text-[var(--color-ink-muted)] uppercase"
                      >
                        {categoryName} • {parseLocalDate(exp.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div 
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className="text-sm font-extrabold text-[var(--color-ink)] shrink-0"
                  >
                    {formatNaira(Number(exp.amount))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
