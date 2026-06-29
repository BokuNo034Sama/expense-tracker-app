import { useMemo } from 'react';
import { create } from 'zustand';
import { supabase, getUID } from '../lib/supabaseClient';
import { getFCMToken } from '../lib/firebase';
import type {
  AppStore, AuthState, LoadingState, ErrorState, PWAState,
  Theme, ProfileRow, Category, Expense, Income, InvestmentInterest,
  InvestmentTrigger, MonthlySnapshot, BudgetSliceRow, AppState,
} from './types';
import type { User, Session } from '@supabase/supabase-js';

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

  if (profile.income_type === 'business' || profile.income_type === 'FLUID_ROLLING') {
    const fluidWindowDays = profile.fluid_window_days || 30;
    const endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - (fluidWindowDays - 1));
    return { startDate, endDate };
  }

  if (profile.income_type === 'student') {
    const anchorDay = profile.anchor_day;
    if (anchorDay === 0 || anchorDay === null || anchorDay === undefined) {
      // Weekly Reset (Every Monday)
      const current = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      const day = current.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const diff = current.getUTCDate() - (day === 0 ? 6 : day - 1);
      const startDate = new Date(current);
      startDate.setUTCDate(diff);

      const endDate = new Date(startDate);
      endDate.setUTCDate(startDate.getUTCDate() + 6);
      return { startDate, endDate };
    }
  }

  // Salary earner or Student with custom anchor day
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

  // 4. Compute max_streak_this_month
  const todayMonth = todayStr.slice(0, 7); // "YYYY-MM"
  const lastTrackedMonth = profile.last_tracked_date ? profile.last_tracked_date.slice(0, 7) : null;

  let nextMaxStreak = profile.max_streak_this_month || 0;
  if (lastTrackedMonth !== todayMonth) {
    nextMaxStreak = computedStreak;
  } else {
    nextMaxStreak = Math.max(nextMaxStreak, computedStreak);
  }

  // 5. Pass the final computed sequence score to the profile patch update routine.
  await get().updateProfile({
    last_logged_date: todayStr,
    last_tracked_date: todayStr,
    current_streak: computedStreak,
    financial_streak: computedStreak,
    max_streak_this_month: nextMaxStreak,
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

const apiRequest = async (path: string, options: RequestInit = {}) => {
  const state = useAppStore.getState();
  const token = state.auth.session?.access_token;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  } as Record<string, string>;
  
  const res = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
  });
  
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${res.status}`);
  }
  
  return res.json();
};

export const useAppStore = create<AppStore>()((set, get) => ({

  // ── Auth ───────────────────────────────────────────────────────────────────

  auth: initialAuth,
  appState: 'LOADING' as AppState,
  setAppState: (state) => set({ appState: state }),

  initAuth: async () => {
    set({ appState: 'LOADING' });

    // Server-side bypass for development testing
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
        max_streak_this_month: 1,
        last_tracked_date: new Date().toISOString().split('T')[0],
        last_active_date: new Date().toISOString(),
        financial_streak: 1,
        last_logged_date: new Date().toISOString().split('T')[0],
        enabled_slices: ['Basic Needs', 'Feeding', 'Flex Money', 'Savings'],
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
          { id: 'cat-1', user_id: 'test-user-id', name: 'Transport', icon: 'Car', slice: 'Basic Needs', budget_limit: 50000, is_basic: true, is_priority: true, is_subscription: false, created_at: new Date().toISOString() },
          { id: 'cat-2', user_id: 'test-user-id', name: 'Feeding', icon: 'Utensils', slice: 'Feeding', budget_limit: 100000, is_basic: true, is_priority: true, is_subscription: false, created_at: new Date().toISOString() },
        ],
        expenses: [],
        incomes: [],
        monthlySnapshots: [],
        budgetSlices: [
          { id: 'slice-1', user_id: 'test-user-id', slice_name: 'Basic Needs', slice_type: 'Basic', allocated_percentage: 50, created_at: new Date().toISOString() },
          { id: 'slice-2', user_id: 'test-user-id', slice_name: 'Feeding', slice_type: 'Feeding', allocated_percentage: 20, created_at: new Date().toISOString() },
          { id: 'slice-3', user_id: 'test-user-id', slice_name: 'Flex Money', slice_type: 'Flex_Money', allocated_percentage: 10, created_at: new Date().toISOString() },
          { id: 'slice-4', user_id: 'test-user-id', slice_name: 'Savings', slice_type: 'Saving', allocated_percentage: 20, created_at: new Date().toISOString() },
        ],
        appState: 'READY',
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
          status: cachedSession ? 'authenticated' : 'unauthenticated',
        },
      });

      if (cachedSession) {
        try {
          const profile = await get().fetchProfile();
          if (profile && profile.has_completed_onboarding) {
            await Promise.all([
              get().fetchCategories(),
              get().fetchExpenses(),
              get().fetchIncomes(),
              get().fetchMonthlySnapshots(),
            ]);
            await checkAndRunRollover(get);
            recalculateWealthMetrics(set, get, true);
            set({ appState: 'READY' });
          } else {
            set({ appState: 'ONBOARDING_INCOMPLETE' });
          }
        } catch (err) {
          console.error('[KINY] Offline initAuth initial data fetch failed:', err);
          set({ appState: 'READY' }); // Fallback to let user view cached state
        }
      } else {
        set({ appState: 'UNAUTHENTICATED' });
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
        const profile = await get().fetchProfile();
        if (profile && profile.has_completed_onboarding) {
          await Promise.all([
            get().fetchCategories(),
            get().fetchExpenses(),
            get().fetchIncomes(),
            get().fetchMonthlySnapshots(),
          ]);
          await checkAndRunRollover(get);
          recalculateWealthMetrics(set, get, true);
          set({ appState: 'READY' });
        } else {
          set({ appState: 'ONBOARDING_INCOMPLETE' });
        }
      } catch (err) {
        console.error('[KINY] initAuth initial data fetch failed:', err);
        set({ appState: 'UNAUTHENTICATED' });
      }
    } else {
      set({ appState: 'UNAUTHENTICATED' });
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
          const profile = await get().fetchProfile();
          if (profile && profile.has_completed_onboarding) {
            await Promise.all([
              get().fetchCategories(),
              get().fetchExpenses(),
              get().fetchIncomes(),
              get().fetchMonthlySnapshots(),
            ]);
            await checkAndRunRollover(get);
            recalculateWealthMetrics(set, get, true);
            set({ appState: 'READY' });

            // Asynchronously request and sync FCM token in the background
            getFCMToken().then(async (fcmToken) => {
              if (fcmToken) {
                console.log('USER_FCM_TOKEN:', fcmToken);
                const currentSub = get().profile?.push_subscription;
                const fcmSub = { type: 'fcm', token: fcmToken };
                if (!currentSub || JSON.stringify(currentSub) !== JSON.stringify(fcmSub)) {
                  await get().updateProfile({ push_subscription: fcmSub });
                  console.log('[KINY] FCM Token successfully synced to user profile.');
                }
              }
            }).catch((err) => {
              console.warn('[KINY] Background FCM sync warning:', err);
            });
          } else {
            set({ appState: 'ONBOARDING_INCOMPLETE' });
          }
        } catch (err) {
          console.error('[KINY] initAuth authStateChange data fetch failed:', err);
        }
      } else {
        // Clear all data on sign out
        set({
          profile: null,
          categories: [],
          expenses: [],
          incomes: [],
          investmentInterests: [],
          monthlySnapshots: [],
          appState: 'UNAUTHENTICATED',
        });
      }
    });
  },

  archiveCurrentMonth: async () => {
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

    // Insert snapshot row to Express backend
    try {
      await apiRequest('/api/snapshots', {
        method: 'POST',
        body: JSON.stringify({
          month_year: concludedMonth,
          total_income: totalIncome,
          total_expense: totalExpense,
          savings_rate: savingsRate,
          top_category: topCategory,
        }),
      });
    } catch (err: any) {
      console.error('[KINY] Failed to insert monthly snapshot:', err.message);
      throw new Error(`[KINY] Failed to archive month: ${err.message}`);
    }

    const startStr = getLocalDateString(concludedCycle.startDate);
    const endStr = getLocalDateString(concludedCycle.endDate);

    // Delete expenses and incomes of the concluded cycle via Express bulk delete APIs
    try {
      await apiRequest(`/api/expenses?start_date=${startStr}&end_date=${endStr}`, {
        method: 'DELETE',
      });
    } catch (expDeleteError: any) {
      console.error('[KINY] Failed to delete expenses for archive:', expDeleteError.message);
    }

    try {
      await apiRequest(`/api/incomes?start_date=${startStr}&end_date=${endStr}`, {
        method: 'DELETE',
      });
    } catch (incDeleteError: any) {
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
    try {
      const data = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          income_type: incomeType,
          anchor_day: anchorDay,
          fluid_window_days: fluidWindowDays,
        }),
      });
      if (data.session) {
        const { error } = await supabase.auth.setSession(data.session);
        if (error) throw error;
      }
    } catch (err: any) {
      set(s => ({ errors: { ...s.errors, auth: err.message || String(err) } }));
      throw err;
    }
  },

  signIn: async (email, password) => {
    set(s => ({ errors: { ...s.errors, auth: null } }));
    try {
      const data = await apiRequest('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.session) {
        const { error } = await supabase.auth.setSession(data.session);
        if (error) throw error;
      }
    } catch (err: any) {
      set(s => ({ errors: { ...s.errors, auth: err.message || String(err) } }));
      throw err;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      auth: { user: null, session: null, status: 'unauthenticated' },
      profile: null, categories: [], expenses: [], incomes: [],
      investmentInterests: [], monthlySnapshots: [], budgetSlices: [],
    });
  },

  // ── Profile ────────────────────────────────────────────────────────────────

  profile: null,

  fetchProfile: async () => {
    set(s => ({ loading: { ...s.loading, profile: true }, errors: { ...s.errors, profile: null } }));
    try {
      const data = await apiRequest('/api/profile');
      const row = data as unknown as ProfileRow;
      const profileWithSlices: ProfileRow = {
        ...row,
        enabled_slices: row.enabled_slices || ['Basic Needs', 'Feeding', 'Flex Money', 'Savings'],
        estimated_monthly_salary: row.monthly_salary,
      };
      set({ profile: profileWithSlices, theme: (row.theme as Theme) || 'light' });
      await get().fetchBudgetSlices();
      return profileWithSlices;
    } catch (e: any) {
      set(s => ({ errors: { ...s.errors, profile: e.message } }));
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
          max_streak_this_month: 0,
          last_tracked_date: null,
          enabled_slices: ['Basic Needs', 'Feeding', 'Flex Money', 'Savings'],
        };
        set({ profile: fallbackProfile, theme: 'light' });
        await get().fetchBudgetSlices();
        return fallbackProfile;
      } catch {
        set({ profile: null });
        return null;
      }
    } finally {
      set(s => ({ loading: { ...s.loading, profile: false } }));
      recalculateWealthMetrics(set, get, true);
    }
  },

  completeOnboarding: async (name, purpose, occupation, monthlySalary, savingsRate, incomeType, anchorDay, fluidWindowDays) => {
    // Seed baseline categories matched to seeded dynamic budget slices
    const categoriesToSeed = [
      { name: 'Transport',      icon: 'Car',        slice: 'Basic Needs',        budget_limit: 0, is_basic: true,  is_priority: purpose === 'clarity', is_subscription: false },
      { name: 'Feeding',        icon: 'Utensils',   slice: 'Feeding',            budget_limit: 0, is_basic: true,  is_priority: purpose === 'clarity', is_subscription: false }
    ] as any[];

    if (incomeType === 'student') {
      categoriesToSeed.push(
        { name: 'Hostel Rent',      icon: 'Home',     slice: 'Basic Needs',        budget_limit: 0, is_basic: false, is_priority: true,  is_subscription: false },
        { name: 'Handouts & Books', icon: 'BookOpen', slice: 'Handouts & Books',   budget_limit: 0, is_basic: false, is_priority: false, is_subscription: false },
        { name: 'Laptop & Gigs',    icon: 'Laptop',   slice: 'Flex Money',         budget_limit: 0, is_basic: false, is_priority: false, is_subscription: false }
      );
    } else {
      categoriesToSeed.push(
        { name: 'Parent Token',   icon: 'Gift',       slice: 'Flex Money',         budget_limit: 0, is_basic: false, is_priority: false,                  is_subscription: false },
        { name: 'Sibling Token',  icon: 'Heart',      slice: 'Flex Money',         budget_limit: 0, is_basic: false, is_priority: false,                  is_subscription: false },
        { name: 'Investments',    icon: 'TrendingUp', slice: 'Savings',            budget_limit: 0, is_basic: false, is_priority: purpose === 'saving',  is_subscription: false }
      );
    }

    for (const cat of categoriesToSeed) {
      try {
        await apiRequest('/api/categories', {
          method: 'POST',
          body: JSON.stringify(cat),
        });
      } catch (err: any) {
        console.warn('[KINY] Seeding baseline category failed:', err.message);
      }
    }
    await get().fetchCategories();

    // Seed dynamic budget slices
    await get().seedDefaultBudgetSlices(incomeType || 'salary');

    const avatarInitials = name
      .split(' ')
      .filter(Boolean)
      .map(w => w[0].toUpperCase())
      .join('')
      .slice(0, 2);

    // Keep enabled_slices list for fallback backwards compatibility
    const defaultSlices = incomeType === 'student'
      ? ['Basic Needs', 'Handouts & Books', 'Feeding', 'Flex Money', 'Savings']
      : ['Basic Needs', 'Feeding', 'Flex Money', 'Savings'];

    const profilePatch: any = {
      name,
      occupation,
      monthly_salary:           monthlySalary,
      avatar_initials:          avatarInitials,
      purpose,
      target_savings_rate:      savingsRate ?? null,
      has_completed_onboarding: true,
      enabled_slices:           defaultSlices,
    };

    if (incomeType) {
      profilePatch.income_type = String(incomeType).toLowerCase();
    }
    if (anchorDay !== undefined) {
      profilePatch.anchor_day = String(incomeType).toLowerCase() === 'student' ? null : anchorDay;
    }
    if (fluidWindowDays !== undefined) {
      profilePatch.fluid_window_days = fluidWindowDays;
    }

    try {
      await apiRequest('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(profilePatch),
      });
    } catch (err: any) {
      throw new Error(`[KINY] Profile update failed: ${err.message}`);
    }

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
    try {
      await apiRequest('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
    } catch (err: any) {
      throw new Error(`[KINY] Profile update failed: ${err.message}`);
    }
    await get().fetchProfile();
    recalculateWealthMetrics(set, get, false);
  },

  // ── Categories ─────────────────────────────────────────────────────────────

  categories: [],

  fetchCategories: async () => {
    set(s => ({ loading: { ...s.loading, categories: true } }));
    try {
      const data = await apiRequest('/api/categories');
      set({ categories: (data as Category[]) ?? [] });
    } catch (e: any) {
      set(s => ({ errors: { ...s.errors, categories: e.message } }));
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
    const data = await apiRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify(c),
    });
    set(s => ({ categories: [...s.categories, data as Category] }));
  },

  updateCategory: async (id, patch) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      set(s => ({
        categories: s.categories.map(c => c.id === id ? { ...c, ...patch } : c)
      }));
      return;
    }
    const data = await apiRequest(`/api/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    set(s => ({ categories: s.categories.map(c => c.id === id ? (data as Category) : c) }));
  },

  deleteCategory: async (id) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      set(s => ({ categories: s.categories.filter(c => c.id !== id) }));
      return;
    }
    await apiRequest(`/api/categories/${id}`, {
      method: 'DELETE',
    });
    set(s => ({ categories: s.categories.filter(c => c.id !== id) }));
  },

  // ── Expenses ───────────────────────────────────────────────────────────────

  expenses: [],

  fetchExpenses: async () => {
    set(s => ({ loading: { ...s.loading, expenses: true } }));
    try {
      const allExpenses = await apiRequest('/api/expenses');
      const filter = get().filterMonth;
      let filtered = allExpenses;

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
        filtered = allExpenses.filter((e: Expense) => e.date >= startOfMonth && e.date < startOfNextMonth);
      }

      set({ expenses: (filtered as Expense[]) ?? [] });
    } catch (e: any) {
      set(s => ({ errors: { ...s.errors, expenses: e.message } }));
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
    const data = await apiRequest('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(e),
    });
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
    const data = await apiRequest(`/api/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    set(s => ({ expenses: s.expenses.map(e => e.id === id ? (data as Expense) : e) }));
    recalculateWealthMetrics(set, get, false);
  },

  deleteExpense: async (id) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      set(s => ({ expenses: s.expenses.filter(e => e.id !== id) }));
      recalculateWealthMetrics(set, get, false);
      return;
    }
    await apiRequest(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
    set(s => ({ expenses: s.expenses.filter(e => e.id !== id) }));
    recalculateWealthMetrics(set, get, false);
  },

  // ── Incomes ────────────────────────────────────────────────────────────────

  incomes: [],

  fetchIncomes: async () => {
    set(s => ({ loading: { ...s.loading, incomes: true } }));
    try {
      const allIncomes = await apiRequest('/api/incomes');
      const filter = get().filterMonth;
      let filtered = allIncomes;

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
        filtered = allIncomes.filter((i: Income) => i.date >= startOfMonth && i.date < startOfNextMonth);
      }

      set({ incomes: (filtered as Income[]) ?? [] });
    } catch (e: any) {
      set(s => ({ errors: { ...s.errors, incomes: e.message } }));
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
    const data = await apiRequest('/api/incomes', {
      method: 'POST',
      body: JSON.stringify(i),
    });
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
    const data = await apiRequest(`/api/incomes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    set(s => ({ incomes: s.incomes.map(i => i.id === id ? (data as Income) : i) }));
    recalculateWealthMetrics(set, get, false);
  },

  deleteIncome: async (id) => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('bypass') === 'true') {
      set(s => ({ incomes: s.incomes.filter(i => i.id !== id) }));
      recalculateWealthMetrics(set, get, false);
      return;
    }
    await apiRequest(`/api/incomes/${id}`, {
      method: 'DELETE',
    });
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
    const data = await apiRequest('/api/investments', {
      method: 'POST',
      body: JSON.stringify({ type, wealth_balance_at_click: wealthBalance }),
    });
    set(s => ({ investmentInterests: [...s.investmentInterests, data as InvestmentInterest] }));

    await apiRequest('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ has_seen_investment_nudge: true }),
    });
    await get().fetchProfile();
  },

  // ── Theme ──────────────────────────────────────────────────────────────────

  theme: 'light',

  setTheme: async (t) => {
    set({ theme: t });
    document.documentElement.dataset.theme = t;
    try {
      await apiRequest('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ theme: t }),
      });
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
      const data = await apiRequest('/api/snapshots');
      set({ monthlySnapshots: (data as MonthlySnapshot[]) ?? [] });
    } catch (err) {
      console.error('[KINY] fetchMonthlySnapshots failed:', err);
    }
  },

  // ── Dynamic Budget Slices ──────────────────────────────────────────────────
  budgetSlices: [],

  fetchBudgetSlices: async () => {
    try {
      const data = await apiRequest('/api/slices');
      set({ budgetSlices: (data as BudgetSliceRow[]) ?? [] });
    } catch (err) {
      console.error('[KINY] fetchBudgetSlices failed:', err);
    }
  },

  createBudgetSlice: async (slice) => {
    try {
      const data = await apiRequest('/api/slices', {
        method: 'POST',
        body: JSON.stringify(slice),
      });
      set(s => ({ budgetSlices: [...s.budgetSlices, data as BudgetSliceRow] }));
    } catch (err) {
      console.error('[KINY] createBudgetSlice failed:', err);
      throw err;
    }
  },

  updateBudgetSlice: async (id, patch) => {
    try {
      await apiRequest(`/api/slices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      set(s => ({
        budgetSlices: s.budgetSlices.map(item => item.id === id ? { ...item, ...patch } : item)
      }));
    } catch (err) {
      console.error('[KINY] updateBudgetSlice failed:', err);
      throw err;
    }
  },

  deleteBudgetSlice: async (id) => {
    try {
      await apiRequest(`/api/slices/${id}`, {
        method: 'DELETE',
      });
      set(s => ({
        budgetSlices: s.budgetSlices.filter(item => item.id !== id)
      }));
    } catch (err) {
      console.error('[KINY] deleteBudgetSlice failed:', err);
      throw err;
    }
  },

  upsertBudgetSlices: async (slices) => {
    try {
      await apiRequest('/api/user/slices', {
        method: 'POST',
        body: JSON.stringify({ slices })
      });
      await get().fetchBudgetSlices();
      await get().fetchProfile();
    } catch (err) {
      console.error('[KINY] upsertBudgetSlices failed:', err);
      throw err;
    }
  },

  seedDefaultBudgetSlices: async (occupation) => {
    try {
      const uid = await getUID();
      let defaults: Array<Omit<BudgetSliceRow, 'id' | 'created_at'>> = [];

      if (occupation === 'student') {
        defaults = [
          { user_id: uid, slice_name: 'Basic Needs', slice_type: 'Basic', allocated_percentage: 30 },
          { user_id: uid, slice_name: 'Handouts & Books', slice_type: 'Handout', allocated_percentage: 20 },
          { user_id: uid, slice_name: 'Feeding', slice_type: 'Feeding', allocated_percentage: 25 },
          { user_id: uid, slice_name: 'Flex Money', slice_type: 'Flex_Money', allocated_percentage: 15 },
          { user_id: uid, slice_name: 'Savings', slice_type: 'Saving', allocated_percentage: 10 }
        ];
      } else if (occupation === 'business') {
        defaults = [
          { user_id: uid, slice_name: 'Basic Needs', slice_type: 'Basic', allocated_percentage: 40 },
          { user_id: uid, slice_name: 'Feeding', slice_type: 'Feeding', allocated_percentage: 20 },
          { user_id: uid, slice_name: 'Flex Money', slice_type: 'Flex_Money', allocated_percentage: 15 },
          { user_id: uid, slice_name: 'Savings', slice_type: 'Saving', allocated_percentage: 25 }
        ];
      } else { // 'salary' default
        defaults = [
          { user_id: uid, slice_name: 'Basic Needs', slice_type: 'Basic', allocated_percentage: 50 },
          { user_id: uid, slice_name: 'Feeding', slice_type: 'Feeding', allocated_percentage: 20 },
          { user_id: uid, slice_name: 'Flex Money', slice_type: 'Flex_Money', allocated_percentage: 10 },
          { user_id: uid, slice_name: 'Savings', slice_type: 'Saving', allocated_percentage: 20 }
        ];
      }

      await apiRequest('/api/user/slices', {
        method: 'POST',
        body: JSON.stringify({ slices: defaults })
      });
      await get().fetchBudgetSlices();
    } catch (err) {
      console.error('[KINY] seedDefaultBudgetSlices failed:', err);
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
