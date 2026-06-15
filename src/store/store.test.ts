import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAppStore } from './index';

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
        return {};
      })
    },
    getUID: vi.fn().mockResolvedValue('test-user-id'),
  };
});

describe('useAppStore', () => {
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
  });
});

