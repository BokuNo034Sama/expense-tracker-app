import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import path from 'path';
import { getCycleBoundariesForDate as getFrontendCycleBoundaries } from './cycleLogic';
import type { ProfileRow } from '../store/types';

// Load backend CommonJS module via Node createRequire to verify cross-runtime parity
const require = createRequire(import.meta.url);
const backendPath = path.resolve(__dirname, '../../../../backend/cycleLogic.js');
const backendCycleLogic = require(backendPath);
const getBackendCycleBoundaries = backendCycleLogic.getCycleBoundariesForDate;

describe('Cycle Logic — Cross-Runtime Parity & Business Correctness', () => {
  it('should successfully resolve and load both frontend and backend modules', () => {
    expect(typeof getFrontendCycleBoundaries).toBe('function');
    expect(typeof getBackendCycleBoundaries).toBe('function');
  });

  const testVectors: Array<{
    name: string;
    profile: ProfileRow | null;
    date: Date;
    expectedStart: string;
    expectedEnd: string;
  }> = [
    {
      name: 'Calendar month fallback when profile is null',
      profile: null,
      date: new Date(Date.UTC(2026, 5, 15)),
      expectedStart: '2026-06-01',
      expectedEnd: '2026-06-30',
    },
    {
      name: 'Salary earner with anchor day = 28 (Sunday shifts to Monday 29th)',
      profile: { income_type: 'salary', anchor_day: 28 } as unknown as ProfileRow,
      date: new Date(Date.UTC(2026, 5, 15)),
      expectedStart: '2026-05-28',
      expectedEnd: '2026-06-28',
    },
    {
      name: 'Salary earner with anchor day = 25 (Saturday shifts to Friday 24th)',
      profile: { income_type: 'salary', anchor_day: 25 } as unknown as ProfileRow,
      date: new Date(Date.UTC(2026, 6, 15)),
      expectedStart: '2026-06-25',
      expectedEnd: '2026-07-23',
    },
    {
      name: 'Business fluid rolling 15-day trailing window',
      profile: { income_type: 'business', fluid_window_days: 15 } as unknown as ProfileRow,
      date: new Date(Date.UTC(2026, 5, 15)),
      expectedStart: '2026-06-01',
      expectedEnd: '2026-06-15',
    },
    {
      name: 'Student weekly reset every Monday (anchor_day = 0)',
      profile: { income_type: 'student', anchor_day: 0 } as unknown as ProfileRow,
      date: new Date(Date.UTC(2026, 5, 17)),
      expectedStart: '2026-06-15',
      expectedEnd: '2026-06-21',
    },
    {
      name: 'Student with custom anchor day = 10',
      profile: { income_type: 'student', anchor_day: 10 } as unknown as ProfileRow,
      date: new Date(Date.UTC(2026, 5, 15)),
      expectedStart: '2026-06-10',
      expectedEnd: '2026-07-09',
    },
  ];

  for (const vector of testVectors) {
    it(`[Parity Check] ${vector.name}`, () => {
      const frontendResult = getFrontendCycleBoundaries(vector.profile, vector.date);
      const backendResult = getBackendCycleBoundaries(vector.profile, vector.date);

      const feStart = frontendResult.startDate.toISOString().split('T')[0];
      const feEnd = frontendResult.endDate.toISOString().split('T')[0];

      const beStart = backendResult.startDate.toISOString().split('T')[0];
      const beEnd = backendResult.endDate.toISOString().split('T')[0];

      // Exact mathematical agreement between frontend and backend
      expect(feStart).toBe(beStart);
      expect(feEnd).toBe(beEnd);

      // Exact business correctness against expected dates
      expect(feStart).toBe(vector.expectedStart);
      expect(feEnd).toBe(vector.expectedEnd);
    });
  }

  it('calculates exact mid-week anchor rollover numbers identically across frontend and backend', () => {
    const profile = {
      income_type: 'salary',
      anchor_day: 28,
    } as unknown as ProfileRow;

    // Monday August 24, 2026
    const weekMondayDate = new Date(Date.UTC(2026, 7, 24));
    const fe = getFrontendCycleBoundaries(profile, weekMondayDate);
    const be = getBackendCycleBoundaries(profile, weekMondayDate);

    expect(fe.startDate.toISOString().split('T')[0]).toBe('2026-07-28');
    expect(fe.endDate.toISOString().split('T')[0]).toBe('2026-08-27');
    expect(be.startDate.toISOString().split('T')[0]).toBe('2026-07-28');
    expect(be.endDate.toISOString().split('T')[0]).toBe('2026-08-27');

    const cycleDays = Math.round((fe.endDate.getTime() - fe.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    expect(cycleDays).toBe(31);

    const monthlyCap = 310000;
    const weeklyCap = (monthlyCap / cycleDays) * 7;
    expect(weeklyCap).toBe(70000);
  });
});
