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

  const baseSalary = parseFloat(String(profile?.estimated_monthly_salary || 0));
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const loggedIncomesSum = incomes
    .filter(i => i.date.startsWith(currentMonthPrefix))
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalIncome = baseSalary + loggedIncomesSum;

  return {
    advice: generateAdvice(profile.purpose, cats, exps, incs, totalIncome),
    projection: getNextMonthProjection(cats, exps, profile.purpose, profile.target_savings_rate ?? null),
  };
}
