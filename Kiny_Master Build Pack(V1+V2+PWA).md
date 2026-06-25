# Kiny — Master Build Pack
**Product:** Personal Finance OS (Kiny) — Supabase + V1 + V2 + PWA  
**Phase:** Full Product Build — Cloud Backend + Feature Expansion + UI Overhaul + PWA  
**Agent Target:** Claude Code / AI Coding Agent  
**Design Reference:** Neubrutalist Spatial Bento  
**Last Updated:** May 2026  
**Status:** Ready for Execution

---

## HOW TO USE THIS DOCUMENT

This is the single source of truth for the entire Kiny build. Execute phases in strict order:

```
PHASE 0 — Supabase Backend   (SUP_STEP 01–03) → DB schema, RLS, client, async store
PHASE 1 — V1 Core            (STEP 01–11)     → CRUD, dashboard, advice engine, export
PHASE 2 — V2 UI              (V2_STEP 01–12)  → Neubrutalist redesign, sidebar, nudge
PHASE 3 — PWA                (PWA_STEP 01–07) → Service worker, manifest, install, offline
```

Never skip phases. Each phase depends on the previous being fully shipped and passing its Definition of Done.

---

## ARCHITECTURAL PIVOT — WHAT CHANGED

The original "No Backend / localStorage-only" guardrail has been **completely lifted**. Kiny is now a cloud-first, multi-user application backed by Supabase.

| Area | Before | After |
|---|---|---|
| Persistence | Zustand `persist` → `localStorage` (`kiny_v1`) | Zustand async → Supabase PostgreSQL |
| Auth | None (profile cleared on Sign Out) | Supabase Auth (email/password + magic link) |
| User isolation | Single user, device-local | Multi-user via Row Level Security (RLS) |
| Store actions | Synchronous | Async/await with Supabase client |
| Sync layer | Mock `syncData()` console log | Real Supabase Realtime subscriptions |
| Onboarding data | localStorage profile object | `profiles` table row, seeded on first login |

**What does NOT change:**
- All layout structure, bento grid, design tokens, neubrutalist styles
- Framer Motion animations and interaction patterns
- `src/lib/advice.ts` — advice engine logic is untouched; it receives data from the store regardless of source
- All component contracts and prop interfaces
- PWA manifest, service worker, and offline UX

---

## MASTER STACK

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS |
| Animation | Framer Motion 11.x |
| Charts | Recharts |
| State | Zustand (no persist middleware — Supabase is source of truth) |
| Backend | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| Auth | Supabase Auth (email/password + magic link) |
| PWA | vite-plugin-pwa (Workbox) |
| Export | jsPDF + autotable, PapaParse |
| Font | Lexend (headings) + Consolas (data) |
| Icons | Lucide React |

---

## MASTER FOLDER STRUCTURE

```
kiny/
├── public/
│   ├── manifest.webmanifest
│   ├── icons/
│   └── offline.html
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── auth/
│   │   │   ├── AuthGate.tsx          ← NEW: wraps app, shows login if no session
│   │   │   ├── LoginForm.tsx         ← NEW: email/password + magic link
│   │   │   └── SignUpForm.tsx
│   │   ├── onboarding/
│   │   │   └── OnboardingOverlay.tsx
│   │   ├── dashboard/
│   │   │   ├── SummaryCard.tsx
│   │   │   ├── SpendingChart.tsx
│   │   │   ├── SpendingRadar.tsx
│   │   │   ├── BudgetProgress.tsx
│   │   │   ├── AdviceCard.tsx
│   │   │   ├── WealthCard.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   └── InvestmentNudge.tsx
│   │   ├── expenses/
│   │   ├── budgets/
│   │   ├── income/
│   │   ├── profile/
│   │   ├── pwa/
│   │   └── shared/
│   │       ├── BentoCard.tsx
│   │       ├── ThemeToggle.tsx
│   │       ├── SyncIndicator.tsx     ← UPDATED: shows real Supabase sync state
│   │       └── EmptyState.tsx
│   ├── hooks/
│   │   ├── useOnlineStatus.ts
│   │   ├── useSyncStatus.ts          ← UPDATED: real Supabase Realtime
│   │   ├── useAdviceEngine.ts
│   │   └── usePWA.ts
│   ├── store/
│   │   ├── index.ts                  ← REWRITTEN: async Supabase-backed store
│   │   └── types.ts                  ← REWRITTEN: extended with Supabase types
│   ├── lib/
│   │   ├── supabaseClient.ts         ← NEW: Supabase client singleton
│   │   ├── advice.ts                 ← UNCHANGED
│   │   ├── format.ts
│   │   ├── seed.ts
│   │   └── export.ts
│   ├── styles/
│   │   └── tokens.css
│   ├── pages/
│   ├── App.tsx                       ← UPDATED: wrapped in AuthGate
│   └── main.tsx
├── .env.local                        ← NEW: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
├── vite.config.ts
├── tailwind.config.ts
└── index.html
```

---

## DESIGN TOKENS (Unchanged — V2 Source of Truth)

