// ─── Purpose & Onboarding ───────────────────────────────────────────────────
export type Purpose = 'clarity' | 'saving' | 'habit';
export type SavingsRate = 15 | 20 | 30 | 40;

// ─── Category & Slices ──────────────────────────────────────────────────────
export type Slice = 'Basic' | 'Family' | 'Wealth' | 'Subscription';

// ─── Income ─────────────────────────────────────────────────────────────────
export type IncomeSource = 'Salary' | 'Business' | 'Gifting';

// ─── Theme ──────────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark';

// ─── Sync ───────────────────────────────────────────────────────────────────
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline';

// ─── Investment ─────────────────────────────────────────────────────────────
export type InvestmentType = 'Stocks' | 'Mutual Funds' | 'ETFs';

// ─── User Profile ───────────────────────────────────────────────────────────
export interface UserProfile {
  // V1 core
  name: string;
  purpose: Purpose;
  targetSavingsRate: SavingsRate | null;
  hasCompletedOnboarding: boolean;
  // V2 additions
  occupation: string;
  monthlySalary: number;
  avatarInitials: string;
}

// ─── Category ───────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  icon: string;
  slice: Slice;
  budgetLimit: number;      // Monthly cap in ₦ (0 = no limit)
  isBasic: boolean;         // Used for Habit Control alerts
  isPriority: boolean;      // Set by Purpose logic engine
  isSubscription: boolean;  // Pre-populated subscriptions
  createdAt: string;
}

// ─── Expense ────────────────────────────────────────────────────────────────
export interface Expense {
  id: string;
  date: string;             // ISO 8601: "2026-05-15"
  vendor: string;
  categoryId: string;       // FK → Category.id
  amount: number;           // Naira float
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Income ─────────────────────────────────────────────────────────────────
export interface Income {
  id: string;
  source: IncomeSource;
  amount: number;
  date: string;             // ISO 8601
  note?: string;
  createdAt: string;
}

// ─── Investment Interest Log ─────────────────────────────────────────────────
export interface InvestmentInterest {
  id: string;
  type: InvestmentType;
  wealthBalanceAtClick: number;
  clickedAt: string;
}

// ─── PWA State ───────────────────────────────────────────────────────────────
export interface PWAState {
  isInstalled: boolean;
  hasUpdate: boolean;
  installPromptDismissed: boolean;
}

// ─── App Store Shape ─────────────────────────────────────────────────────────
export interface AppStore {
  // Profile
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;
  completeOnboarding: (
    name: string,
    purpose: Purpose,
    occupation: string,
    monthlySalary: number,
    savingsRate?: SavingsRate
  ) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  resetProfile: () => void;

  // Categories
  categories: Category[];
  addCategory: (c: Omit<Category, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (e: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Income
  incomes: Income[];
  addIncome: (i: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, patch: Partial<Income>) => void;
  deleteIncome: (id: string) => void;

  // Theme
  theme: Theme;
  setTheme: (t: Theme) => void;

  // Sync
  syncStatus: SyncStatus;
  setSyncStatus: (s: SyncStatus) => void;
  lastSyncedAt: string | null;

  // Investment
  investmentInterests: InvestmentInterest[];
  logInvestmentInterest: (type: InvestmentType, wealthBalance: number) => void;
  hasSeenInvestmentNudge: boolean;
  setHasSeenInvestmentNudge: (v: boolean) => void;

  // PWA
  pwa: PWAState;
  setPWAInstalled: (v: boolean) => void;
  setPWAUpdate: (v: boolean) => void;
  dismissInstallPrompt: () => void;
}
