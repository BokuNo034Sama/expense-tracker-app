import { useAppStore } from '../../store';
import { parseLocalDate } from '../../lib/format';
import * as Icons from 'lucide-react';

export function RecentExpenses() {
  const expenses = useAppStore(s => s.expenses);
  const categories = useAppStore(s => s.categories);
  const isDataMasked = useAppStore(s => s.isDataMasked);

  const formatNaira = (amount: number) => {
    if (isDataMasked) return '••••••';
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Get last 11 expenses
  const recent = expenses.slice(0, 11);

  const renderIcon = (iconName: string) => {
    const LucideIcon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName] || Icons.HelpCircle;
    return <LucideIcon className="h-4 w-4" />;
  };

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
          className="text-xs text-[var(--color-ink-muted)] dark:text-zinc-400 py-8 text-center uppercase border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-800"
        >
          No expenses recorded yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
          {recent.map(exp => {
            const category = categories.find(c => c.id === exp.category_id) ?? {
              name: 'Uncategorized',
              icon: 'HelpCircle',
              slice: 'Family',
            };
            const categoryName = category.name;
            const iconName = category.icon;

            return (
              <div 
                key={exp.id}
                className="border-2 border-black dark:border-white bg-white dark:bg-zinc-800 p-2.5 flex flex-col justify-between rounded-none gap-2.5"
              >
                {/* Top Section: Status Icon and Merchant Title stacked */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 bg-[var(--color-primary)] border border-black text-[var(--color-ink)] shrink-0 rounded-none">
                    {renderIcon(iconName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div 
                      style={{ fontFamily: 'var(--font-display)' }}
                      className="text-[10px] font-extrabold text-[var(--color-ink)] dark:text-white truncate uppercase"
                      title={exp.vendor}
                    >
                      {exp.vendor}
                    </div>
                    <div 
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="text-[8px] text-[var(--color-ink-muted)] dark:text-zinc-400 truncate uppercase"
                    >
                      {categoryName}
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Date and Amount aligned */}
                <div className="flex justify-between items-center mt-auto border-t border-dashed border-black/10 dark:border-white/10 pt-1.5 shrink-0">
                  <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[8px] text-gray-400">
                    {parseLocalDate(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()}
                  </span>
                  <span 
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className="text-xs font-black text-[var(--color-ink)] dark:text-white"
                  >
                    {formatNaira(Number(exp.amount))}
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