```css
/* src/styles/tokens.css */
:root {
  --color-primary:     #C6EF4E;
  --color-bg:          #EAECDF;
  --color-surface:     #F6F7F7;
  --color-ink:         #000000;
  --color-ink-muted:   #555555;
  --color-danger:      #FF4444;
  --color-warn:        #F5A623;
  --border-default:    2px solid #000000;
  --border-radius:     12px;
  --shadow-card:       4px 4px 0px 0px #000000;
  --shadow-card-hover: 6px 6px 0px 0px #000000;
  --shadow-btn:        3px 3px 0px 0px #000000;
  --shadow-btn-active: 1px 1px 0px 0px #000000;
  --font-display:      'Lexend', 'Atyp Display', sans-serif;
  --font-mono:         'Consolas', monospace;
  --sidebar-width:     72px;
  --sidebar-bg:        #000000;
}
[data-theme="dark"] {
  --color-bg:          #1A1A1A;
  --color-surface:     #242424;
  --color-ink:         #FFFFFF;
  --color-ink-muted:   #AAAAAA;
  --border-default:    2px solid #FFFFFF;
  --shadow-card:       4px 4px 0px 0px #FFFFFF;
  --shadow-card-hover: 6px 6px 0px 0px #FFFFFF;
}
```

---

# PHASE 0 — SUPABASE BACKEND

This phase must be completed **before any UI components are built**. It establishes the database schema, security rules, client connection, and async store that all subsequent phases depend on.

---

## [SUP_STEP 01] SQL Schema & Row Level Security

Run the following SQL in the **Supabase Dashboard → SQL Editor** in the order shown.

### 1.1 — Enable UUID Extension

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 1.2 — `profiles` Table

```sql
CREATE TABLE public.profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL DEFAULT '',
  occupation              VARCHAR(50) DEFAULT 'salary',
  monthly_salary          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  avatar_initials         TEXT NOT NULL DEFAULT '',
  purpose                 TEXT NOT NULL DEFAULT 'clarity'
                            CHECK (purpose IN ('clarity', 'saving', 'habit')),
  target_savings_rate     INTEGER DEFAULT NULL
                            CHECK (target_savings_rate IN (15, 20, 30, 40)),
  has_completed_onboarding BOOLEAN NOT NULL DEFAULT FALSE,
  theme                   TEXT NOT NULL DEFAULT 'light'
                            CHECK (theme IN ('light', 'dark')),
  has_seen_investment_nudge BOOLEAN NOT NULL DEFAULT FALSE,
  current_streak          INT DEFAULT 0,
  max_streak_this_month   INT DEFAULT 0,
  last_tracked_date       DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile row on new auth user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 1.2.5 — `budget_slices` Table

```sql
CREATE TABLE public.budget_slices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slice_name          VARCHAR(100) NOT NULL,
  slice_type          VARCHAR(50) NOT NULL, -- 'Basic', 'Handout', 'Feeding', 'Flex_Money', 'Saving', 'Custom'
  allocated_percentage INT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.3 — `categories` Table

```sql
CREATE TABLE public.categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  icon          TEXT NOT NULL DEFAULT 'MoreHorizontal',
  slice         TEXT NOT NULL DEFAULT 'Basic', -- Linked dynamically to budget_slices.slice_name
  budget_limit  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_basic      BOOLEAN NOT NULL DEFAULT FALSE,
  is_priority   BOOLEAN NOT NULL DEFAULT FALSE,
  is_subscription BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

CREATE INDEX idx_categories_user_id ON public.categories(user_id);
```

### 1.4 — `expenses` Table

```sql
CREATE TABLE public.expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id   UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  date          DATE NOT NULL,
  vendor        TEXT NOT NULL,
  amount        NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  note          TEXT DEFAULT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_user_id    ON public.expenses(user_id);
CREATE INDEX idx_expenses_date       ON public.expenses(date DESC);
CREATE INDEX idx_expenses_category   ON public.expenses(category_id);

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### 1.5 — `incomes` Table

```sql
CREATE TABLE public.incomes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source      TEXT NOT NULL DEFAULT 'Salary'
                CHECK (source IN ('Salary', 'Business', 'Gifting')),
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date        DATE NOT NULL,
  note        TEXT DEFAULT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incomes_user_id ON public.incomes(user_id);
