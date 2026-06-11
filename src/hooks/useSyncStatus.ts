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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${auth.user.id}` },
        () => {
          fetchExpenses().catch(console.error);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incomes', filter: `user_id=eq.${auth.user.id}` },
        () => {
          fetchIncomes().catch(console.error);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${auth.user.id}` },
        () => {
          fetchCategories().catch(console.error);
        }
      )
      .subscribe((status) => {
        setSyncStatus(status === 'SUBSCRIBED' ? 'synced' : status === 'CHANNEL_ERROR' ? 'error' : 'syncing');
      });

    return () => {
      supabase.removeChannel(channel).catch(console.error);
    };
  }, [auth.status, auth.user?.id, setSyncStatus, fetchExpenses, fetchIncomes, fetchCategories]);
}
