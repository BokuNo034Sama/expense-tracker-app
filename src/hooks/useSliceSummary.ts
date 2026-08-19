// src/hooks/useSliceSummary.ts
import { useMemo } from 'react';
import { useBudgetSummary } from './useBudgetSummary';

export interface SliceMetric {
  totalLimit: number;
  totalSpent: number;
  progressPct: number;
}

export function useSliceSummary() {
  const { sliceMetrics } = useBudgetSummary();

  return useMemo(() => {
    const summary: Record<string, SliceMetric> = {};

    sliceMetrics.forEach(sm => {
      summary[sm.slice] = {
        totalLimit:  sm.totalLimit,
        totalSpent:  sm.totalSpent,
        progressPct: sm.progressPct,
      };
    });

    return summary;
  }, [sliceMetrics]);
}