CREATE INDEX idx_incomes_date    ON public.incomes(date DESC);
```

### 1.6 — `investment_interests` Table

```sql
CREATE TABLE public.investment_interests (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type                    TEXT NOT NULL
                            CHECK (type IN ('Stocks', 'Mutual Funds', 'ETFs')),
  wealth_balance_at_click NUMERIC(12, 2) NOT NULL DEFAULT 0,
  clicked_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investment_interests_user_id ON public.investment_interests(user_id);
```

### 1.7 — Row Level Security (RLS) Policies

```sql
-- ── Enable RLS on all tables ──────────────────────────────────────────────
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_interests  ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── categories ───────────────────────────────────────────────────────────
CREATE POLICY "Users can view own categories"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- ── expenses ─────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ── incomes ───────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own incomes"
  ON public.incomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own incomes"
  ON public.incomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incomes"
  ON public.incomes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own incomes"
  ON public.incomes FOR DELETE
  USING (auth.uid() = user_id);

-- ── investment_interests ──────────────────────────────────────────────────
CREATE POLICY "Users can view own investment interests"
  ON public.investment_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investment interests"
  ON public.investment_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Acceptance Criteria:**
- All 5 tables created in `public` schema with correct types and constraints.
- RLS enabled on all tables — a `SELECT *` without an authenticated session returns 0 rows.
- New `auth.users` signup automatically creates a `profiles` row via the trigger.
- Verified in Supabase Dashboard → Authentication → Users.

---

## [SUP_STEP 02] Supabase Client (`src/lib/supabaseClient.ts`)

**Task:**
1. Create `.env.local` in project root:
```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Add `.env.local` to `.gitignore` — never commit credentials.

3. Create `src/lib/supabaseClient.ts`:
```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types'; // generated types (see note below)

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[KINY] Missing Supabase environment variables. Check .env.local');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession:    true,          // Session stored in localStorage by Supabase
    autoRefreshToken:  true,
    detectSessionInUrl: true,         // Required for magic link auth
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// Helper: get current authenticated user ID — throws if not logged in
export async function getUID(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[KINY] Not authenticated');
  return user.id;
}
```

4. **Generate TypeScript types** from your Supabase schema:
```bash
npm install -D supabase
npx supabase gen types typescript \
  --project-id your-project-ref \
  --schema public \
  > src/lib/database.types.ts
```

5. Install the Supabase JS client:
```bash
npm install @supabase/supabase-js
```

**Acceptance Criteria:**
- `supabase` client exports correctly with full TypeScript types.
- Missing env vars throw an explicit error at startup, not a silent failure.
- `getUID()` returns a valid UUID for authenticated users and throws for unauthenticated calls.

---

## [SUP_STEP 03] Rewritten `types.ts` & Async Zustand Store (`index.ts`)

### 3.1 — `src/store/types.ts` (Full Rewrite)

```ts
import type { User, Session } from '@supabase/supabase-js';

// ─── Domain Primitives ────────────────────────────────────────────────────────

export type Purpose        = 'clarity' | 'saving' | 'habit';
export type SavingsRate    = 15 | 20 | 30 | 40;
export type Slice          = 'Basic' | 'Family' | 'Wealth' | 'Subscription';
export type IncomeSource   = 'Salary' | 'Business' | 'Gifting';
export type Theme          = 'light' | 'dark';
export type SyncStatus     = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
export type InvestmentType = 'Stocks' | 'Mutual Funds' | 'ETFs';

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
}
```

---

### 3.2 — `src/store/index.ts` (Full Rewrite — Async Supabase Store)

```ts
import { create } from 'zustand';
import { supabase, getUID } from '../lib/supabaseClient';
import { SEED_CATEGORIES, applyPriorityFlags } from '../lib/seed';
import type {
  AppStore, AuthState, LoadingState, ErrorState, PWAState,
  Purpose, SavingsRate, Theme, InvestmentType, Category,
} from './types';

// ─── Initial slice values ─────────────────────────────────────────────────────

const initialAuth: AuthState = { user: null, session: null, status: 'loading' };

const initialLoading: LoadingState = {
  profile: false, categories: false, expenses: false, incomes: false,
};

const initialErrors: ErrorState = {
  profile: null, categories: null, expenses: null, incomes: null, auth: null,
};

const initialPWA: PWAState = {
  isInstalled: false, hasUpdate: false, installPromptDismissed: false,
};

// ─── Helper: seed categories for a brand-new user ─────────────────────────────

