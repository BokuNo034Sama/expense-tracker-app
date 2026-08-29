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
  premium_expires_at?:       string | null;
  premium_plan?:             'monthly' | 'annual' | null;
  notification_style?:       'aggressive' | 'motivational' | 'silent';
  has_supported_creator?:    boolean;
  current_streak?:           number;
  last_active_date?:         string;
  push_subscription?:        unknown;
  financial_streak?:         number;
  last_logged_date?:         string;
  max_streak_this_month?:    number;
  last_tracked_date?:        string | null;
  enabled_slices:            string[];
  estimated_monthly_salary?: number;
  income_type?:              'salary' | 'business' | 'student' | 'WEEKEND_SHIFT' | 'FLUID_ROLLING' | null;
  anchor_day?:               number | null;
  fluid_window_days?:        number | null;
  last_reset_date?:          string | null;
  tip_dismissed_permanently?: boolean;
  tip_last_shown_at?:         string | null;
}

export interface Squad {
  id:          string;
  name:        string;
  invite_code: string;
  created_by:  string;
  created_at:  string;
}

export interface SquadMember {
  id:        string;
  squad_id:  string;
  user_id:   string;
  joined_at: string;
  name?:            string;
  avatar_initials?: string;
  current_streak?:  number;
  last_logged_date?: string;
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

export interface BudgetSliceRow {
  id: string;
  user_id: string;
  slice_name: string;
  slice_type: string;
  allocated_percentage: number;
  created_at: string;
}

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

export type AppState =
  | 'LOADING'
  | 'ONBOARDING_INCOMPLETE'
  | 'READY'
  | 'UNAUTHENTICATED';

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
  appState:       AppState;
  setAppState:    (state: AppState) => void;
  signUp:         (email: string, password: string, incomeType: 'salary' | 'business' | 'student', anchorDay: number | null, fluidWindowDays: number | null) => Promise<void>;
  signIn:         (email: string, password: string) => Promise<void>;
  signOut:        () => Promise<void>;
  initAuth:       () => Promise<void>; // Called once on app mount
  archiveCurrentMonth: () => Promise<void>;
  manualArchiveCycle:  () => Promise<void>;

  // ── Profile ───────────────────────────────────────────────────────────────
  profile:            UserProfile | null;
  fetchProfile:       () => Promise<UserProfile | null>;
  completeOnboarding: (
    name: string, purpose: Purpose, occupation: string,
    monthlySalary: number, savingsRate?: SavingsRate,
    incomeType?: 'salary' | 'business' | 'student' | null,
    anchorDay?: number | null,
    fluidWindowDays?: number | null
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

  // ── Dynamic Budget Slices ──────────────────────────────────────────────────
  budgetSlices: BudgetSliceRow[];
  fetchBudgetSlices: () => Promise<void>;
  createBudgetSlice: (slice: Omit<BudgetSliceRow, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateBudgetSlice: (id: string, patch: Partial<BudgetSliceRow>) => Promise<void>;
  deleteBudgetSlice: (id: string) => Promise<void>;
  upsertBudgetSlices: (slices: BudgetSliceRow[]) => Promise<void>;
  seedDefaultBudgetSlices: (occupation: string) => Promise<void>;

  // ── Financial Squads ───────────────────────────────────────────────────────
  squads:       Squad[];
  fetchSquads:  () => Promise<void>;
  createSquad:  (name: string) => Promise<Squad>;
  joinSquad:    (inviteCode: string) => Promise<void>;
  leaveSquad:   (squadId: string) => Promise<void>;

  // ── Leaderboards ───────────────────────────────────────────────────────────
  fetchSquadLeaderboard: (squadId: string, week?: string) => Promise<SquadLeaderboardData>;
  fetchGlobalLeaderboard: (week?: string) => Promise<GlobalLeaderboardData>;
  setGlobalLeaderboardOptIn: (optIn: boolean) => Promise<boolean>;
}

export interface LeaderboardMember {
  rank?: number;
  user_id: string;
  name: string;
  avatar_initials: string;
  current_streak?: number;
  shield_active?: boolean;
  composite_score: number;
  logging_consistency: number;
  budget_adherence: number;
  distinct_log_days: number;
  total_capped_slices: number;
  is_ranked?: boolean;
  is_self?: boolean;
}

export interface SquadLeaderboardData {
  weekStartDate: string;
  ranked: LeaderboardMember[];
  unranked: LeaderboardMember[];
}

export interface GlobalLeaderboardData {
  weekStartDate: string;
  rankings: LeaderboardMember[];
  selfRank: LeaderboardMember | null;
  opt_in_required?: boolean;
}
