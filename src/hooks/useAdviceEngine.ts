import { useAppStore } from '../store';
import { generateAdvice, getNextMonthProjection } from '../lib/advice';
import { mapCategory, mapExpense, mapIncome } from '../lib/format';

export function useAdviceEngine() {
  const profile = useAppStore(s => s.profile);
  const categories = useAppStore(s => s.categories);
  const expenses = useAppStore(s => s.expenses);
  const incomes = useAppStore(s => s.incomes);

  if (!profile) return { advice: [], projection: [] };

  // Map snake_case DB rows to camelCase for advice engine
  const cats = categories.map(mapCategory);
  const exps = expenses.map(mapExpense);
  const incs = incomes.map(mapIncome);

  return {
    advice: generateAdvice(profile.purpose, cats, exps, incs),
    projection: getNextMonthProjection(cats, exps, profile.purpose, profile.target_savings_rate ?? null),
  };
}