async function seedCategoriesForUser(userId: string, purpose: Purpose): Promise<void> {
  const seeded = applyPriorityFlags(SEED_CATEGORIES, purpose).map(c => ({
    ...c,
    user_id: userId,
  }));
  const { error } = await supabase.from('categories').insert(seeded);
  if (error) throw new Error(`[KINY] Seed categories failed: ${error.message}`);
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set, get) => ({

  // ── Auth ───────────────────────────────────────────────────────────────────

  auth: initialAuth,

  initAuth: async () => {
    // Called once in App.tsx on mount — establishes session and subscribes to changes
    const { data: { session } } = await supabase.auth.getSession();
    set({
      auth: {
        user:    session?.user ?? null,
        session: session,
        status:  session ? 'authenticated' : 'unauthenticated',
      },
    });

    if (session) {
      await Promise.all([
        get().fetchProfile(),
        get().fetchCategories(),
        get().fetchExpenses(),
        get().fetchIncomes(),
      ]);
    }

    // Subscribe to auth state changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({
        auth: {
          user:    session?.user ?? null,
          session: session,
          status:  session ? 'authenticated' : 'unauthenticated',
        },
      });

      if (session) {
        await Promise.all([
          get().fetchProfile(),
          get().fetchCategories(),
          get().fetchExpenses(),
          get().fetchIncomes(),
        ]);
      } else {
        // Clear all data on sign out
        set({
          profile: null, categories: [], expenses: [],
          incomes: [], investmentInterests: [],
        });
      }
    });
  },

  signUp: async (email, password) => {
    set(s => ({ errors: { ...s.errors, auth: null } }));
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) set(s => ({ errors: { ...s.errors, auth: error.message } }));
    // Profile row is auto-created via DB trigger (handle_new_user)
  },

  signIn: async (email, password) => {
    set(s => ({ errors: { ...s.errors, auth: null } }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) set(s => ({ errors: { ...s.errors, auth: error.message } }));
  },

  signInMagicLink: async (email) => {
    set(s => ({ errors: { ...s.errors, auth: null } }));
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) set(s => ({ errors: { ...s.errors, auth: error.message } }));
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      auth: { user: null, session: null, status: 'unauthenticated' },
      profile: null, categories: [], expenses: [], incomes: [],
      investmentInterests: [],
    });
  },

  // ── Profile ────────────────────────────────────────────────────────────────

  profile: null,

  fetchProfile: async () => {
    set(s => ({ loading: { ...s.loading, profile: true }, errors: { ...s.errors, profile: null } }));
    try {
      const uid = await getUID();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      if (error) throw error;
      set({ profile: data, theme: data.theme as Theme });
    } catch (e: any) {
      set(s => ({ errors: { ...s.errors, profile: e.message } }));
    } finally {
      set(s => ({ loading: { ...s.loading, profile: false } }));
    }
  },

  completeOnboarding: async (name, purpose, occupation, monthlySalary, savingsRate) => {
    const uid = await getUID();

    const avatarInitials = name
      .split(' ')
      .filter(Boolean)
      .map(w => w[0].toUpperCase())
      .join('')
      .slice(0, 2);

    const profilePatch = {
      name,
      occupation,
      monthly_salary:           monthlySalary,
      avatar_initials:          avatarInitials,
      purpose,
      target_savings_rate:      savingsRate ?? null,
      has_completed_onboarding: true,
    };

    const { error } = await supabase
      .from('profiles')
      .update(profilePatch)
      .eq('id', uid);
    if (error) throw new Error(`[KINY] Profile update failed: ${error.message}`);

    // Seed categories only on first onboarding completion
    const existingCats = get().categories;
    if (existingCats.length === 0) {
      await seedCategoriesForUser(uid, purpose);
      await get().fetchCategories();
    } else {
      // Re-apply priority flags to existing categories
      const updated = applyPriorityFlags(existingCats, purpose);
      for (const cat of updated) {
        await supabase.from('categories').update({ is_priority: cat.is_priority }).eq('id', cat.id);
      }
      await get().fetchCategories();
    }

    await get().fetchProfile();
  },

  updateProfile: async (patch) => {
    const uid = await getUID();
    const { error } = await supabase.from('profiles').update(patch).eq('id', uid);
    if (error) throw new Error(`[KINY] Profile update failed: ${error.message}`);
    await get().fetchProfile();
  },

  // ── Categories ─────────────────────────────────────────────────────────────

  categories: [],

  fetchCategories: async () => {
    set(s => ({ loading: { ...s.loading, categories: true } }));
    try {
      const uid = await getUID();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: true });
      if (error) throw error;
      set({ categories: data ?? [] });
    } catch (e: any) {
      set(s => ({ errors: { ...s.errors, categories: e.message } }));
    } finally {
      set(s => ({ loading: { ...s.loading, categories: false } }));
    }
  },

  addCategory: async (c) => {
    const uid = await getUID();
    const { error } = await supabase.from('categories').insert({ ...c, user_id: uid });
    if (error) throw new Error(error.message);
    await get().fetchCategories();
  },

  updateCategory: async (id, patch) => {
    const { error } = await supabase.from('categories').update(patch).eq('id', id);
    if (error) throw new Error(error.message);
    await get().fetchCategories();
  },

  deleteCategory: async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
    set(s => ({ categories: s.categories.filter(c => c.id !== id) }));
  },

  // ── Expenses ───────────────────────────────────────────────────────────────

  expenses: [],

  fetchExpenses: async () => {
    set(s => ({ loading: { ...s.loading, expenses: true } }));
    try {
      const uid = await getUID();
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', uid)
        .order('date', { ascending: false });
      if (error) throw error;
      set({ expenses: data ?? [] });
    } catch (e: any) {
      set(s => ({ errors: { ...s.errors, expenses: e.message } }));
    } finally {
      set(s => ({ loading: { ...s.loading, expenses: false } }));
    }
  },

  addExpense: async (e) => {
    const uid = await getUID();
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...e, user_id: uid })
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ expenses: [data, ...s.expenses] }));
  },

  updateExpense: async (id, patch) => {
    const { data, error } = await supabase
      .from('expenses')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ expenses: s.expenses.map(e => e.id === id ? data : e) }));
  },

  deleteExpense: async (id) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
    set(s => ({ expenses: s.expenses.filter(e => e.id !== id) }));
  },

  // ── Incomes ────────────────────────────────────────────────────────────────

  incomes: [],

  fetchIncomes: async () => {
    set(s => ({ loading: { ...s.loading, incomes: true } }));
    try {
      const uid = await getUID();
      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', uid)
        .order('date', { ascending: false });
      if (error) throw error;
      set({ incomes: data ?? [] });
    } catch (e: any) {
      set(s => ({ errors: { ...s.errors, incomes: e.message } }));
    } finally {
      set(s => ({ loading: { ...s.loading, incomes: false } }));
    }
  },

  addIncome: async (i) => {
    const uid = await getUID();
    const { data, error } = await supabase
      .from('incomes')
      .insert({ ...i, user_id: uid })
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ incomes: [data, ...s.incomes] }));
  },

  updateIncome: async (id, patch) => {
    const { data, error } = await supabase
      .from('incomes')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ incomes: s.incomes.map(i => i.id === id ? data : i) }));
  },

  deleteIncome: async (id) => {
    const { error } = await supabase.from('incomes').delete().eq('id', id);
    if (error) throw new Error(error.message);
    set(s => ({ incomes: s.incomes.filter(i => i.id !== id) }));
  },

  // ── Investment Intelligence ─────────────────────────────────────────────────

  investmentInterests: [],

  logInvestmentInterest: async (type, wealthBalance) => {
    const uid = await getUID();
    const { data, error } = await supabase
      .from('investment_interests')
      .insert({ type, wealth_balance_at_click: wealthBalance, user_id: uid })
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ investmentInterests: [...s.investmentInterests, data] }));

    // Also persist nudge-seen flag
    await supabase
      .from('profiles')
      .update({ has_seen_investment_nudge: true })
      .eq('id', uid);
  },

  // ── Theme ──────────────────────────────────────────────────────────────────

  theme: 'light',

  setTheme: async (t) => {
    set({ theme: t });
    document.documentElement.dataset.theme = t;
    try {
      const uid = await getUID();
      await supabase.from('profiles').update({ theme: t }).eq('id', uid);
    } catch {
      // Theme is non-critical — silently fail if not logged in
    }
  },

  // ── Sync Status ────────────────────────────────────────────────────────────

  syncStatus:  'idle',
  lastSyncedAt: null,
  setSyncStatus: (s) => set({ syncStatus: s, lastSyncedAt: s === 'synced' ? new Date().toISOString() : get().lastSyncedAt }),

  // ── Loading & Error ────────────────────────────────────────────────────────

  loading: initialLoading,
  errors:  initialErrors,

  // ── PWA ────────────────────────────────────────────────────────────────────

  pwa: initialPWA,
  setPWAInstalled:      (v) => set(s => ({ pwa: { ...s.pwa, isInstalled: v } })),
  setPWAUpdate:         (v) => set(s => ({ pwa: { ...s.pwa, hasUpdate: v } })),
  dismissInstallPrompt: ()  => set(s => ({ pwa: { ...s.pwa, installPromptDismissed: true } })),
}));
```

### 3.3 — `src/lib/seed.ts` (Column Names Updated for Supabase)

```ts
// Column names match Supabase snake_case schema
export const SEED_CATEGORIES = [
  { name: 'Food & Dining',    icon: 'UtensilsCrossed', slice: 'Basic',        budget_limit: 50000,  is_basic: true,  is_priority: false, is_subscription: false },
  { name: 'Transport',        icon: 'Car',             slice: 'Basic',        budget_limit: 30000,  is_basic: true,  is_priority: false, is_subscription: false },
  { name: 'Health',           icon: 'HeartPulse',      slice: 'Basic',        budget_limit: 20000,  is_basic: true,  is_priority: false, is_subscription: false },
  { name: 'Utilities',        icon: 'Zap',             slice: 'Basic',        budget_limit: 25000,  is_basic: true,  is_priority: false, is_subscription: false },
  { name: 'Shopping',         icon: 'ShoppingBag',     slice: 'Family',       budget_limit: 40000,  is_basic: false, is_priority: false, is_subscription: false },
  { name: 'Education',        icon: 'GraduationCap',   slice: 'Family',       budget_limit: 30000,  is_basic: false, is_priority: false, is_subscription: false },
  { name: 'Savings & Invest', icon: 'TrendingUp',      slice: 'Wealth',       budget_limit: 100000, is_basic: false, is_priority: false, is_subscription: false },
  { name: 'Netflix',          icon: 'Tv',              slice: 'Subscription', budget_limit: 5000,   is_basic: false, is_priority: false, is_subscription: true  },
  { name: 'DSTV',             icon: 'Tv',              slice: 'Subscription', budget_limit: 10000,  is_basic: false, is_priority: false, is_subscription: true  },
  { name: 'GOTV',             icon: 'Tv',              slice: 'Subscription', budget_limit: 4000,   is_basic: false, is_priority: false, is_subscription: true  },
  { name: 'MTN Data',         icon: 'Wifi',            slice: 'Subscription', budget_limit: 6000,   is_basic: false, is_priority: false, is_subscription: true  },
  { name: 'Airtel Data',      icon: 'Wifi',            slice: 'Subscription', budget_limit: 6000,   is_basic: false, is_priority: false, is_subscription: true  },
  { name: 'Spotify',          icon: 'Music',           slice: 'Subscription', budget_limit: 3000,   is_basic: false, is_priority: false, is_subscription: true  },
  { name: 'Other',            icon: 'MoreHorizontal',  slice: 'Family',       budget_limit: 10000,  is_basic: false, is_priority: false, is_subscription: false },
] as const;

