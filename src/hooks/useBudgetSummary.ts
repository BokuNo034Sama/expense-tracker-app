// src/hooks/useBudgetSummary.ts
// Single source of truth for all budget display across the app.
// ALL components showing budget data must use this hook.
// NEVER read budget_slices.allocated_percentage for Naira calculations.

import { useMemo } from 'react';
import { useAppStore, getCycleBoundaries } from '../store';

export interface CategoryBudgetMetric {
  id:          string;
  name:        string;
  slice:       string;
  icon:        string;
  limit:       number;   // categories.budget_limit — absolute Naira
  spent:       number;   // sum of expenses this month
  remaining:   number;   // limit - spent (floored at 0)
  progressPct: number;   // (spent / limit) * 100, capped at 100
  isOverBudget:boolean;
  isAtRisk:    boolean;  // >80% spent
}

export interface SliceBudgetMetric {
  slice:       string;
  totalLimit:  number;
  totalSpent:  number;
  remaining:   number;
  progressPct: number;
  isOverBudget:boolean;
  isAtRisk:    boolean;  // >80% spent
  categories:  CategoryBudgetMetric[];
}

export function useBudgetSummary() {
  const categories = useAppStore(s => s.categories || []);
  const expenses   = useAppStore(s => s.expenses || []);
  const profile    = useAppStore(s => s.profile);

  return useMemo(() => {
    const currentCycle = getCycleBoundaries(profile);

    // This cycle's expenses only
    const thisMonthExpenses = expenses.filter(e => {
      if (!e?.date) return false;
      const d = new Date(e.date);
      return d >= currentCycle.startDate && d <= currentCycle.endDate;
    });

    // Spent per category ID
    const spentByCategoryId: Record<string, number> = {};
    thisMonthExpenses.forEach(exp => {
      if (!exp?.category_id) return;
      spentByCategoryId[exp.category_id] =
        (spentByCategoryId[exp.category_id] || 0) + (Number(exp.amount) || 0);
    });

    // Build per-category metrics
    const categoryMetrics: CategoryBudgetMetric[] = categories.map(cat => {
      const limit   = Number(cat.budget_limit) || 0;
      const spent   = spentByCategoryId[cat.id] || 0;
      const remaining  = Math.max(limit - spent, 0);
      const progressPct = limit > 0
        ? Math.min((spent / limit) * 100, 100)
        : 0;

      return {
        id:           cat.id,
        name:         cat.name,
        slice:        cat.slice,
        icon:         cat.icon,
        limit,
        spent,
        remaining,
        progressPct,
        isOverBudget: spent > limit && limit > 0,
        isAtRisk:     progressPct >= 80 && !( spent > limit && limit > 0),
      };
    });

    // Build per-slice metrics
    const sliceMap: Record<string, { totalLimit: number; totalSpent: number; categories: CategoryBudgetMetric[] }> = {};

    categories.forEach(cat => {
      if (!sliceMap[cat.slice]) {
        sliceMap[cat.slice] = { totalLimit: 0, totalSpent: 0, categories: [] };
      }
      const metric = categoryMetrics.find(m => m.id === cat.id);
      if (metric) {
        sliceMap[cat.slice].totalLimit += metric.limit;
        sliceMap[cat.slice].totalSpent += metric.spent;
        sliceMap[cat.slice].categories.push(metric);
      }
    });

    const sliceMetrics: SliceBudgetMetric[] = Object.entries(sliceMap).map(([slice, data]) => {
      const remaining   = Math.max(data.totalLimit - data.totalSpent, 0);
      const progressPct = data.totalLimit > 0
        ? Math.min((data.totalSpent / data.totalLimit) * 100, 100)
        : 0;

      return {
        slice,
        totalLimit:   data.totalLimit,
        totalSpent:   data.totalSpent,
        remaining,
        progressPct,
        isOverBudget: data.totalSpent > data.totalLimit && data.totalLimit > 0,
        isAtRisk:     progressPct >= 80 && !(data.totalSpent > data.totalLimit && data.totalLimit > 0),
        categories:   data.categories,
      };
    });

    const totalLimit = categoryMetrics.reduce((sum, c) => sum + c.limit, 0);
    const totalSpent = categoryMetrics.reduce((sum, c) => sum + c.spent, 0);

    return {
      categoryMetrics,
      sliceMetrics,
      totalLimit,
      totalSpent,
      totalRemaining: Math.max(totalLimit - totalSpent, 0),
    };
  }, [categories, expenses, profile]);
}
