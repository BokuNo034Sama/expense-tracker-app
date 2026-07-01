// src/hooks/useDashboardMetrics.ts
import { useMemo } from 'react';
import { useAppStore, getCycleBoundaries } from '../store';

export function useDashboardMetrics() {
  const expenses   = useAppStore(s => s.expenses);
  const incomes    = useAppStore(s => s.incomes);
  const categories = useAppStore(s => s.categories);
  const profile    = useAppStore(s => s.profile);

  return useMemo(() => {
    const currentCycle = getCycleBoundaries(profile);
    const thisCycleExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= currentCycle.startDate && d <= currentCycle.endDate;
    });

    const totalSpent = thisCycleExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalIncome = incomes
      .filter(i => {
        const d = new Date(i.date);
        return d >= currentCycle.startDate && d <= currentCycle.endDate;
      })
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const transactionCount = thisCycleExpenses.length;
    const remainingBalance = totalIncome - totalSpent;

    // Top category by spend
    const spendByCategory: Record<string, number> = {};
    thisCycleExpenses.forEach(e => {
      if (e.category_id) {
        spendByCategory[e.category_id] = (spendByCategory[e.category_id] || 0) + Number(e.amount);
      }
    });

    let topCategoryId = '';
    let topCategoryAmount = 0;
    Object.entries(spendByCategory).forEach(([id, amt]) => {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt;
        topCategoryId = id;
      }
    });

    const topCategory = categories.find(c => c.id === topCategoryId)?.name || 'None';

    return { totalSpent, totalIncome, transactionCount, remainingBalance, topCategory, topCategoryAmount };
  }, [expenses, incomes, categories, profile]);
}
