import type { MappedCategory, MappedExpense, MappedIncome } from '../store/types';

export interface AdviceItem {
  id: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
}

export interface ProjectionItem {
  month: string;
  projectedSavings: number;
  projectedExpenses: number;
}

export function generateAdvice(
  profileOrPurpose: any,
  categories: MappedCategory[],
  expenses: MappedExpense[],
  _incomes: MappedIncome[],
  totalIncome: number
): AdviceItem[] {
  const items: AdviceItem[] = [];
  const profile = typeof profileOrPurpose === 'object' ? profileOrPurpose : null;
  const purpose = profile ? (profile.purpose || 'clarity') : (profileOrPurpose || 'clarity');

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  // Rule 1: Welcome & Baseline Clarity
  if (expenses.length === 0) {
    items.push({
      id: 'welcome',
      type: 'info',
      title: 'WELCOME_TO_KINY',
      message: 'Add your first expense or income to begin generating personalized advice.'
    });
    return items;
  }

  // Rule 2: General Budget Overrun Check
  const overBudgetCats = categories.filter(c => {
    if (c.budgetLimit <= 0) return false;
    const catSpend = expenses
      .filter(e => e.categoryId === c.id)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return catSpend > c.budgetLimit;
  });

  if (overBudgetCats.length > 0) {
    items.push({
      id: 'budget_overrun',
      type: 'warning',
      title: 'BUDGET_OVERRUN_ALERT',
      message: `You have exceeded your limit in: ${overBudgetCats.map(c => c.name).join(', ')}. Consider scaling back.`
    });
  }

  // Rule 3: Purpose Specific Advice
  if (purpose === 'saving') {
    if (savingsRate < 20) {
      items.push({
        id: 'low_savings',
        type: 'warning',
        title: 'INCREASE_SAVINGS_RATE',
        message: `Your current savings rate is ${savingsRate.toFixed(1)}%. Try to hit a 20% target by cutting non-essential spending.`
      });
    } else {
      items.push({
        id: 'high_savings',
        type: 'success',
        title: 'SAVINGS_TARGET_MET',
        message: `Excellent work! You are saving ${savingsRate.toFixed(1)}% of your monthly income. Keep building your wealth.`
      });
    }
  } else if (purpose === 'habit') {
    const subscriptionSpend = expenses
      .filter(e => {
        const cat = categories.find(c => c.id === e.categoryId);
        return cat?.isSubscription;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    if (subscriptionSpend > 0) {
      const subPercent = totalIncome > 0 ? (subscriptionSpend / totalIncome) * 100 : 0;
      if (subPercent > 8) {
        items.push({
          id: 'sub_heavy',
          type: 'warning',
          title: 'SUBSCRIPTION_TRIM_RECOMMENDED',
          message: `Subscriptions consume ${subPercent.toFixed(1)}% of your monthly income. Audit Netflix, DSTV, or data packages.`
        });
      }
    }
  } else if (purpose === 'clarity') {
    const basicSpend = expenses
      .filter(e => {
        const cat = categories.find(c => c.id === e.categoryId);
        return cat?.isBasic;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    if (totalExpenses > 0) {
      const basicRatio = (basicSpend / totalExpenses) * 100;
      items.push({
        id: 'clarity_ratio',
        type: 'info',
        title: 'ESSENTIALS_BREAKDOWN',
        message: `Essential needs (Food, Utilities, Transport) make up ${basicRatio.toFixed(1)}% of your total spending.`
      });
    }
  }
  
  // Student Specific Rule: SAPA Alert
  if (profile?.income_type === 'student') {
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    if (totalIncome > 0 && totalExpenses > totalIncome * 0.8) {
      items.push({
        id: 'student_sapa_warning',
        type: 'warning',
        title: '⚠️ SAPA_ALERT',
        message: 'Chook eye inside your wallet, chef. Clear road before you start drinking garri on Thursday.'
      });
    }
  }

  return items;
}

export function getNextMonthProjection(
  _categories: MappedCategory[],
  expenses: MappedExpense[],
  purpose: string,
  targetSavingsRate: number | null
): ProjectionItem[] {
  // Simple MoM Projection
  const projection: ProjectionItem[] = [];
  const nextMonth = new Date();
  
  for (let i = 1; i <= 3; i++) {
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const label = nextMonth.toLocaleString('default', { month: 'short' });
    
    // Simulate savings growth
    const projectedExp = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const projectedSav = purpose === 'saving' && targetSavingsRate 
      ? projectedExp * (targetSavingsRate / 100) 
      : projectedExp * 0.15; // default 15%
      
    projection.push({
      month: label,
      projectedSavings: Math.round(projectedSav * i),
      projectedExpenses: Math.round(projectedExp)
    });
  }
  
  return projection;
}
