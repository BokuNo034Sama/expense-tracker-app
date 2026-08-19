// src/hooks/useTipCardEligibility.ts
// The tip card earns its place — shown only after genuine engagement.
// Rules:
// 1. User has logged at least 10 expenses
// 2. Those expenses span at least 5 different calendar dates
// 3. User has NOT permanently dismissed the card
// 4. Card has never been shown OR was last shown >90 days ago

import { useMemo } from 'react';
import { useAppStore } from '../store';

export function useTipCardEligibility(): boolean {
  const expenses  = useAppStore(s => s.expenses);
  const profile   = useAppStore(s => s.profile);

  return useMemo(() => {
    if (!profile) return false;

    // Rule 3 — permanently dismissed
    if (profile.tip_dismissed_permanently) return false;

    // Rule 4 — shown within last 90 days
    if (profile.tip_last_shown_at) {
      const lastShown = new Date(profile.tip_last_shown_at);
      const daysSince = (Date.now() - lastShown.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 90) return false;
    }

    // Rule 1 — at least 10 expenses
    if (!expenses || expenses.length < 10) return false;

    // Rule 2 — spans at least 5 different dates
    const uniqueDates = new Set(expenses.map(e => e.date));
    if (uniqueDates.size < 5) return false;

    return true;
  }, [expenses, profile]);
}
