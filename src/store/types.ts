import type { User, Session } from '@supabase/supabase-js';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// ─── Domain Primitives ────────────────────────────────────────────────────────

export type Purpose        = 'clarity' | 'saving' | 'habit' | (string & {});
export type SavingsRate    = 15 | 20 | 30 | 40 | number;
export type Slice          = 'Basic' | 'Family' | 'Wealth' | 'Subscription' | (string & {});
export type IncomeSource   = 'Salary' | 'Business' | 'Gifting';
export type Theme          = 'light' | 'dark';
export type SyncStatus     = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
export type InvestmentType = 'Stocks' | 'Mutual Funds' | 'ETFs';

export interface InvestmentTrigger {
  id: string;
  assetClass: 'Stock' | 'Mutual Fund' | 'ETF';
  name: string;
  targetThreshold: number;
  currentProgress: number;
  targetPlatform: string;
  status: 'PENDING' | 'THRESHOLD_MET';
}

// ─── Database Row Shapes (snake_case mirrors Supabase columns) ─────────────────

export interface ProfileRow {
  id:                        string;
  name:                      string;
  occupation:                string;
  monthly_salary:            number;
  avatar_initials:           string;
  purpose:                   Purpose;
  target_savings_rate:       SavingsRate | null;
  has_completed_onboarding:  boolean;
  theme:                     Theme;
  has_seen_investment_nudge: boolean;
  created_at:                string;
  updated_at:                string;
  is_premium?:               boolean;
  has_supported_creator?:    boolean;
  current_streak?:           number;
  last_active_date?:         string;
  push_subscription?:        unknown;
  financial_streak?:         number;
  last_logged_date?:         string;
  enabled_slices:            string[];
  estimated_monthly_salary?: number;
}

export interface CategoryRow {
  id:               string;
  user_id:          string;
  name:             string;
  icon:             string;
  slice:            Slice;
  budget_limit:     number;
  is_basic:         boolean;
  is_priority:      boolean;
  is_subscription:  boolean;
  created_at:       string;
}

export interface ExpenseRow {
  id:          string;
  user_id:     string;
  category_id: string | null;
  date:        string;           // ISO date: "2026-05-15"
  vendor:      string;
  amount:      number;
  note:        string | null;
  created_at:  string;
  updated_at:  string;
}

export interface IncomeRow {
  id:         string;
  user_id:    string;
  source:     IncomeSource;
  amount:     number;
  date:       string;
  note:       string | null;
  created_at: string;
}

export interface InvestmentInterestRow {
  id:                      string;
  user_id:                 string;
  type:                    InvestmentType;
  wealth_balance_at_click: number;
  clicked_at:              string;
}

// ─── App-level aliases (camelCase for component use) ──────────────────────────

export type UserProfile     = ProfileRow;
export type Category        = CategoryRow;
export type Expense         = ExpenseRow;
export type Income          = IncomeRow;
export type InvestmentInterest = InvestmentInterestRow;

export interface MappedCategory {
  id: string;
  name: string;
  icon: string;
  slice: Slice;
  budgetLimit: number;
  isBasic: boolean;
  isPriority: boolean;
  isSubscription: boolean;
  createdAt: string;
}

