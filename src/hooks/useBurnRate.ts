import { useMemo } from 'react';
import { useAppStore, getCycleBoundaries } from '../store';
import { useSliceSummary } from './useSliceSummary';

export interface BurnRateResult {
  slice:           string;
  dailyBurnRate:   number;
  daysRemaining:   number;
  projectedExhaust: Date | null;
  isAtRisk:        boolean;
  daysUntilAnchor: number;
}

export function useBurnRate(): BurnRateResult[] {
  const profile      = useAppStore(s => s.profile);
  const sliceSummary = useSliceSummary();

  return useMemo(() => {
    const cycle = getCycleBoundaries(profile);
    const now = new Date();
    const cycleStartMs = cycle.startDate.getTime();
    const cycleEndMs = cycle.endDate.getTime();
    const nowMs = now.getTime();

    // Calculate days elapsed in this financial cycle
    const elapsedDaysRaw = Math.floor((nowMs - cycleStartMs) / (1000 * 60 * 60 * 24)) + 1;
    const daysElapsed = Math.max(1, elapsedDaysRaw);

    // Days until end of cycle
    const remainingDaysRaw = Math.ceil((cycleEndMs - nowMs) / (1000 * 60 * 60 * 24));
    const daysUntilAnchor = Math.max(0, remainingDaysRaw);

    return Object.entries(sliceSummary)
      .filter(([, metrics]) => metrics.totalLimit > 0)
      .map(([slice, metrics]) => {
        const dailyBurnRate = metrics.totalSpent / daysElapsed;
        const remaining     = Math.max(metrics.totalLimit - metrics.totalSpent, 0);
        const daysRemaining = dailyBurnRate > 0
          ? Math.floor(remaining / dailyBurnRate)
          : 999;

        const projectedExhaust = dailyBurnRate > 0
          ? new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000)
          : null;

        // At risk = will exhaust budget MORE than 10 days before anchor day
        const isAtRisk = daysRemaining < daysUntilAnchor - 10;

        return {
          slice,
          dailyBurnRate,
          daysRemaining,
          projectedExhaust,
          isAtRisk,
          daysUntilAnchor,
        };
      })
      .filter(r => r.isAtRisk)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [sliceSummary, profile]);
}
