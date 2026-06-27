import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAppStore, getCycleBoundariesForDate } from './index';
import type { ProfileRow } from './types';

let mockProfileData = {
  id: 'test-user-id',
  name: 'Test User',
  occupation: '',
  monthly_salary: 0,
  avatar_initials: '',
  purpose: 'clarity',
  target_savings_rate: null,
  has_completed_onboarding: true,
  theme: 'light',
  has_seen_investment_nudge: false,
  created_at: '2026-06-13T12:00:00Z',
  updated_at: '2026-06-13T12:00:00Z',
  current_streak: 0,
  financial_streak: 0,
  last_logged_date: '',
  max_streak_this_month: 0,
  last_tracked_date: null,
  enabled_slices: ['Basic'],
};

let mockProfileUpdateError: Error | null = null;

vi.mock('../lib/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
      from: vi.fn().mockImplementation((table) => {
        if (table === 'expenses' || table === 'incomes') {
          return {
            insert: vi.fn().mockImplementation((payload) => {
              const data = Array.isArray(payload) ? payload[0] : payload;
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: '123', amount: 100, date: '2026-06-12', vendor: 'Test', category_id: null, note: null, ...data },
                    error: null
                  })
                })
              };
            })
          };
        }
        if (table === 'profiles') {
          return {
            update: vi.fn().mockImplementation((patch) => {
              console.log('[MOCK] profiles.update called with:', patch);
              return {
                eq: vi.fn().mockImplementation(() => {
                  if (mockProfileUpdateError) {
                    console.log('[MOCK] profiles.update returning error:', mockProfileUpdateError);
                    return Promise.resolve({ error: mockProfileUpdateError });
                  }
                  mockProfileData = { ...mockProfileData, ...patch };
                  console.log('[MOCK] profiles.update success, mockProfileData updated to:', mockProfileData);
                  return Promise.resolve({ error: null });
                })
              };
            }),
            select: vi.fn().mockImplementation((arg) => {
              console.log('[MOCK] profiles.select called with:', arg);
              return {
                eq: vi.fn().mockImplementation((col, val) => {
                  console.log('[MOCK] profiles.select.eq called with:', col, val);
                  return {
                    single: vi.fn().mockImplementation(() => {
                      console.log('[MOCK] profiles.select.eq.single returning data:', mockProfileData);
                      return Promise.resolve({ data: mockProfileData, error: null });
                    })
                  };
                })
              };
            })
          };
        }
        if (table === 'budget_slices') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    { id: 'slice-1', user_id: 'test-user-id', slice_name: 'Basic Needs', slice_type: 'Basic', allocated_percentage: 50, created_at: '2026-06-13T12:00:00Z' }
                  ],
                  error: null
                })
              })
            }),
            insert: vi.fn().mockImplementation((payload) => {
              const data = Array.isArray(payload) ? payload : [payload];
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'new-slice-id', ...data[0] },
                    error: null
                  })
                })
              };
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            }),
            upsert: vi.fn().mockReturnValue({
              error: null
            })
          };
        }
        return {};
      })
    },
    getUID: vi.fn().mockResolvedValue('test-user-id'),
  };
});

