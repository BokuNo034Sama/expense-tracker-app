import { create } from 'zustand';
import { supabase, getUID } from '../lib/supabaseClient';
import { SEED_CATEGORIES, applyPriorityFlags } from '../lib/seed';
import type {
  AppStore, AuthState, LoadingState, ErrorState, PWAState,
  Purpose, Theme, ProfileRow,
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

export const useAppStore = create<AppStore>()((set, get) => ({

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
      try {
        await Promise.all([
          get().fetchProfile(),
          get().fetchCategories(),
          get().fetchExpenses(),
          get().fetchIncomes(),
        ]);
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
          ]);
        } catch (err) {
          console.error('[KINY] initAuth authStateChange data fetch failed:', err);
        }
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
    if (error) {
      set(s => ({ errors: { ...s.errors, auth: error.message } }));
      throw error;
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
      
      if (error) {
        console.warn('[KINY] fetchProfile query returned error, using fallback:', error.message);
        const fallbackProfile: ProfileRow = {
          id: uid,
          name: '',
          occupation: '',
          monthly_salary: 0,
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
        };
        set({ profile: fallbackProfile, theme: 'light' });
      } else {
        set({ profile: data as any, theme: (data.theme as Theme) || 'light' });
      }
    } catch (e: any) {
      set(s => ({ errors: { ...s.errors, profile: e.message } }));
      try {
        const uid = await getUID();
        const fallbackProfile: ProfileRow = {
          id: uid,
          name: '',
          occupation: '',
          monthly_salary: 0,
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
        };
        set({ profile: fallbackProfile, theme: 'light' });
      } catch {
        set({ profile: null });
      }
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
      .update(profilePatch as any)
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
    const { error } = await supabase.from('profiles').update(patch as any).eq('id', uid);
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
      set({ categories: (data as any) ?? [] });
    } catch (e: any) {
      set(s => ({ errors: { ...s.errors, categories: e.message } }));
    } finally {
      set(s => ({ loading: { ...s.loading, categories: false } }));
    }
  },

  addCategory: async (c) => {
    const uid = await getUID();
    const { error } = await supabase.from('categories').insert({ ...c, user_id: uid } as any);
    if (error) throw new Error(error.message);
    await get().fetchCategories();
  },

  updateCategory: async (id, patch) => {
    const { error } = await supabase.from('categories').update(patch as any).eq('id', id);
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
      set({ expenses: (data as any) ?? [] });
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
      .insert({ ...e, user_id: uid } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ expenses: [data as any, ...s.expenses] }));
  },

  updateExpense: async (id, patch) => {
    const { data, error } = await supabase
      .from('expenses')
      .update(patch as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ expenses: s.expenses.map(e => e.id === id ? (data as any) : e) }));
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
      set({ incomes: (data as any) ?? [] });
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
      .insert({ ...i, user_id: uid } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ incomes: [data as any, ...s.incomes] }));
  },

  updateIncome: async (id, patch) => {
    const { data, error } = await supabase
      .from('incomes')
      .update(patch as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ incomes: s.incomes.map(i => i.id === id ? (data as any) : i) }));
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
      .insert({ type, wealth_balance_at_click: wealthBalance, user_id: uid } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(s => ({ investmentInterests: [...s.investmentInterests, data as any] }));

    // Also persist nudge-seen flag
    await supabase
      .from('profiles')
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
}));
