// src/hooks/useBudgetSummary.ts
// Single source of truth for all budget display across the app.
// ALL components showing budget data must use this hook.
// NEVER read budget_slices.allocated_percentage for Naira calculations.

import { useMemo } from 'react';
import { useAppStore } from '../store';

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
  isAtRisk:    boolean;
  categories:  CategoryBudgetMetric[];
}

export function useBudgetSummary() {
  const categories = useAppStore(s => s.categories || []);
  const expenses   = useAppStore(s => s.expenses || []);

  return useMemo(() => {
    const now = new Date();

    // This month's expenses only
    const thisMonthExpenses = expenses.filter(e => {
      if (!e?.date) return false;
      const d = new Date(e.date);
      return (
        d.getMonth()    === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
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

    // Group into slices
    const sliceMap: Record<string, SliceBudgetMetric> = {};
    categoryMetrics.forEach(cat => {
      if (!sliceMap[cat.slice]) {
        sliceMap[cat.slice] = {
          slice:        cat.slice,
          totalLimit:   0,
          totalSpent:   0,
          remaining:    0,
          progressPct:  0,
          isOverBudget: false,
          isAtRisk:     false,
          categories:   [],
        };
      }
      sliceMap[cat.slice].totalLimit  += cat.limit;
      sliceMap[cat.slice].totalSpent  += cat.spent;
      sliceMap[cat.slice].categories.push(cat);
    });

    // Compute slice-level metrics
    const sliceMetrics = Object.values(sliceMap).map(slice => {
      const remaining   = Math.max(slice.totalLimit - slice.totalSpent, 0);
      const progressPct = slice.totalLimit > 0
        ? Math.min((slice.totalSpent / slice.totalLimit) * 100, 100)
        : 0;
      return {
        ...slice,
        remaining,
        progressPct,
        isOverBudget: slice.totalSpent > slice.totalLimit && slice.totalLimit > 0,
        isAtRisk:     progressPct >= 80,
      };
    });

    const totalLimit = sliceMetrics.reduce((s, sl) => s + sl.totalLimit, 0);
    const totalSpent = sliceMetrics.reduce((s, sl) => s + sl.totalSpent, 0);

    return {
      categoryMetrics,
      sliceMetrics,
      totalLimit,
      totalSpent,
      totalRemaining: Math.max(totalLimit - totalSpent, 0),
    };
  }, [categories, expenses]);
}