export function applyPriorityFlags(cats: typeof SEED_CATEGORIES[number][], purpose: string) {
  return cats.map(c => ({
    ...c,
    is_priority:
      (purpose === 'saving'  && c.slice === 'Wealth') ||
      (purpose === 'habit'   && (c.slice === 'Subscription' || c.name === 'Other')) ||
      (purpose === 'clarity' && c.is_basic),
  }));
}
```

### 3.4 — `App.tsx` Init Pattern

```tsx
// src/App.tsx — call initAuth once on mount
import { useEffect } from 'react';
import { useAppStore } from './store';
import { AuthGate } from './components/auth/AuthGate';

export default function App() {
  const initAuth = useAppStore(s => s.initAuth);
  const authStatus = useAppStore(s => s.auth.status);

  useEffect(() => {
    initAuth();
  }, []);

  if (authStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <span className="font-mono text-sm text-ink-muted animate-pulse">
          INITIALISING_KINY...
        </span>
      </div>
    );
  }

  return (
    <AuthGate>
      {/* Routes rendered here */}
    </AuthGate>
  );
}
```

### 3.5 — `AuthGate` Component Pattern

```tsx
// src/components/auth/AuthGate.tsx
import { useAppStore } from '../../store';
import { LoginForm } from './LoginForm';
import { OnboardingOverlay } from '../onboarding/OnboardingOverlay';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const status  = useAppStore(s => s.auth.status);
  const profile = useAppStore(s => s.profile);

  if (status === 'unauthenticated') return <LoginForm />;

  if (status === 'authenticated' && profile && !profile.has_completed_onboarding) {
    return <OnboardingOverlay />;
  }

  return <>{children}</>;
}
```

**Acceptance Criteria — Phase 0:**
- All SQL runs without errors in Supabase SQL Editor.
- RLS policies prevent cross-user data access (test with two accounts).
- `supabase` client exports with full TypeScript type inference.
- `initAuth()` on app mount loads all user data in a single parallelised `Promise.all`.
- New user sign-up → profile row auto-created via DB trigger → onboarding overlay shows.
- Sign out → all store slices cleared → `LoginForm` renders.
- `tsc --noEmit` → zero errors on types.ts and index.ts.

**Phase 0 Definition of Done:**
- [ ] All 5 tables exist in Supabase with correct schema
- [ ] RLS enabled and tested on all tables
- [ ] `supabase gen types` produces `database.types.ts` without errors
- [ ] `.env.local` populated and working
- [ ] `supabaseClient.ts` connects and `getUID()` returns valid UUID
- [ ] Zustand store actions all typed as async
- [ ] `initAuth()` establishes session and loads user data
- [ ] Auth state machine: loading → authenticated / unauthenticated
- [ ] `tsc --noEmit` zero errors

---

# PHASE 1 — V1 CORE BUILD

### ✦ CONTEXT REFRESH — Paste at start of Phase 1 session ✦

```
App: Kiny — Personal Finance OS.
Backend: Supabase (PostgreSQL + Auth + RLS). Phase 0 complete.
localStorage key: REMOVED. Supabase is the source of truth.
All store actions are async. Use `await store.action()` everywhere.
DB column names are snake_case (budget_limit, is_basic, etc.).
Component prop names stay camelCase — map at the store boundary.
Do NOT use Zustand persist middleware.
```

---

## [STEP 01] Auth UI — Login & Sign-Up Forms

**Depends on:** SUP_STEP 01–03

**Task:**
1. Create `src/components/auth/LoginForm.tsx` (Neubrutalist, V2 tokens):
   - Full-screen centred `BentoCard` (max-width 420px).
   - Kiny logo/wordmark top (Lexend 800, lime on black pill).
   - Tab switcher: `[ LOG IN ]` / `[ SIGN UP ]` — active = `bg-lime`.
   - Fields: Email · Password.
   - CTA: `[ ACCESS_KINY → ]` (bg-ink text-lime shadow-brutal).
   - Magic link option: `[ SEND MAGIC LINK ]` — secondary outlined button.
   - Error display: `font-mono text-danger text-xs` below CTA.
   - Loading state: CTA shows `AUTHENTICATING...` with `animate-pulse`.

2. Sign-up tab adds: confirm password field + disclaimer `"By signing up you agree to store your financial data securely on our servers."`.

3. Wire to store: `signIn()`, `signUp()`, `signInMagicLink()`.

**Acceptance Criteria:**
- Valid credentials → `auth.status` becomes `'authenticated'` → `AuthGate` renders the app.
- Invalid credentials → `errors.auth` renders below the form.
- Magic link → success toast: `"CHECK_YOUR_EMAIL — magic link sent."`.

---

## [STEP 02] Onboarding Overlay (4 screens, Supabase-backed)

**Depends on:** STEP 01, SUP_STEP 03

**Task:**
Same 4-screen flow as V2 spec. On final CTA call async `completeOnboarding(...)`.

- Show spinner on CTA during async call: `[ SAVING... ]` with `animate-pulse`.
- On error: display `font-mono text-danger` message inline.
- On success: overlay exits with `y: '-100%'` — `AuthGate` renders main app.

Note: `completeOnboarding` seeds categories to Supabase on first call.

---

## [STEP 03] Income Store & UI

**Depends on:** SUP_STEP 03

**Task:**
Same UI spec as original. Key changes:
- All form submits call `await addIncome(...)` / `await updateIncome(...)`.
- Show loading indicator on Drawer CTA during async save.
- On error: display error message inline in the Drawer.
- `fetchIncomes()` is called by `initAuth` — no manual fetch needed on page load.

---

## [STEP 04] Budget Slices UI

**Depends on:** SUP_STEP 03

**Task:**
Same UI spec. Key changes:
- Map DB column `budget_limit` → display as `budgetLimit` in components.
- Map `is_basic`, `is_priority`, `is_subscription` → camelCase in component props.
- Create a `mapCategory(row)` helper in `src/lib/format.ts` for this mapping.
- Priority constraint: check `categories.filter(c => c.slice === 'Wealth').reduce((s,c) => s + c.budget_limit, 0) === 0`.

---

## [STEP 05] Advice Card & MoM Engine

**Depends on:** SUP_STEP 03

**Task:**
`src/lib/advice.ts` is **unchanged**. Update `useAdviceEngine.ts` only to map DB columns:

```ts
import { mapCategory, mapExpense, mapIncome } from '../lib/format';

