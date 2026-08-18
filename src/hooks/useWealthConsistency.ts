import { useMemo } from 'react';
import { useAppStore } from '../store';

export function useWealthConsistency() {
  const expenses   = useAppStore(s => s.expenses);
  const categories = useAppStore(s => s.categories);
  const snapshots  = useAppStore(s => s.monthlySnapshots ?? []);

  return useMemo(() => {
    const wealthCatIds = categories
      .filter(c => c.slice === 'Wealth')
      .map(c => c.id);

    // Check last 3 months of monthly_snapshots for Wealth activity
    const recentSnapshots = [...snapshots]
      .sort((a, b) => b.month_year.localeCompare(a.month_year))
      .slice(0, 3);

    const consistentMonths = recentSnapshots.filter(snap => {
      // Check if the month had any Wealth slice expenses
      const monthExpenses = expenses.filter(e => {
        if (!wealthCatIds.includes(e.category_id ?? '')) return false;
        return e.date.startsWith(snap.month_year);
      });
      return monthExpenses.length > 0;
    }).length;

    return {
      consistentMonths,
      isConsistent: consistentMonths >= 3,
    };
  }, [expenses, categories, snapshots]);
}
