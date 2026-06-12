import { vi, describe, it, expect } from 'vitest';
import { useAppStore } from './index';

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
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: '123', amount: 100, date: '2026-06-12', vendor: 'Test', category_id: null, note: null },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'profiles') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: new Error('Column last_logged_date does not exist') })
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
    expect(useAppStore.getState().expenses[0].vendor).toBe('Test');
  });
});

