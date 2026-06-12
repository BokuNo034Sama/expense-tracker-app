// Regression: ISSUE-001 — Timezone off-by-one date display issues
// Found by /qa on 2026-06-12
// Report: .gstack/qa-reports/qa-report-localhost-2026-06-12.md

import { describe, it, expect } from 'vitest';
import { parseLocalDate } from './format';

describe('parseLocalDate', () => {
  it('should parse YYYY-MM-DD date strings into local date objects correctly', () => {
    const dateStr = '2026-06-12';
    const dateObj = parseLocalDate(dateStr);
    
    expect(dateObj.getFullYear()).toBe(2026);
    expect(dateObj.getMonth()).toBe(5); // June is 5 (0-indexed)
    expect(dateObj.getDate()).toBe(12);
  });

  it('should handle leap years and boundary dates', () => {
    const leapDate = parseLocalDate('2024-02-29');
    expect(leapDate.getFullYear()).toBe(2024);
    expect(leapDate.getMonth()).toBe(1); // February is 1
    expect(leapDate.getDate()).toBe(29);

    const yearEndDate = parseLocalDate('2025-12-31');
    expect(yearEndDate.getFullYear()).toBe(2025);
    expect(yearEndDate.getMonth()).toBe(11); // December is 11
    expect(yearEndDate.getDate()).toBe(31);
  });
});
