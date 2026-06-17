import { useMemo } from 'react';
import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, getUID } from '../lib/supabaseClient';
import type {
  AppStore, AuthState, LoadingState, ErrorState, PWAState,
  Theme, ProfileRow, Category, Expense, Income, InvestmentInterest,
  InvestmentTrigger, MonthlySnapshot,
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
  isInstalled: false, hasUpdate: false, installPromptDismissed: false, deferredPrompt: null,
};

// ─── Date & Streak Helpers ────────────────────────────────────────────────────

export const getLocalDateString = (date: Date = new Date()): string => {
  // Force en-CA format because it natively outputs clean 'YYYY-MM-DD'
  return date.toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
};

export function getCycleBoundariesForDate(profile: ProfileRow | null, date: Date): { startDate: Date; endDate: Date } {
  if (!profile) {
    // Fallback: start and end of calendar month of 'date'
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    const startDate = new Date(Date.UTC(y, m, 1));
    const endDate = new Date(Date.UTC(y, m + 1, 0));
    return { startDate, endDate };
  }

  if (profile.income_type === 'business') {
    const fluidWindowDays = profile.fluid_window_days || 30;
    const endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - (fluidWindowDays - 1));
    return { startDate, endDate };
  }

  // Salary earner
  const anchorDay = profile.anchor_day || 30;
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  const getPaydayForMonth = (y: number, m: number, anchor: number): Date => {
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const d = Math.min(anchor, daysInMonth);
    const pDate = new Date(Date.UTC(y, m, d));
    const dow = pDate.getUTCDay(); // 0 = Sunday, 6 = Saturday
    if (dow === 6) {
      pDate.setUTCDate(pDate.getUTCDate() - 1); // Saturday -> Friday
    } else if (dow === 0) {
      pDate.setUTCDate(pDate.getUTCDate() + 1); // Sunday -> Monday
    }
    return pDate;
  };

  const pThis = getPaydayForMonth(year, month, anchorDay);

  if (date >= pThis) {
    // Current cycle starts at pThis, ends day before next payday
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    const pNext = getPaydayForMonth(nextYear, nextMonth, anchorDay);
    const endDate = new Date(pNext);
    endDate.setUTCDate(endDate.getUTCDate() - 1);
    return { startDate: pThis, endDate };
  } else {
    // Current cycle starts at pPrev, ends day before pThis
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    const pPrev = getPaydayForMonth(prevYear, prevMonth, anchorDay);
    const endDate = new Date(pThis);
    endDate.setUTCDate(endDate.getUTCDate() - 1);
    return { startDate: pPrev, endDate };
  }
}

export function getCycleBoundaries(profile: ProfileRow | null, date: Date = new Date(getLocalDateString())): { startDate: Date; endDate: Date } {
  return getCycleBoundariesForDate(profile, date);
}

const updateLoggingStreak = async (get: () => AppStore) => {
  const profile = get().profile;
  if (!profile) return;

  const expenses = get().expenses || [];
  if (expenses.length === 0) {
    await get().updateProfile({
      current_streak: 0,
      financial_streak: 0,
    });
    return;
  }

  // 1. Extract unique expense dates
  const expenseDates = new Set(expenses.map(e => e.date));

  // 2. Get local today and yesterday strings
  const todayStr = getLocalDateString(new Date());

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  const hasTransactionToday = expenseDates.has(todayStr);
  const hasTransactionYesterday = expenseDates.has(yesterdayStr);

  // If both today and yesterday have no transactions, the streak is broken (0).
  if (!hasTransactionToday && !hasTransactionYesterday) {
    await get().updateProfile({
      current_streak: 0,
      financial_streak: 0,
    });
    return;
  }

  // 3. Compute Streak
  let computedStreak = 0;
  const checkDate = new Date();
  if (!hasTransactionToday) checkDate.setDate(checkDate.getDate() - 1);

  let currentCheckStr = getLocalDateString(checkDate);
  while (expenseDates.has(currentCheckStr)) {
    computedStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
    currentCheckStr = getLocalDateString(checkDate);
  }

  // 4. Pass the final computed sequence score to the profile patch update routine.
  await get().updateProfile({
    last_logged_date: todayStr,
    current_streak: computedStreak,
    financial_streak: computedStreak,
  });
};