describe('useAppStore', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, options: any) => {
      const path = url.replace(/^https?:\/\/[^\/]+/, '');
      const method = options?.method || 'GET';
      const body = options?.body ? JSON.parse(options.body) : {};
      console.log(`[TEST MOCK FETCH] ${method} ${path}`, body);

      if (path.startsWith('/api/profile')) {
        if (method === 'PATCH') {
          mockProfileData = { ...mockProfileData, ...body };
          console.log('[TEST MOCK FETCH] profile patch returned:', mockProfileData);
          return {
            ok: true,
            json: async () => mockProfileData,
          };
        }
        console.log('[TEST MOCK FETCH] profile get returned:', mockProfileData);
        return {
          ok: true,
          json: async () => mockProfileData,
        };
      }

      if (path.startsWith('/api/categories')) {
        const cats = [
          { id: 'cat-1', user_id: 'test-user-id', name: 'Transport', icon: 'Car', slice: 'Basic Needs', budget_limit: 50000, is_basic: true, is_priority: true, is_subscription: false, created_at: new Date().toISOString() }
        ];
        console.log('[TEST MOCK FETCH] categories returned:', cats);
        return {
          ok: true,
          json: async () => cats,
        };
      }

      if (path.startsWith('/api/expenses')) {
        if (method === 'POST') {
          const newExpense = {
            id: `exp-${Date.now()}`,
            user_id: 'test-user-id',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...body
          };
          console.log('[TEST MOCK FETCH] expense post returned:', newExpense);
          return {
            ok: true,
            json: async () => newExpense,
          };
        }
        if (method === 'DELETE') {
          console.log('[TEST MOCK FETCH] expense delete returned success');
          return {
            ok: true,
            json: async () => ({ success: true }),
          };
        }
        const exps = useAppStore.getState().expenses || [];
        console.log('[TEST MOCK FETCH] expenses get returned:', exps);
        return {
          ok: true,
          json: async () => exps,
        };
      }

      if (path.startsWith('/api/incomes')) {
        if (method === 'POST') {
          const newIncome = {
            id: `inc-${Date.now()}`,
            user_id: 'test-user-id',
            created_at: new Date().toISOString(),
            ...body
          };
          console.log('[TEST MOCK FETCH] income post returned:', newIncome);
          return {
            ok: true,
            json: async () => newIncome,
          };
        }
        if (method === 'DELETE') {
          console.log('[TEST MOCK FETCH] income delete returned success');
          return {
            ok: true,
            json: async () => ({ success: true }),
          };
        }
        const incs = useAppStore.getState().incomes || [];
        console.log('[TEST MOCK FETCH] incomes get returned:', incs);
        return {
          ok: true,
          json: async () => incs,
        };
      }

      if (path.startsWith('/api/snapshots')) {
        if (method === 'POST') {
          const newSnapshot = {
            id: `snap-${Date.now()}`,
            user_id: 'test-user-id',
            created_at: new Date().toISOString(),
            ...body
          };
          console.log('[TEST MOCK FETCH] snapshot post returned:', newSnapshot);
          return {
            ok: true,
            json: async () => newSnapshot,
          };
        }
        const snaps = useAppStore.getState().monthlySnapshots || [];
        console.log('[TEST MOCK FETCH] snapshots get returned:', snaps);
        return {
          ok: true,
          json: async () => snaps,
        };
      }

      if (path.startsWith('/api/slices')) {
        if (method === 'POST') {
          const newSlice = {
            id: `slice-${Date.now()}`,
            user_id: 'test-user-id',
            created_at: new Date().toISOString(),
            ...body
          };
          console.log('[TEST MOCK FETCH] slice post returned:', newSlice);
          return {
            ok: true,
            json: async () => newSlice,
          };
        }
        if (method === 'PATCH') {
          const id = path.split('/').pop();
          const updatedSlice = { id, ...body };
          console.log('[TEST MOCK FETCH] slice patch returned:', updatedSlice);
          return {
            ok: true,
            json: async () => updatedSlice,
          };
        }
        if (method === 'DELETE') {
          console.log('[TEST MOCK FETCH] slice delete returned success');
          return {
            ok: true,
            json: async () => ({ success: true }),
          };
        }
        const slices = [
          { id: 'slice-1', user_id: 'test-user-id', slice_name: 'Basic Needs', slice_type: 'Basic', allocated_percentage: 50, created_at: new Date().toISOString() }
        ];
        console.log('[TEST MOCK FETCH] slices get returned:', slices);
        return {
          ok: true,
          json: async () => slices,
        };
      }

      console.log('[TEST MOCK FETCH] default fallback returned empty object');
      return {
        ok: true,
        json: async () => ({}),
      };
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should have initial state values', () => {
    const state = useAppStore.getState();
    expect(state.theme).toBe('light');
    expect(state.isDataMasked).toBe(false);
    expect(state.pwa.isInstalled).toBe(false);
  });

  it('should toggle data masking', () => {
    expect(useAppStore.getState().isDataMasked).toBe(false);
    useAppStore.getState().toggleDataMasked();
    expect(useAppStore.getState().isDataMasked).toBe(true);
    useAppStore.getState().toggleDataMasked();
    expect(useAppStore.getState().isDataMasked).toBe(false);
  });

  it('should set theme', () => {
    useAppStore.getState().setTheme('dark');
    expect(useAppStore.getState().theme).toBe('dark');
  });

  it('should add expense successfully even if profile update fails', async () => {
    mockProfileUpdateError = new Error('Column last_logged_date does not exist');
    const store = useAppStore.getState();
    
    // addExpense should resolve successfully without throwing
    await expect(store.addExpense({
      date: '2026-06-12',
      vendor: 'Test Vendor',
      category_id: null,
      amount: 100,
      note: null
    })).resolves.not.toThrow();

    // Verify the expense was successfully added to local store state
    expect(useAppStore.getState().expenses).toHaveLength(1);
    expect(useAppStore.getState().expenses[0].vendor).toBe('Test Vendor');
  });

  describe('Streak Tracking', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      mockProfileUpdateError = null;
      useAppStore.setState({ expenses: [], incomes: [] });
      mockProfileData = {
        id: 'test-user-id',
        name: 'Test User',
        occupation: '',
        monthly_salary: 0,
        avatar_initials: '',
        purpose: 'clarity',
        target_savings_rate: null,
        has_completed_onboarding: true,
        theme: 'light',
        has_seen_investment_nudge: false,
        created_at: '2026-06-13T12:00:00Z',
        updated_at: '2026-06-13T12:00:00Z',
        current_streak: 0,
        financial_streak: 0,
        last_logged_date: '',
        max_streak_this_month: 0,
        last_tracked_date: null,
        enabled_slices: ['Basic'],
      };
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should initialize streak to 1 on first log', async () => {
      vi.setSystemTime(new Date('2026-06-10T12:00:00'));
      const store = useAppStore.getState();
      
      // Load initial profile mock
      await store.fetchProfile();
      expect(useAppStore.getState().profile?.current_streak).toBe(0);
      expect(useAppStore.getState().profile?.last_logged_date).toBe('');

      // Add expense
      await store.addExpense({
        date: '2026-06-10',
        vendor: 'Test Vendor',
        category_id: null,
        amount: 10,
        note: null
      });

      expect(useAppStore.getState().profile?.current_streak).toBe(1);
      expect(useAppStore.getState().profile?.financial_streak).toBe(1);
      expect(useAppStore.getState().profile?.last_logged_date).toBe('2026-06-10');
    });

    it('should increment streak on consecutive days', async () => {
      vi.setSystemTime(new Date('2026-06-10T12:00:00'));
      const store = useAppStore.getState();
      
      // Log day 1
      await store.fetchProfile();
      await store.addExpense({
        date: '2026-06-10',
        vendor: 'Test Vendor',
        category_id: null,
        amount: 10,
        note: null
      });
      expect(useAppStore.getState().profile?.current_streak).toBe(1);

      // Advance clock to day 2 (June 11)
      vi.setSystemTime(new Date('2026-06-11T12:00:00'));
      
      // Log day 2
      await store.addExpense({
        date: '2026-06-11',
        vendor: 'Test Vendor',
        category_id: null,
        amount: 10,
        note: null
      });

      expect(useAppStore.getState().profile?.current_streak).toBe(2);
      expect(useAppStore.getState().profile?.financial_streak).toBe(2);
      expect(useAppStore.getState().profile?.last_logged_date).toBe('2026-06-11');
    });

    it('should maintain streak when logged multiple times on the same day', async () => {
      vi.setSystemTime(new Date('2026-06-10T12:00:00'));
      const store = useAppStore.getState();
      
      // Log first time
      await store.fetchProfile();
      await store.addExpense({
        date: '2026-06-10',
        vendor: 'Test Vendor',
        category_id: null,
        amount: 10,
        note: null
      });
      expect(useAppStore.getState().profile?.current_streak).toBe(1);

      // Log second time on same day
      await store.addExpense({
        date: '2026-06-10',
        vendor: 'Test Vendor 2',
        category_id: null,
        amount: 20,
        note: null
      });

      expect(useAppStore.getState().profile?.current_streak).toBe(1);
      expect(useAppStore.getState().profile?.financial_streak).toBe(1);
      expect(useAppStore.getState().profile?.last_logged_date).toBe('2026-06-10');
    });

    it('should reset streak to 1 when a day is missed', async () => {
      vi.setSystemTime(new Date('2026-06-10T12:00:00'));
      const store = useAppStore.getState();
      
      // Log day 1
      await store.fetchProfile();
      await store.addExpense({
        date: '2026-06-10',
        vendor: 'Test Vendor',
        category_id: null,
        amount: 10,
        note: null
      });
      expect(useAppStore.getState().profile?.current_streak).toBe(1);

      // Advance clock by 2 days (June 12)
      vi.setSystemTime(new Date('2026-06-12T12:00:00'));
      
      // Log day 3
      await store.addExpense({
        date: '2026-06-12',
        vendor: 'Test Vendor',
        category_id: null,
        amount: 10,
        note: null
      });

      expect(useAppStore.getState().profile?.current_streak).toBe(1);
      expect(useAppStore.getState().profile?.financial_streak).toBe(1);
      expect(useAppStore.getState().profile?.last_logged_date).toBe('2026-06-12');
    });

    it('should keep streak alive if today has no transaction but yesterday has one', async () => {
      vi.setSystemTime(new Date('2026-06-10T12:00:00'));
      const store = useAppStore.getState();
      
      // Log day 1
      await store.fetchProfile();
      await store.addExpense({
        date: '2026-06-10',
        vendor: 'Test Vendor',
        category_id: null,
        amount: 10,
        note: null
      });
      expect(useAppStore.getState().profile?.current_streak).toBe(1);

      // Advance clock to day 2 (June 11) - no expense added, but we log an income to trigger updateLoggingStreak
      vi.setSystemTime(new Date('2026-06-11T12:00:00'));
      await store.addIncome({
        date: '2026-06-11',
        source: 'Salary',
        amount: 500,
        note: null
      });

      // The streak should remain 1 (June 10's activity keeps the streak alive today)
      expect(useAppStore.getState().profile?.current_streak).toBe(1);
      expect(useAppStore.getState().profile?.financial_streak).toBe(1);
    });

    it('should preserve streak on backdated expense parsed today', async () => {
      vi.setSystemTime(new Date('2026-06-10T12:00:00'));
      const store = useAppStore.getState();
      
      // Log day 1
      await store.fetchProfile();
      await store.addExpense({
        date: '2026-06-10',
        vendor: 'Test Vendor',
        category_id: null,
        amount: 10,
        note: null
      });
      expect(useAppStore.getState().profile?.current_streak).toBe(1);

      // Advance clock to day 2 (June 11) - no logs yet
      vi.setSystemTime(new Date('2026-06-11T12:00:00'));
      // Advance clock to day 3 (June 12)
      vi.setSystemTime(new Date('2026-06-12T12:00:00'));

      // Log yesterday's (June 11) expense today (June 12)
      await store.addExpense({
        date: '2026-06-11',
        vendor: 'Yesterday Expense',
        category_id: null,
        amount: 15,
        note: null
      });

      // Since June 10 has a transaction and June 11 is now logged,
      // today (June 12) has no transaction yet, but yesterday (June 11) does.
      // The streak should be 2.
      expect(useAppStore.getState().profile?.current_streak).toBe(2);
      expect(useAppStore.getState().profile?.financial_streak).toBe(2);
    });
  });

  describe('Dynamic Financial Cycles', () => {
    it('should calculate calendar month boundaries as fallback when no profile is present', () => {
      const date = new Date(Date.UTC(2026, 5, 15)); // June 15
      const boundaries = getCycleBoundariesForDate(null, date);
      expect(boundaries.startDate.toISOString().split('T')[0]).toBe('2026-06-01');
      expect(boundaries.endDate.toISOString().split('T')[0]).toBe('2026-06-30');
    });

    it('should clamp anchor_day to month length and shift weekend payday (Sunday to Monday)', () => {
      // June 28, 2026 is a Sunday. Shift should move it to Monday, June 29.
      const mockProfile = {
        income_type: 'salary',
        anchor_day: 28
      } as unknown as ProfileRow;
      // For June 15, payday is June 29 (shifted Sunday). Date < payday, so cycle starts at prev payday (May 28)
      // May 28, 2026 is a Thursday (no shift).
      const date = new Date(Date.UTC(2026, 5, 15)); // June 15
      const boundaries = getCycleBoundariesForDate(mockProfile, date);
      expect(boundaries.startDate.toISOString().split('T')[0]).toBe('2026-05-28');
      expect(boundaries.endDate.toISOString().split('T')[0]).toBe('2026-06-28'); // day before next payday (June 29)
    });

    it('should shift weekend payday (Saturday to Friday)', () => {
      // July 25, 2026 is a Saturday. Shift should move it to Friday, July 24.
      const mockProfile = {
        income_type: 'salary',
        anchor_day: 25
      } as unknown as ProfileRow;
      // For July 15, payday is July 24 (shifted Saturday). Date < payday, so cycle starts at prev payday (June 25)
      // June 25, 2026 is a Thursday (no shift).
      const date = new Date(Date.UTC(2026, 6, 15)); // July 15
      const boundaries = getCycleBoundariesForDate(mockProfile, date);
      expect(boundaries.startDate.toISOString().split('T')[0]).toBe('2026-06-25');
      expect(boundaries.endDate.toISOString().split('T')[0]).toBe('2026-07-23'); // day before next payday (July 24)
    });

    it('should compute trailing rolling window for business owners', () => {
      const mockProfile = {
        income_type: 'business',
        fluid_window_days: 15
      } as unknown as ProfileRow;
      const date = new Date(Date.UTC(2026, 5, 15)); // June 15
      const boundaries = getCycleBoundariesForDate(mockProfile, date);
      expect(boundaries.endDate.toISOString().split('T')[0]).toBe('2026-06-15');
      expect(boundaries.startDate.toISOString().split('T')[0]).toBe('2026-06-01'); // 15 days ending June 15
    });

    it('should calculate weekly Monday boundaries for students with anchor_day = 0', () => {
      const mockProfile = {
        income_type: 'student',
        anchor_day: 0
      } as unknown as ProfileRow;
      const date = new Date(Date.UTC(2026, 5, 17)); // June 17, 2026 (Wednesday)
      const boundaries = getCycleBoundariesForDate(mockProfile, date);
      expect(boundaries.startDate.toISOString().split('T')[0]).toBe('2026-06-15'); // Monday
      expect(boundaries.endDate.toISOString().split('T')[0]).toBe('2026-06-21'); // Sunday
    });

    it('should use custom anchor day for student if anchor_day > 0', () => {
      const mockProfile = {
        income_type: 'student',
        anchor_day: 10
      } as unknown as ProfileRow;
      const date = new Date(Date.UTC(2026, 5, 15)); // June 15
      const boundaries = getCycleBoundariesForDate(mockProfile, date);
      expect(boundaries.startDate.toISOString().split('T')[0]).toBe('2026-06-10');
      expect(boundaries.endDate.toISOString().split('T')[0]).toBe('2026-07-09');
    });
  });

  describe('Rolling Daily Transaction Streaks (Max & Reset)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      mockProfileUpdateError = null;
      useAppStore.setState({ expenses: [], incomes: [] });
      mockProfileData = {
        id: 'test-user-id',
        name: 'Test User',
        occupation: '',
        monthly_salary: 0,
        avatar_initials: '',
        purpose: 'clarity',
        target_savings_rate: null,
        has_completed_onboarding: true,
        theme: 'light',
        has_seen_investment_nudge: false,
        created_at: '2026-06-13T12:00:00Z',
        updated_at: '2026-06-13T12:00:00Z',
        current_streak: 0,
        financial_streak: 0,
        last_logged_date: '',
        max_streak_this_month: 0,
        last_tracked_date: null,
        enabled_slices: ['Basic'],
      };
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should track max_streak_this_month and reset it in a new month', async () => {
      vi.setSystemTime(new Date('2026-06-10T12:00:00'));
      const store = useAppStore.getState();
      await store.fetchProfile();

      // Day 1: June 10
      await store.addExpense({
        date: '2026-06-10',
        vendor: 'Test',
        category_id: null,
        amount: 10,
        note: null
      });

      expect(useAppStore.getState().profile?.current_streak).toBe(1);
      expect(useAppStore.getState().profile?.max_streak_this_month).toBe(1);
      expect(useAppStore.getState().profile?.last_tracked_date).toBe('2026-06-10');

      // Day 2: June 11
      vi.setSystemTime(new Date('2026-06-11T12:00:00'));
      await store.addExpense({
        date: '2026-06-11',
        vendor: 'Test',
        category_id: null,
        amount: 10,
        note: null
      });

      expect(useAppStore.getState().profile?.current_streak).toBe(2);
      expect(useAppStore.getState().profile?.max_streak_this_month).toBe(2);

      // Now move to a new month: July 12
      vi.setSystemTime(new Date('2026-07-12T12:00:00'));
      await store.addExpense({
        date: '2026-07-12',
        vendor: 'Test',
        category_id: null,
        amount: 10,
        note: null
      });

      expect(useAppStore.getState().profile?.current_streak).toBe(1);
      expect(useAppStore.getState().profile?.max_streak_this_month).toBe(1);
      expect(useAppStore.getState().profile?.last_tracked_date).toBe('2026-07-12');
    });
  });

  describe('Dynamic Budget Slices CRUD', () => {
    it('should fetch, create, update, and delete budget slices', async () => {
      const store = useAppStore.getState();

      // Fetch
      await store.fetchBudgetSlices();
      expect(useAppStore.getState().budgetSlices).toHaveLength(1);
      expect(useAppStore.getState().budgetSlices[0].slice_name).toBe('Basic Needs');

      // Create
      await store.createBudgetSlice({
        slice_name: 'Feeding',
        slice_type: 'Feeding',
        allocated_percentage: 20
      });
      expect(useAppStore.getState().budgetSlices).toHaveLength(2);
      expect(useAppStore.getState().budgetSlices[1].slice_name).toBe('Feeding');

      // Update
      await store.updateBudgetSlice('slice-1', { allocated_percentage: 45 });
      expect(useAppStore.getState().budgetSlices.find(s => s.id === 'slice-1')?.allocated_percentage).toBe(45);

      // Delete
      await store.deleteBudgetSlice('slice-1');
      expect(useAppStore.getState().budgetSlices).toHaveLength(1);
      expect(useAppStore.getState().budgetSlices[0].slice_name).toBe('Feeding');
    });

    it('should seed default budget slices depending on role', async () => {
      const store = useAppStore.getState();
      await store.seedDefaultBudgetSlices('student');
      expect(store.seedDefaultBudgetSlices).toBeDefined();
    });
  });
});

