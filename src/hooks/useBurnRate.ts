import { useMemo } from 'react';
import { useAppStore } from '../store';
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
    const anchorDay = profile?.anchor_day;
    const now       = new Date();
    const today     = now.getDate();

    // Calculate days elapsed in this financial cycle
    let daysElapsed = anchorDay
      ? (today >= anchorDay ? today - anchorDay : today + (30 - anchorDay))
      : today;
    if (daysElapsed < 1) daysElapsed = 1;

    // Days until next anchor
    let daysUntilAnchor = anchorDay
      ? (anchorDay > today ? anchorDay - today : 30 - today + anchorDay)
      : 30 - today;

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
  }, [sliceSummary, profile?.anchor_day]);
}
