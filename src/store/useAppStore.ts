import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Expense {
  id: string;
  date: string;
  vendor: string;
  categoryId: string;
  amount: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  budgetLimit: number;
  createdAt: string;
}

export interface AppStore {
  expenses: Expense[];
  categories: Category[];
  addExpense: (e: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addCategory: (c: Omit<Category, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
}

const defaultCategories: Category[] = [
  { id: crypto.randomUUID(), name: 'Food & Dining', icon: 'UtensilsCrossed', budgetLimit: 0, createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), name: 'Transport', icon: 'Car', budgetLimit: 0, createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), name: 'Shopping', icon: 'ShoppingBag', budgetLimit: 0, createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), name: 'Health', icon: 'HeartPulse', budgetLimit: 0, createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), name: 'Entertainment', icon: 'Tv', budgetLimit: 0, createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), name: 'Utilities', icon: 'Zap', budgetLimit: 0, createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), name: 'Other', icon: 'MoreHorizontal', budgetLimit: 0, createdAt: new Date().toISOString() },
];

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      expenses: [],
      categories: defaultCategories,

      addExpense: (e) => set((state) => ({
        expenses: [
          ...state.expenses,
          {
            ...e,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
      })),
      updateExpense: (id, patch) => set((state) => ({
        expenses: state.expenses.map((exp) =>
          exp.id === id ? { ...exp, ...patch, updatedAt: new Date().toISOString() } : exp
        )
      })),
      deleteExpense: (id) => set((state) => ({
        expenses: state.expenses.filter((exp) => exp.id !== id)
      })),

      addCategory: (c) => set((state) => ({
        categories: [
          ...state.categories,
          {
            ...c,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          }
        ]
      })),
      updateCategory: (id, patch) => set((state) => ({
        categories: state.categories.map((cat) =>
          cat.id === id ? { ...cat, ...patch } : cat
        )
      })),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id)
      })),
    }),
    {
      name: 'expensetracker_v1',
    }
  )
)
