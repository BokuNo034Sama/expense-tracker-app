import { vi, describe, it, expect } from 'vitest';
import { useAppStore } from './index';

vi.mock('../lib/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
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
});