export function useAdviceEngine() {
  const { profile, categories, expenses, incomes } = useAppStore();
  if (!profile) return { advice: [], projection: [] };

  // Map snake_case DB rows to camelCase for advice engine
  const cats  = categories.map(mapCategory);
  const exps  = expenses.map(mapExpense);
  const incs  = incomes.map(mapIncome);

  return {
    advice:     generateAdvice(profile.purpose, cats, exps, incs),
    projection: getNextMonthProjection(cats, exps, profile.purpose, profile.target_savings_rate ?? null),
  };
}
```

Create mapping helpers in `src/lib/format.ts`:
```ts
export const mapCategory = (r: CategoryRow) => ({
  id: r.id, name: r.name, icon: r.icon, slice: r.slice,
  budgetLimit: r.budget_limit, isBasic: r.is_basic,
  isPriority: r.is_priority, isSubscription: r.is_subscription,
  createdAt: r.created_at,
});
export const mapExpense = (r: ExpenseRow) => ({
  id: r.id, date: r.date, vendor: r.vendor, categoryId: r.category_id ?? '',
  amount: r.amount, note: r.note ?? undefined,
  createdAt: r.created_at, updatedAt: r.updated_at,
});
export const mapIncome = (r: IncomeRow) => ({
  id: r.id, source: r.source, amount: r.amount,
  date: r.date, note: r.note ?? undefined, createdAt: r.created_at,
});
```

---

## [STEP 06] Sync Indicator (Real Supabase Realtime)

**Depends on:** SUP_STEP 02

**Task:**
Update `useSyncStatus.ts` to subscribe to Supabase Realtime:

```ts
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAppStore } from '../store';

