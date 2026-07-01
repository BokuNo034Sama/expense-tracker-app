// src/hooks/useSliceSummary.ts
import { useMemo } from 'react';
import { useAppStore } from '../store';

export interface SliceMetric {
  totalLimit: number;
  totalSpent: number;
  progressPct: number;
}

export function useSliceSummary() {
  const categories = useAppStore(s => s.categories);
  const expenses   = useAppStore(s => s.expenses);

  return useMemo(() => {
    const summary = categories.reduce((acc, cat) => {
      const slice = cat.slice;
      if (!acc[slice]) acc[slice] = { totalLimit: 0, totalSpent: 0, progressPct: 0 };
      acc[slice].totalLimit += (Number(cat.budget_limit) || 0);
      return acc;
    }, {} as Record<string, SliceMetric>);

    expenses.forEach(exp => {
      if (!exp?.category_id) return;
      const cat = categories.find(c => c.id === exp.category_id);
      if (cat?.slice && summary[cat.slice]) {
        summary[cat.slice].totalSpent += (Number(exp.amount) || 0);
      }
    });

    // Compute progress percentages
    Object.keys(summary).forEach(slice => {
      const { totalLimit, totalSpent } = summary[slice];
      summary[slice].progressPct = totalLimit > 0
        ? Math.min((totalSpent / totalLimit) * 100, 100)
        : 0;
    });

    return summary;
  }, [categories, expenses]);
}
