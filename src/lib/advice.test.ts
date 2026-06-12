import { describe, it, expect } from 'vitest';
import { generateAdvice, getNextMonthProjection } from './advice';

describe('generateAdvice', () => {
  it('should return welcome advice if there are no expenses logged', () => {
    const advice = generateAdvice('saving', [], [], [], 500000);
    expect(advice).toHaveLength(1);
    expect(advice[0].id).toBe('welcome');
    expect(advice[0].type).toBe('info');
  });

  it('should flag budget overrun if category limit is exceeded', () => {
    const categories = [
      { id: 'cat-1', name: 'Transport', budgetLimit: 50000, isBasic: true, isSubscription: false },
      { id: 'cat-2', name: 'Feeding', budgetLimit: 100000, isBasic: true, isSubscription: false }
    ];
    const expenses = [
      { id: 'exp-1', categoryId: 'cat-1', amount: 60000, date: '2026-06-10', vendor: 'Uber' },
      { id: 'exp-2', categoryId: 'cat-2', amount: 80000, date: '2026-06-11', vendor: 'Spar' }
    ];

    const advice = generateAdvice('saving', categories, expenses, [], 500000);
    const overrunAdvice = advice.find(a => a.id === 'budget_overrun');
    expect(overrunAdvice).toBeDefined();
    expect(overrunAdvice?.type).toBe('warning');
    expect(overrunAdvice?.message).toContain('Transport');
    expect(overrunAdvice?.message).not.toContain('Feeding');
  });

  it('should give low savings rate warning for saving purpose profiles under 20%', () => {
    const categories = [{ id: 'cat-1', name: 'Transport', budgetLimit: 0 }];
    const expenses = [{ id: 'exp-1', categoryId: 'cat-1', amount: 450000 }];
    
    // totalIncome: 500000, totalExpenses: 450000 -> savings: 50000 -> 10% savings rate
    const advice = generateAdvice('saving', categories, expenses, [], 500000);
    const savingsAdvice = advice.find(a => a.id === 'low_savings');
    expect(savingsAdvice).toBeDefined();
    expect(savingsAdvice?.type).toBe('warning');
    expect(savingsAdvice?.message).toContain('10.0%');
  });

  it('should congratulate on meeting savings target for saving purpose profiles at/above 20%', () => {
    const categories = [{ id: 'cat-1', name: 'Transport', budgetLimit: 0 }];
    const expenses = [{ id: 'exp-1', categoryId: 'cat-1', amount: 300000 }];
    
    // totalIncome: 500000, totalExpenses: 300000 -> savings: 200000 -> 40% savings rate
    const advice = generateAdvice('saving', categories, expenses, [], 500000);
    const savingsAdvice = advice.find(a => a.id === 'high_savings');
    expect(savingsAdvice).toBeDefined();
    expect(savingsAdvice?.type).toBe('success');
    expect(savingsAdvice?.message).toContain('40.0%');
  });

  it('should flag subscription trim recommendation for habit purpose profiles spending >8% of income on subscriptions', () => {
    const categories = [
      { id: 'cat-sub', name: 'Subscriptions', budgetLimit: 0, isSubscription: true }
    ];
    const expenses = [
      { id: 'exp-1', categoryId: 'cat-sub', amount: 50000 }
    ];
    
    // totalIncome: 500000, subscriptionSpend: 50000 -> 10% of income (which is >8%)
    const advice = generateAdvice('habit', categories, expenses, [], 500000);
    const subAdvice = advice.find(a => a.id === 'sub_heavy');
    expect(subAdvice).toBeDefined();
    expect(subAdvice?.type).toBe('warning');
    expect(subAdvice?.message).toContain('10.0%');
  });
});

describe('getNextMonthProjection', () => {
  it('should generate a 3-month projection', () => {
    const expenses = [
      { id: 'exp-1', amount: 100000 },
      { id: 'exp-2', amount: 50000 }
    ];
    const projection = getNextMonthProjection([], expenses, 'saving', 20);
    expect(projection).toHaveLength(3);
    expect(projection[0].projectedExpenses).toBe(150000);
    expect(projection[0].projectedSavings).toBe(30000); // 150000 * 0.20
    expect(projection[1].projectedSavings).toBe(60000); // cumulative
  });
});