export function useSyncStatus() {
  const { setSyncStatus, fetchExpenses, fetchIncomes, fetchCategories, auth } = useAppStore();

  useEffect(() => {
    if (auth.status !== 'authenticated' || !auth.user) return;

    setSyncStatus('syncing');
    const channel = supabase
      .channel('kiny-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses',   filter: `user_id=eq.${auth.user.id}` }, () => fetchExpenses())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomes',    filter: `user_id=eq.${auth.user.id}` }, () => fetchIncomes())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${auth.user.id}` }, () => fetchCategories())
      .subscribe((status) => {
        setSyncStatus(status === 'SUBSCRIBED' ? 'synced' : status === 'CHANNEL_ERROR' ? 'error' : 'syncing');
      });

    return () => { supabase.removeChannel(channel); };
  }, [auth.status, auth.user?.id]);
}
```

SyncIndicator adds `error` state:
- `● SYNC_READY` — `#C6EF4E` dot (subscribed)
- `⟳ SYNCING...` — spinning lime (connecting)
- `✕ SYNC_ERROR` — `#FF4444` dot, `font-mono text-danger` (error)
- `○ OFFLINE_MODE` — `#555` dot (no connection)

---

## [STEP 07–11] (Unchanged)

Steps 07–11 (WealthCard, Dashboard Assembly, Expense CRUD, Export, Polish) are **identical to the original spec**. The only integration requirement: all form submits call the async Zustand actions and handle loading/error states as described in STEP 03.

**Loading pattern for all Drawers and forms:**
```tsx
const [submitting, setSubmitting] = useState(false);
const [formError, setFormError]   = useState<string | null>(null);

const handleSubmit = async () => {
  setSubmitting(true);
  setFormError(null);
  try {
    await store.addExpense(payload);
    onClose();
  } catch (e: any) {
    setFormError(e.message);
  } finally {
    setSubmitting(false);
  }
};
```

---

# PHASE 2 — V2 UI OVERHAUL

### ✦ V2 CONTEXT REFRESH ✦

```
Kiny V1 + Supabase backend fully shipped.
App name: Kiny. Backend: Supabase. No localStorage.
V2 adds: Neubrutalist tokens, Sidebar, investment nudge, profile page, radar.
All store actions are async. UI logic unchanged from V2 spec.
Design tokens, BentoCard, animations — all identical to original V2 spec.
```

**All V2 steps (V2_STEP 01–12) are identical to the original spec** with these integration notes:

- **V2_STEP 03 (Onboarding):** `completeOnboarding()` is async — show spinner on CTA.
- **V2_STEP 04 (Profile Page):** `updateProfile()` is async — `[ SAVE_CHANGES ]` shows `SAVING...`.
- **V2_STEP 05 (Investment Nudge):** `logInvestmentInterest()` is async — button shows confirmation after `await` resolves.
- **V2_STEP 02 (Sidebar Sign Out):** calls `await signOut()` — clears store + redirects to `LoginForm`.
- **Clear All Data** in ProfilePage: calls `await signOut()` then `await supabase.auth.admin.deleteUser(uid)` — or simply sign out and redirect (full delete requires a server function; default to sign out only for now).

---

# PHASE 3 — PWA

### ✦ PWA CONTEXT REFRESH ✦

```
Kiny V1 + V2 + Supabase fully shipped.
PWA adds: installability, offline UX, update prompts.
IMPORTANT: Supabase session is persisted by the Supabase client in localStorage
(not by Zustand). The app shell loads offline; Supabase calls will fail gracefully
offline — all UI should handle errors.errors.* states with friendly messages.
```

**All PWA steps (PWA_STEP 01–07) are identical to the original spec** with one addition:

**PWA_STEP 06 — Offline Banner text update:**
```
○ OFFLINE_MODE — Data is read-only. Changes will sync when reconnected.
```

**Offline graceful degradation rule for all async actions:**
```ts
// Wrap all store action calls in components:
if (!isOnline) {
  setFormError('OFFLINE_MODE — Connect to save changes.');
  return;
}
```

---

## MASTER COMPONENT CHECKLIST (33 total)