const checkAndRunRollover = async (get: () => AppStore) => {
  const profile = get().profile;
  if (!profile) return;

  if (profile.income_type === 'business') {
    // Business users have trailing/rolling window, no automatic rollover checks
    return;
  }

  const todayStr = getLocalDateString();
  const todayDate = new Date(todayStr);

  if (!profile.last_logged_date) {
    try {
      await get().updateProfile({ last_logged_date: todayStr });
    } catch (err) {
      console.error('[KINY] Failed to initialize last_logged_date:', err);
    }
    return;
  }

  const lastLoggedDate = new Date(profile.last_logged_date);
  const loggedCycle = getCycleBoundariesForDate(profile, lastLoggedDate);

  if (todayDate > loggedCycle.endDate) {
    try {
      await get().archiveCurrentMonth();
    } catch (err) {
      console.error('[KINY] Rollover evaluation failed:', err);
    }
  }
};

interface CustomNotificationOptions extends NotificationOptions {
  vibrate?: number[];
  renotify?: boolean;
}

const recalculateWealthMetrics = (
  set: (state: Partial<AppStore> | ((state: AppStore) => Partial<AppStore>)) => void,
  get: () => AppStore,
  isInitialLoad = false
) => {
  const profile = get().profile;
  const incomes = get().incomes || [];
  const expenses = get().expenses || [];

  const currentCycle = getCycleBoundaries(profile);
  const baseSalary = parseFloat(String(profile?.estimated_monthly_salary || profile?.monthly_salary || 0));

  const currentMonthIncomes = incomes.filter((i: Income) => {
    const txnDate = new Date(i.date);
    return txnDate >= currentCycle.startDate && txnDate <= currentCycle.endDate;
  });
  const currentMonthExpenses = expenses.filter((e: Expense) => {
    const txnDate = new Date(e.date);
    return txnDate >= currentCycle.startDate && txnDate <= currentCycle.endDate;
  });

  const totalMonthlyIncome = baseSalary + currentMonthIncomes.reduce((sum: number, i: Income) => sum + Number(i.amount), 0);
  const totalMonthlyExpenses = currentMonthExpenses.reduce((sum: number, e: Expense) => sum + Number(e.amount), 0);
  const netMonthlySurplus = totalMonthlyIncome - totalMonthlyExpenses;

  const currentTriggers: InvestmentTrigger[] = get().investmentTriggers || [];
  let bannerTriggered = false;
  let newBannerMessage = get().activeWealthBanner || null;

  const updatedTriggers = currentTriggers.map((trigger: InvestmentTrigger): InvestmentTrigger => {
    const progress = Math.max(0, netMonthlySurplus);
    const oldStatus = trigger.status;
    const newStatus: 'PENDING' | 'THRESHOLD_MET' = progress >= trigger.targetThreshold ? 'THRESHOLD_MET' : 'PENDING';

    if (oldStatus === 'PENDING' && newStatus === 'THRESHOLD_MET' && !isInitialLoad) {
      bannerTriggered = true;
      newBannerMessage = `MILESTONE MET: You've crossed the threshold for ${trigger.name} (₦${trigger.targetThreshold.toLocaleString()})!`;

      // Trigger Push Notification directly via Service Worker
      if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(`Wealth Milestone Met! 🚀`, {
            body: `Your surplus reached ₦${netMonthlySurplus.toLocaleString()}. You can now invest in ${trigger.name} on ${trigger.targetPlatform}!`,
            icon: '/logo.svg',
            vibrate: [200, 100, 200],
            tag: trigger.id,
            renotify: true
          } as CustomNotificationOptions);
        }).catch((err) => console.error('[API] Push notification error:', err));
      }
    }

    return {
      ...trigger,
      currentProgress: progress,
      status: newStatus
    };
  });

  set({
    totalMonthlyIncome,
    totalMonthlyExpenses,
    netMonthlySurplus,
    investmentTriggers: updatedTriggers,
    ...(bannerTriggered ? { activeWealthBanner: newBannerMessage } : {})
  });
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>()((set, get) => ({

  // ── Auth ───────────────────────────────────────────────────────────────────

  auth: initialAuth,

  initAuth: async () => {
    // Called once in App.tsx on mount — establishes session and subscribes to changes
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      const mockUser = { id: 'test-user-id', email: 'test.user@gmail.com' };
      const mockProfile: ProfileRow = {
        id: 'test-user-id',
        name: 'Test QA User',
        occupation: 'QA Engineer',
        monthly_salary: 500000,
        estimated_monthly_salary: 500000,
        avatar_initials: 'TQ',
        purpose: 'clarity',
        target_savings_rate: 20,
        has_completed_onboarding: true,
        theme: 'light',
        has_seen_investment_nudge: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_premium: true,
        has_supported_creator: true,
        current_streak: 1,
        last_active_date: new Date().toISOString(),
        financial_streak: 1,
        last_logged_date: new Date().toISOString().split('T')[0],
        enabled_slices: ['Basic', 'Family', 'Wealth', 'Subscription'],
      };
      set({
        auth: {
          user: mockUser as unknown as User,
          session: {} as unknown as Session,
          status: 'authenticated',
        },
        profile: mockProfile,
        theme: 'light',
        categories: [
          { id: 'cat-1', user_id: 'test-user-id', name: 'Transport', icon: 'Car', slice: 'Basic', budget_limit: 50000, is_basic: true, is_priority: true, is_subscription: false, created_at: new Date().toISOString() },
          { id: 'cat-2', user_id: 'test-user-id', name: 'Feeding', icon: 'Utensils', slice: 'Basic', budget_limit: 100000, is_basic: true, is_priority: true, is_subscription: false, created_at: new Date().toISOString() },
        ],
        expenses: [],
        incomes: [],
        monthlySnapshots: [],
      });
      return;
    }

    if (!navigator.onLine) {
      let cachedUser = null;
      let cachedSession = null;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const val = localStorage.getItem(key);
          if (val) {
            try {
              const parsed = JSON.parse(val);
              if (parsed && (parsed.currentSession || parsed.user)) {
                cachedUser = parsed.user || parsed.currentSession?.user || null;
                cachedSession = parsed.currentSession || null;
                break;
              }
            } catch {
              // Ignore cache parsing errors
            }
          }
        }
      }

      set({
        auth: {
          user: cachedUser,
          session: cachedSession,
          status: 'authenticated',
        },
      });

      try {
        await Promise.all([
          get().fetchProfile(),
          get().fetchCategories(),
          get().fetchExpenses(),
          get().fetchIncomes(),
          get().fetchMonthlySnapshots(),
        ]);
        await checkAndRunRollover(get);
        recalculateWealthMetrics(set, get, true);
      } catch (err) {
        console.error('[KINY] Offline initAuth initial data fetch failed:', err);
      }
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    set({
      auth: {
        user:    session?.user ?? null,
        session: session,
        status:  session ? 'authenticated' : 'unauthenticated',
      },
    });

    if (session) {
      try {
        await Promise.all([
          get().fetchProfile(),
          get().fetchCategories(),
          get().fetchExpenses(),
          get().fetchIncomes(),
          get().fetchMonthlySnapshots(),
        ]);
        await checkAndRunRollover(get);
        recalculateWealthMetrics(set, get, true);
      } catch (err) {
        console.error('[KINY] initAuth initial data fetch failed:', err);
      }
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
        try {
          await Promise.all([
            get().fetchProfile(),
            get().fetchCategories(),
            get().fetchExpenses(),
            get().fetchIncomes(),
            get().fetchMonthlySnapshots(),
          ]);
          await checkAndRunRollover(get);
          recalculateWealthMetrics(set, get, true);
        } catch (err) {
          console.error('[KINY] initAuth authStateChange data fetch failed:', err);
        }
      } else {
        // Clear all data on sign out
        set({
          profile: null, categories: [], expenses: [],
          incomes: [], investmentInterests: [], monthlySnapshots: [],
        });
      }
    });
  },

  archiveCurrentMonth: async () => {
    const uid = await getUID();
    const profile = get().profile;
    if (!profile || !profile.last_logged_date) {
      const todayStr = getLocalDateString();
      await get().updateProfile({ last_logged_date: todayStr });
      return;
    }

    const concludedCycle = getCycleBoundariesForDate(profile, new Date(profile.last_logged_date));
    let concludedMonth = getLocalDateString(concludedCycle.startDate).substring(0, 7);
    if (profile.income_type === 'business') {
      concludedMonth = `ROLL_${getLocalDateString(concludedCycle.endDate)}`;
    }

    // Compute base salary and totals
    const baseSalary = Number(profile?.estimated_monthly_salary || 0) || Number(profile?.monthly_salary || 0);
    const concludedIncomes = get().incomes.filter(i => {
      const d = new Date(i.date);
      return d >= concludedCycle.startDate && d <= concludedCycle.endDate;
    });
    const concludedExpenses = get().expenses.filter(e => {
      const d = new Date(e.date);
      return d >= concludedCycle.startDate && d <= concludedCycle.endDate;
    });

    const totalIncome = baseSalary + concludedIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalExpense = concludedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Identify top category
    const categoryTotals: Record<string, number> = {};
    concludedExpenses.forEach(exp => {
      const cat = get().categories.find(c => c.id === exp.category_id);
      const catName = cat ? cat.name : 'Uncategorized';
      categoryTotals[catName] = (categoryTotals[catName] || 0) + (Number(exp.amount) || 0);
    });

    let topCategory = 'None';
    let maxAmount = 0;
    for (const [catName, total] of Object.entries(categoryTotals)) {
      if (total > maxAmount) {
        maxAmount = total;
        topCategory = catName;
      }
    }

    // Insert snapshot row to Supabase
    const { error: snapshotError } = await supabase
      .from('monthly_snapshots')
      .insert({
        user_id: uid,
        month_year: concludedMonth,
        total_income: totalIncome,
        total_expense: totalExpense,
        savings_rate: savingsRate,
        top_category: topCategory,
      });

    if (snapshotError) {
      console.error('[KINY] Failed to insert monthly snapshot:', snapshotError.message);
      throw new Error(`[KINY] Failed to archive month: ${snapshotError.message}`);
    }

    const startStr = getLocalDateString(concludedCycle.startDate);
    const endStr = getLocalDateString(concludedCycle.endDate);

    // Delete expenses and incomes of the concluded cycle in Supabase
    const { error: expDeleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('user_id', uid)
      .gte('date', startStr)
      .lte('date', endStr);

    if (expDeleteError) {
      console.error('[KINY] Failed to delete expenses for archive:', expDeleteError.message);
    }

    const { error: incDeleteError } = await supabase
      .from('incomes')
      .delete()
      .eq('user_id', uid)
      .gte('date', startStr)
      .lte('date', endStr);

    if (incDeleteError) {
      console.error('[KINY] Failed to delete incomes for archive:', incDeleteError.message);
    }

    // Update last_logged_date to today
    const todayStr = getLocalDateString();
    await get().updateProfile({ last_logged_date: todayStr });

    // Reload the clean state arrays
    await Promise.all([
      get().fetchExpenses(),
      get().fetchIncomes(),
      get().fetchMonthlySnapshots(),
    ]);
    recalculateWealthMetrics(set, get, true);
  },

  manualArchiveCycle: async () => {
    const todayStr = getLocalDateString();
    await get().updateProfile({ last_logged_date: todayStr });
    await get().archiveCurrentMonth();
  },

  signUp: async (email, password, incomeType, anchorDay, fluidWindowDays) => {
    set(s => ({ errors: { ...s.errors, auth: null } }));
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          income_type: incomeType,
          anchor_day: anchorDay,
          fluid_window_days: fluidWindowDays
        }
      }
    });
    if (error) {
      set(s => ({ errors: { ...s.errors, auth: error.message } }));
      throw error;
    }
    if (authData?.user) {
      try {
        await supabase
          .from('profiles')
          .update({
            income_type: incomeType,
            anchor_day: anchorDay,
            fluid_window_days: fluidWindowDays
          })
          .eq('id', authData.user.id);
      } catch (err) {
        console.warn('[KINY] profiles update warning:', err);
      }
    }
  },

  signIn: async (email, password) => {
    set(s => ({ errors: { ...s.errors, auth: null } }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set(s => ({ errors: { ...s.errors, auth: error.message } }));
      throw error;
    }
  },

  signInMagicLink: async (email) => {
    set(s => ({ errors: { ...s.errors, auth: null } }));
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      set(s => ({ errors: { ...s.errors, auth: error.message } }));
      throw error;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      auth: { user: null, session: null, status: 'unauthenticated' },
      profile: null, categories: [], expenses: [], incomes: [],
      investmentInterests: [], monthlySnapshots: [],
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
      
      if (error) {
        console.warn('[KINY] fetchProfile query returned error, using fallback:', error.message);
        const fallbackProfile: ProfileRow = {
          id: uid,
          name: '',
          occupation: '',
          monthly_salary: 0,
          estimated_monthly_salary: 0,
          avatar_initials: '',
          purpose: 'clarity',
          target_savings_rate: null,
          has_completed_onboarding: false,
          theme: 'light',
          has_seen_investment_nudge: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_premium: false,
          has_supported_creator: false,
          current_streak: 0,
          last_active_date: '',
          financial_streak: 0,
          last_logged_date: '',
          enabled_slices: ['Basic', 'Family', 'Wealth', 'Subscription'],
        };
        set({ profile: fallbackProfile, theme: 'light' });
      } else {
        const row = data as unknown as ProfileRow;
        const profileWithSlices: ProfileRow = {
          ...row,
          enabled_slices: row.enabled_slices || ['Basic', 'Family', 'Wealth', 'Subscription'],
          estimated_monthly_salary: row.monthly_salary,
        };
        set({ profile: profileWithSlices, theme: (row.theme as Theme) || 'light' });
      }
    } catch (e) {
      const err = e as Error;
      set(s => ({ errors: { ...s.errors, profile: err.message } }));
      try {
        const uid = await getUID();
        const fallbackProfile: ProfileRow = {
          id: uid,
          name: '',
          occupation: '',
          monthly_salary: 0,
          estimated_monthly_salary: 0,
          avatar_initials: '',
          purpose: 'clarity',
          target_savings_rate: null,
          has_completed_onboarding: false,
          theme: 'light',
          has_seen_investment_nudge: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_premium: false,
          has_supported_creator: false,
          current_streak: 0,
          last_active_date: '',
          financial_streak: 0,
          last_logged_date: '',
          enabled_slices: ['Basic', 'Family', 'Wealth', 'Subscription'],
        };
        set({ profile: fallbackProfile, theme: 'light' });
      } catch {
        set({ profile: null });
      }
    } finally {
      set(s => ({ loading: { ...s.loading, profile: false } }));
      recalculateWealthMetrics(set, get, true);
    }
  },

  completeOnboarding: async (name, purpose, occupation, monthlySalary, savingsRate) => {
    const uid = await getUID();

    // Seed baseline categories
    const categoriesToSeed = [
      { name: 'Transport',      icon: 'Car',        slice: 'Basic' as const,        budget_limit: 0, is_basic: true,  is_priority: purpose === 'clarity', is_subscription: false, user_id: uid },
      { name: 'Feeding',        icon: 'Utensils',   slice: 'Basic' as const,        budget_limit: 0, is_basic: true,  is_priority: purpose === 'clarity', is_subscription: false, user_id: uid },
      { name: 'Parent Token',   icon: 'Gift',       slice: 'Family' as const,       budget_limit: 0, is_basic: false, is_priority: false,                  is_subscription: false, user_id: uid },
      { name: 'Sibling Token',  icon: 'Heart',      slice: 'Family' as const,       budget_limit: 0, is_basic: false, is_priority: false,                  is_subscription: false, user_id: uid },
      { name: 'Investments',    icon: 'TrendingUp', slice: 'Wealth' as const,       budget_limit: 0, is_basic: false, is_priority: purpose === 'saving',  is_subscription: false, user_id: uid }
    ];

    const { error: seedError } = await supabase.from('categories').insert(categoriesToSeed);
    if (seedError) {
      console.warn('[KINY] Seeding baseline categories failed or duplicates ignored:', seedError.message);
    }
    await get().fetchCategories();

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(profilePatch as any)
      .eq('id', uid);
    if (error) throw new Error(`[KINY] Profile update failed: ${error.message}`);

    await get().fetchProfile();
    recalculateWealthMetrics(set, get, false);
  },

  updateProfile: async (patch) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      set(s => ({
        profile: s.profile ? { ...s.profile, ...patch } : null
      }));
      recalculateWealthMetrics(set, get, false);
      return;
    }
    const uid = await getUID();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('profiles').update(patch as any).eq('id', uid);
    if (error) throw new Error(`[KINY] Profile update failed: ${error.message}`);
    await get().fetchProfile();
    recalculateWealthMetrics(set, get, false);
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
      set({ categories: (data as Category[]) ?? [] });
    } catch (e) {
      const err = e as Error;
      set(s => ({ errors: { ...s.errors, categories: err.message } }));
    } finally {
      set(s => ({ loading: { ...s.loading, categories: false } }));
    }
  },

  addCategory: async (c) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      const mockCategory: Category = {
        id: `mock-cat-${Date.now()}`,
        user_id: 'test-user-id',
        name: c.name,
        icon: c.icon,
        slice: c.slice,
        budget_limit: c.budget_limit || 0,
        is_basic: c.is_basic || false,
        is_priority: c.is_priority || false,
        is_subscription: c.is_subscription || false,
        created_at: new Date().toISOString(),
      };
      set(s => ({ categories: [...s.categories, mockCategory] }));
      return;
    }
    const uid = await getUID();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('categories').insert({ ...c, user_id: uid } as any);
    if (error) throw new Error(error.message);
    await get().fetchCategories();
  },

  updateCategory: async (id, patch) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      set(s => ({
        categories: s.categories.map(c => c.id === id ? { ...c, ...patch } : c)
      }));
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('categories').update(patch as any).eq('id', id);
    if (error) throw new Error(error.message);
    await get().fetchCategories();
  },

  deleteCategory: async (id) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      set(s => ({ categories: s.categories.filter(c => c.id !== id) }));
      return;
    }
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
      const filter = get().filterMonth;
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', uid);

      if (filter !== 'all') {
        const currentMonthStr = new Date().toISOString().substring(0, 7);
        let startOfMonth: string;
        let startOfNextMonth: string;

        if (filter === currentMonthStr) {
          startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
          const nextMonthObj = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
          startOfNextMonth = nextMonthObj.toISOString().split('T')[0];
        } else {
          const [yearStr, monthStr] = filter.split('-');
          const year = parseInt(yearStr);
          const month = parseInt(monthStr);
          startOfMonth = `${filter}-01`;
          let nextYear = year;
          let nextMonthVal = month + 1;
          if (nextMonthVal > 12) {
            nextMonthVal = 1;
            nextYear += 1;
          }
          startOfNextMonth = `${nextYear}-${String(nextMonthVal).padStart(2, '0')}-01`;
        }
        query = query.gte('date', startOfMonth).lt('date', startOfNextMonth);
      }

      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      set({ expenses: (data as Expense[]) ?? [] });
    } catch (e) {
      const err = e as Error;
      set(s => ({ errors: { ...s.errors, expenses: err.message } }));
    } finally {
      set(s => ({ loading: { ...s.loading, expenses: false } }));
      recalculateWealthMetrics(set, get, true);
    }
  },

  addExpense: async (e) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      const mockExpense: Expense = {
        id: `mock-exp-${Date.now()}`,
        user_id: 'test-user-id',
        date: e.date,
        vendor: e.vendor,
        category_id: e.category_id,
        amount: e.amount,
        note: e.note || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set(s => ({ expenses: [mockExpense, ...s.expenses] }));
      try {
        await updateLoggingStreak(get);
      } catch (error) {
        console.error("Silent profile logging update failed", error);
      }
      recalculateWealthMetrics(set, get, false);
      return;
    }
    const uid = await getUID();
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...e, user_id: uid } as unknown as Expense)
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ expenses: [data as Expense, ...s.expenses] }));
    try {
      await updateLoggingStreak(get);
    } catch (error) {
      console.error("Silent profile logging update failed", error);
    }
    recalculateWealthMetrics(set, get, false);
  },

  updateExpense: async (id, patch) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      set(s => ({
        expenses: s.expenses.map(e => e.id === id ? { ...e, ...patch } as Expense : e)
      }));
      recalculateWealthMetrics(set, get, false);
      return;
    }
    const { data, error } = await supabase
      .from('expenses')
      .update(patch as unknown as Partial<Expense>)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ expenses: s.expenses.map(e => e.id === id ? (data as Expense) : e) }));
    recalculateWealthMetrics(set, get, false);
  },

  deleteExpense: async (id) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      set(s => ({ expenses: s.expenses.filter(e => e.id !== id) }));
      recalculateWealthMetrics(set, get, false);
      return;
    }
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
    set(s => ({ expenses: s.expenses.filter(e => e.id !== id) }));
    recalculateWealthMetrics(set, get, false);
  },

  // ── Incomes ────────────────────────────────────────────────────────────────

  incomes: [],

  fetchIncomes: async () => {
    set(s => ({ loading: { ...s.loading, incomes: true } }));
    try {
      const uid = await getUID();
      const filter = get().filterMonth;
      let query = supabase
        .from('incomes')
        .select('*')
        .eq('user_id', uid);

      if (filter !== 'all') {
        const currentMonthStr = new Date().toISOString().substring(0, 7);
        let startOfMonth: string;
        let startOfNextMonth: string;

        if (filter === currentMonthStr) {
          startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
          const nextMonthObj = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
          startOfNextMonth = nextMonthObj.toISOString().split('T')[0];
        } else {
          const [yearStr, monthStr] = filter.split('-');
          const year = parseInt(yearStr);
          const month = parseInt(monthStr);
          startOfMonth = `${filter}-01`;
          let nextYear = year;
          let nextMonthVal = month + 1;
          if (nextMonthVal > 12) {
            nextMonthVal = 1;
            nextYear += 1;
          }
          startOfNextMonth = `${nextYear}-${String(nextMonthVal).padStart(2, '0')}-01`;
        }
        query = query.gte('date', startOfMonth).lt('date', startOfNextMonth);
      }

      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      set({ incomes: (data as Income[]) ?? [] });
    } catch (e) {
      const err = e as Error;
      set(s => ({ errors: { ...s.errors, incomes: err.message } }));
    } finally {
      set(s => ({ loading: { ...s.loading, incomes: false } }));
      recalculateWealthMetrics(set, get, true);
    }
  },

  addIncome: async (i) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      const mockIncome: Income = {
        id: `mock-inc-${Date.now()}`,
        user_id: 'test-user-id',
        date: i.date,
        source: i.source,
        amount: i.amount,
        note: i.note || null,
        created_at: new Date().toISOString(),
      };
      set(s => ({ incomes: [mockIncome, ...s.incomes] }));
      try {
        await updateLoggingStreak(get);
      } catch (error) {
        console.error("Silent profile logging update failed", error);
      }
      recalculateWealthMetrics(set, get, false);
      return;
    }
    const uid = await getUID();
    const { data, error } = await supabase
      .from('incomes')
      .insert({ ...i, user_id: uid } as unknown as Income)
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ incomes: [data as Income, ...s.incomes] }));
    try {
      await updateLoggingStreak(get);
    } catch (error) {
      console.error("Silent profile logging update failed", error);
    }
    recalculateWealthMetrics(set, get, false);
  },

  updateIncome: async (id, patch) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      set(s => ({
        incomes: s.incomes.map(i => i.id === id ? { ...i, ...patch } as Income : i)
      }));
      recalculateWealthMetrics(set, get, false);
      return;
    }
    const { data, error } = await supabase
      .from('incomes')
      .update(patch as unknown as Partial<Income>)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ incomes: s.incomes.map(i => i.id === id ? (data as Income) : i) }));
    recalculateWealthMetrics(set, get, false);
  },

  deleteIncome: async (id) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      set(s => ({ incomes: s.incomes.filter(i => i.id !== id) }));
      recalculateWealthMetrics(set, get, false);
      return;
    }
    const { error } = await supabase.from('incomes').delete().eq('id', id);
    if (error) throw new Error(error.message);
    set(s => ({ incomes: s.incomes.filter(i => i.id !== id) }));
    recalculateWealthMetrics(set, get, false);
  },

  // ── Investment Intelligence ─────────────────────────────────────────────────

  investmentInterests: [],

  logInvestmentInterest: async (type, wealthBalance) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      const mockInterest: InvestmentInterest = {
        id: `mock-interest-${Date.now()}`,
        user_id: 'test-user-id',
        type,
        wealth_balance_at_click: wealthBalance,
        clicked_at: new Date().toISOString(),
      };
      set(s => ({
        investmentInterests: [...s.investmentInterests, mockInterest],
        profile: s.profile ? { ...s.profile, has_seen_investment_nudge: true } : null
      }));
      return;
    }
    const uid = await getUID();
    const { data, error } = await supabase
      .from('investment_interests')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ type, wealth_balance_at_click: wealthBalance, user_id: uid } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ investmentInterests: [...s.investmentInterests, data as InvestmentInterest] }));

    await supabase
      .from('profiles')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ has_seen_investment_nudge: true } as any)
      .eq('id', uid);
  },

  // ── Theme ──────────────────────────────────────────────────────────────────

  theme: 'light',

  setTheme: async (t) => {
    set({ theme: t });
    document.documentElement.dataset.theme = t;
    try {
      const uid = await getUID();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('profiles').update({ theme: t } as any).eq('id', uid);
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
  setDeferredPrompt:    (prompt) => set(s => ({ pwa: { ...s.pwa, deferredPrompt: prompt } })),

  // ── Session Re-validation ──────────────────────────────────────────────────
  isRevalidating: false,
  refreshSession: async () => {
    if (get().isRevalidating) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({ isRevalidating: true });
      try {
        await get().fetchProfile();
      } catch (err) {
        console.error('[KINY] refreshSession failed:', err);
      } finally {
        set({ isRevalidating: false });
      }
    }
  },

  // ── Privacy Controls ───────────────────────────────────────────────────────
  isDataMasked: false,
  toggleDataMasked: () => set(s => ({ isDataMasked: !s.isDataMasked })),

  // ── Budget Nudge ───────────────────────────────────────────────────────────
  hasSeenBudgetNudge: false,
  dismissBudgetNudge: () => set({ hasSeenBudgetNudge: true }),

  // ── Deep Wealth Analytics ──────────────────────────────────────────────────
  totalMonthlyIncome: 0,
  totalMonthlyExpenses: 0,
  netMonthlySurplus: 0,
  activeWealthBanner: null,
  dismissWealthBanner: () => set({ activeWealthBanner: null }),
  investmentTriggers: [
    { id: 'trigger-stock', assetClass: 'Stock', name: 'US High Growth Equities Goal', targetThreshold: 150000, currentProgress: 0, targetPlatform: 'Bamboo', status: 'PENDING' },
    { id: 'trigger-fund', assetClass: 'Mutual Fund', name: 'Naira Inflation-Shield Fund Goal', targetThreshold: 100000, currentProgress: 0, targetPlatform: 'Cowrywise', status: 'PENDING' },
    { id: 'trigger-etf', assetClass: 'ETF', name: 'Global Tech Index ETF Goal', targetThreshold: 50000, currentProgress: 0, targetPlatform: 'Trove', status: 'PENDING' }
  ],
  monthlySnapshots: [],
  fetchMonthlySnapshots: async () => {
    try {
      const uid = await getUID();
      const { data, error } = await supabase
        .from('monthly_snapshots')
        .select('*')
        .eq('user_id', uid)
        .order('month_year', { ascending: false });
      if (error) throw error;
      set({ monthlySnapshots: (data as MonthlySnapshot[]) ?? [] });
    } catch (err) {
      console.error('[KINY] fetchMonthlySnapshots failed:', err);
    }
  },

  // ── Month Filtering ────────────────────────────────────────────────────────
  filterMonth: new Date().toISOString().substring(0, 7),
  setFilterMonth: async (month) => {
    set({ filterMonth: month });
    await Promise.all([
      get().fetchExpenses(),
      get().fetchIncomes(),
    ]);
    recalculateWealthMetrics(set, get, true);
  },
}));