export interface MappedExpense {
  id: string;
  date: string;
  vendor: string;
  categoryId: string;
  amount: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MappedIncome {
  id: string;
  source: IncomeSource;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface MonthlySnapshot {
  id: string;
  user_id: string;
  month_year: string;
  total_income: number;
  total_expense: number;
  savings_rate: number;
  top_category: string;
}

// ─── Auth State ───────────────────────────────────────────────────────────────

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  user:    User | null;
  session: Session | null;
  status:  AuthStatus;
}

// ─── PWA State ────────────────────────────────────────────────────────────────

export interface PWAState {
  isInstalled:            boolean;
  hasUpdate:              boolean;
  installPromptDismissed: boolean;
  deferredPrompt:         BeforeInstallPromptEvent | null;
}

// ─── Loading & Error Slices ───────────────────────────────────────────────────

export interface LoadingState {
  profile:    boolean;
  categories: boolean;
  expenses:   boolean;
  incomes:    boolean;
}

export interface ErrorState {
  profile:    string | null;
  categories: string | null;
  expenses:   string | null;
  incomes:    string | null;
  auth:       string | null;
}

// ─── Master Zustand Store Shape ───────────────────────────────────────────────

export interface AppStore {
  // ── Auth ─────────────────────────────────────────────────────────────────
  auth:           AuthState;
  signUp:         (email: string, password: string) => Promise<void>;
  signIn:         (email: string, password: string) => Promise<void>;
  signInMagicLink:(email: string) => Promise<void>;
  signOut:        () => Promise<void>;
  initAuth:       () => Promise<void>; // Called once on app mount
  archiveCurrentMonth: () => Promise<void>;

  // ── Profile ───────────────────────────────────────────────────────────────
  profile:            UserProfile | null;
  fetchProfile:       () => Promise<void>;
  completeOnboarding: (
    name: string, purpose: Purpose, occupation: string,
    monthlySalary: number, savingsRate?: SavingsRate
  ) => Promise<void>;
  updateProfile:      (patch: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;

  // ── Categories ────────────────────────────────────────────────────────────
  categories:     Category[];
  fetchCategories:() => Promise<void>;
  addCategory:    (c: Omit<Category, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // ── Expenses ─────────────────────────────────────────────────────────────
  expenses:     Expense[];
  fetchExpenses:() => Promise<void>;
  addExpense:   (e: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateExpense:(id: string, patch: Partial<Expense>) => Promise<void>;
  deleteExpense:(id: string) => Promise<void>;

  // ── Incomes ──────────────────────────────────────────────────────────────
  incomes:     Income[];
  fetchIncomes:() => Promise<void>;
  addIncome:   (i: Omit<Income, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateIncome:(id: string, patch: Partial<Income>) => Promise<void>;
  deleteIncome:(id: string) => Promise<void>;

  // ── Investment Intelligence ───────────────────────────────────────────────
  investmentInterests:  InvestmentInterest[];
  logInvestmentInterest:(type: InvestmentType, wealthBalance: number) => Promise<void>;

  // ── Theme ─────────────────────────────────────────────────────────────────
  theme:    Theme;
  setTheme: (t: Theme) => Promise<void>; // Persists to profiles table

  // ── Sync ──────────────────────────────────────────────────────────────────
  syncStatus:   SyncStatus;
  setSyncStatus:(s: SyncStatus) => void;
  lastSyncedAt: string | null;

  // ── Loading & Error ───────────────────────────────────────────────────────
  loading: LoadingState;
  errors:  ErrorState;

  // ── PWA ───────────────────────────────────────────────────────────────────
  pwa:               PWAState;
  setPWAInstalled:   (v: boolean) => void;
  setPWAUpdate:      (v: boolean) => void;
  dismissInstallPrompt: () => void;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;

  // ── Session Re-validation ──────────────────────────────────────────────────
  isRevalidating:    boolean;
  refreshSession:    () => Promise<void>;

  // ── Privacy Controls ───────────────────────────────────────────────────────
  isDataMasked:      boolean;
  toggleDataMasked:  () => void;

  // ── Budget Nudge ───────────────────────────────────────────────────────────
  hasSeenBudgetNudge: boolean;
  dismissBudgetNudge: () => void;

  // ── Month Filtering ────────────────────────────────────────────────────────
  filterMonth: string;
  setFilterMonth: (month: string) => Promise<void>;

  // ── Deep Wealth Analytics ──────────────────────────────────────────────────
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  netMonthlySurplus: number;
  investmentTriggers: InvestmentTrigger[];
  activeWealthBanner: string | null;
  dismissWealthBanner: () => void;
  monthlySnapshots: MonthlySnapshot[];
  fetchMonthlySnapshots: () => Promise<void>;
}