| Phase | Component | File | Done |
|---|---|---|---|
| P0 | SQL Schema + RLS | Supabase Dashboard | ☐ |
| P0 | supabaseClient.ts | src/lib/supabaseClient.ts | ☐ |
| P0 | database.types.ts | src/lib/database.types.ts | ☐ |
| P0 | types.ts (rewrite) | src/store/types.ts | ☐ |
| P0 | index.ts (rewrite) | src/store/index.ts | ☐ |
| P0 | seed.ts (updated) | src/lib/seed.ts | ☐ |
| P0 | format.ts mappers | src/lib/format.ts | ☐ |
| V1 | AuthGate | components/auth/AuthGate.tsx | ☐ |
| V1 | LoginForm | components/auth/LoginForm.tsx | ☐ |
| V1 | OnboardingOverlay | components/onboarding/OnboardingOverlay.tsx | ☐ |
| V1 | WealthCard | components/dashboard/WealthCard.tsx | ☐ |
| V1 | SummaryCard | components/dashboard/SummaryCard.tsx | ☐ |
| V1 | SpendingChart | components/dashboard/SpendingChart.tsx | ☐ |
| V1 | BudgetProgress | components/dashboard/BudgetProgress.tsx | ☐ |
| V1 | AdviceCard | components/dashboard/AdviceCard.tsx | ☐ |
| V1 | RecentExpenses | components/dashboard/RecentExpenses.tsx | ☐ |
| V1 | ExpenseForm (Drawer) | components/expenses/ExpenseForm.tsx | ☐ |
| V1 | ExpenseTable | components/expenses/ExpenseTable.tsx | ☐ |
| V1 | IncomeForm (Drawer) | components/income/IncomeForm.tsx | ☐ |
| V1 | IncomeList | components/income/IncomeList.tsx | ☐ |
| V1 | SliceSection | components/budgets/SliceSection.tsx | ☐ |
| V1 | CategoryCard | components/budgets/CategoryCard.tsx | ☐ |
| V1 | CategoryForm (Drawer) | components/budgets/CategoryForm.tsx | ☐ |
| V1 | SyncIndicator | components/shared/SyncIndicator.tsx | ☐ |
| V1 | EmptyState | components/shared/EmptyState.tsx | ☐ |
| V2 | BentoCard | components/shared/BentoCard.tsx | ☐ |
| V2 | ThemeToggle | components/shared/ThemeToggle.tsx | ☐ |
| V2 | Sidebar | components/layout/Sidebar.tsx | ☐ |
| V2 | InvestmentNudge | components/dashboard/InvestmentNudge.tsx | ☐ |
| V2 | SpendingRadar | components/dashboard/SpendingRadar.tsx | ☐ |
| V2 | TransactionList | components/dashboard/TransactionList.tsx | ☐ |
| V2 | ProfileCard + ProfilePage | components/profile/ | ☐ |
| PWA | InstallPrompt + UpdatePrompt + OfflineBanner | components/pwa/ | ☐ |

---

## MASTER CONSTRAINTS & GUARDRAILS

| Rule | Scope | Detail |
|---|---|---|
| Supabase is source of truth | All | No Zustand persist middleware. No localStorage for app data |
| RLS enforced | All | Every table has RLS. user_id filter in every query |
| Async store actions | All | Every store action that touches Supabase is async/await |
| No auto sign-out on data clear | P0 | "Clear All Data" signs out only — does not delete auth account |
| BentoCard mandatory | V2+ | Every dashboard tile uses BentoCard wrapper |
| shadow-brutal everywhere | V2+ | No card without shadow |
| Font: Lexend + Consolas | V2+ | Lexend = headings · Consolas = data/labels |
| Lime = CTA · Ink = borders | V2+ | Never hardcode hex in components — use CSS vars |
| Dark mode resolves in both themes | V2+ | Test all tokens in light + dark |
| advice.ts untouched | All | Map DB rows to camelCase at store/hook boundary |
| Offline graceful degradation | PWA | All async actions check `isOnline` before firing |
| registerType: prompt | PWA | Never auto-update the service worker |
| Env vars never committed | P0 | .env.local in .gitignore always |

---

## MASTER DEPENDENCY INSTALL

```bash
# Supabase
npm install @supabase/supabase-js
npm install -D supabase                       # CLI for type generation

# Core
npm install zustand framer-motion recharts lucide-react

# shadcn/ui
npx shadcn@latest init
npx shadcn@latest add drawer scroll-area popover select progress tooltip

# Export
npm install jspdf jspdf-autotable papaparse
npm install --save-dev @types/papaparse

# PWA
npm install -D vite-plugin-pwa
npm install -D pwa-asset-generator

# Font — add to index.html (no npm):
# <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700;800&display=swap" rel="stylesheet">
```

---

## MASTER DEFINITION OF DONE

**PHASE 0 (Supabase):**
- [ ] All 5 tables in Supabase with RLS enabled and verified
- [ ] `supabase gen types` produces error-free `database.types.ts`
- [ ] `initAuth()` loads all user data on mount
- [ ] Auth state machine working: loading → authenticated / unauthenticated
- [ ] New user sign-up → profile auto-created → onboarding shows
- [ ] `tsc --noEmit` zero errors

**PHASE 1 (V1):**
- [ ] LoginForm authenticates real users via Supabase
- [ ] Expense / Income / Budget CRUD persists to Supabase
- [ ] Dashboard renders correct per-user data
- [ ] Advice engine runs on Supabase-fetched data
- [ ] Export (CSV + PDF) working from real data
- [ ] Responsive: 375px + 1280px

**PHASE 2 (V2):**
- [ ] All V1 features intact
- [ ] Sidebar Sign Out calls `signOut()` correctly
- [ ] Theme persists to `profiles` table
- [ ] InvestmentNudge logs to `investment_interests` table
- [ ] Profile edits persist to `profiles` table
- [ ] BentoCard + shadow-brutal on every tile

**PHASE 3 (PWA):**
- [ ] App shell loads offline from SW cache
- [ ] Offline banner shows when `!isOnline`
- [ ] Supabase errors handled gracefully offline
- [ ] Installs on Chrome Android + iOS Safari
- [ ] Lighthouse PWA score ≥ 90
- [ ] `tsc --noEmit` zero errors
