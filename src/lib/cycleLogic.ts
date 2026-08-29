/**
 * Canonical cycle boundary calculator for Kiny Personal Finance OS (Frontend TypeScript).
 * Determines the start and end dates of a user's active budget cycle.
 */

import type { ProfileRow } from '../store/types';

export function getCycleBoundariesForDate(
  profile: ProfileRow | null,
  date: Date
): { startDate: Date; endDate: Date } {
  if (!profile) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    return {
      startDate: new Date(Date.UTC(y, m, 1)),
      endDate: new Date(Date.UTC(y, m + 1, 0)),
    };
  }

  if (profile.income_type === 'business' || profile.income_type === 'FLUID_ROLLING') {
    const fluidWindowDays = profile.fluid_window_days || 30;
    const endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - (fluidWindowDays - 1));
    return { startDate, endDate };
  }

  if (profile.income_type === 'student') {
    const anchorDay = profile.anchor_day;
    if (anchorDay === 0 || anchorDay === null || anchorDay === undefined) {
      // Weekly Reset (Every Monday)
      const current = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      const day = current.getUTCDay();
      const diff = current.getUTCDate() - (day === 0 ? 6 : day - 1);
      const startDate = new Date(current);
      startDate.setUTCDate(diff);
      const endDate = new Date(startDate);
      endDate.setUTCDate(startDate.getUTCDate() + 6);
      return { startDate, endDate };
    }
  }

  const anchorDay = profile.anchor_day || 30;
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  const getPaydayForMonth = (y: number, m: number, anchor: number): Date => {
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const d = Math.min(anchor, daysInMonth);
    const pDate = new Date(Date.UTC(y, m, d));
    const dow = pDate.getUTCDay();
    if (dow === 6) pDate.setUTCDate(pDate.getUTCDate() - 1);
    else if (dow === 0) pDate.setUTCDate(pDate.getUTCDate() + 1);
    return pDate;
  };

  const pThis = getPaydayForMonth(year, month, anchorDay);
  if (date >= pThis) {
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    const pNext = getPaydayForMonth(nextYear, nextMonth, anchorDay);
    const endDate = new Date(pNext);
    endDate.setUTCDate(endDate.getUTCDate() - 1);
    return { startDate: pThis, endDate };
  } else {
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    const pPrev = getPaydayForMonth(prevYear, prevMonth, anchorDay);
    const endDate = new Date(pThis);
    endDate.setUTCDate(endDate.getUTCDate() - 1);
    return { startDate: pPrev, endDate };
  }
}