export const calculateStreakCount = (expenses: Expense[]): number => {
  if (!expenses || expenses.length === 0) return 0;

  // Extract unique expense dates in Lagos local timezone YYYY-MM-DD
  const expenseDates = new Set(expenses.map(e => e.date));

  const todayStr = getLocalDateString(new Date());

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  const hasTransactionToday = expenseDates.has(todayStr);
  const hasTransactionYesterday = expenseDates.has(yesterdayStr);

  if (!hasTransactionToday && !hasTransactionYesterday) {
    return 0;
  }

  let computedStreak = 0;
  const checkDate = new Date();
  if (!hasTransactionToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let currentCheckStr = getLocalDateString(checkDate);
  while (expenseDates.has(currentCheckStr)) {
    computedStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
    currentCheckStr = getLocalDateString(checkDate);
  }

  return computedStreak;
};

export const useCurrentStreak = () => {
  const expenses = useAppStore(s => s.expenses);
  const profile = useAppStore(s => s.profile);
  const loading = useAppStore(s => s.loading.expenses);

  return useMemo(() => {
    // If we're loading and have a profile streak, return the profile streak to prevent flash to 0
    if (loading && profile?.current_streak !== undefined) {
      return profile.current_streak;
    }
    if (!expenses || expenses.length === 0) {
      return profile?.current_streak ?? 0;
    }
    return calculateStreakCount(expenses);
  }, [expenses, profile, loading]);
};
