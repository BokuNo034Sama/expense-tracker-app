import type { CategoryRow, ExpenseRow, IncomeRow, MappedCategory, MappedExpense, MappedIncome } from '../store/types';

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export const mapCategory = (r: CategoryRow): MappedCategory => ({
  id: r.id,
  name: r.name,
  icon: r.icon,
  slice: r.slice,
  budgetLimit: Number(r.budget_limit),
  isBasic: r.is_basic,
  isPriority: r.is_priority,
  isSubscription: r.is_subscription,
  createdAt: r.created_at,
});

export const mapExpense = (r: ExpenseRow): MappedExpense => ({
  id: r.id,
  date: r.date,
  vendor: r.vendor,
  categoryId: r.category_id ?? '',
  amount: Number(r.amount),
  note: r.note ?? undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const mapIncome = (r: IncomeRow): MappedIncome => ({
  id: r.id,
  source: r.source,
  amount: Number(r.amount),
  date: r.date,
  note: r.note ?? undefined,
  createdAt: r.created_at,
});
