import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';
import { PaydayAnchorSelect } from './PaydayAnchorSelect';
import { supabase } from '../../lib/supabaseClient';

export function SliceManager() {
  const profile = useAppStore(s => s.profile);
  const budgetSlices = useAppStore(s => Array.isArray(s.budgetSlices) ? s.budgetSlices : []);
  const deleteBudgetSlice = useAppStore(s => s.deleteBudgetSlice);

  const [paydayAnchor, setPaydayAnchor] = useState<number>(30);
  const [anchorSaving, setAnchorSaving] = useState(false);
  const [anchorSuccess, setAnchorSuccess] = useState<string | null>(null);
  const [anchorError, setAnchorError] = useState<string | null>(null);

  // Custom Slice Form State
  const [newSliceName, setNewSliceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync profile details
  useEffect(() => {
    if (profile) {
      setPaydayAnchor(profile.anchor_day ?? 30);
    }
  }, [profile]);

  const handleCreateBucket = async () => {
    if (!newSliceName.trim()) {
      setErrorMsg('Slice name is required.');
      return;
    }
    const userId = profile?.id;
    if (!userId) {
      setErrorMsg('User profile is not loaded.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // PERSIST DIRECTLY TO SUPABASE
      const { error } = await supabase
        .from('budget_slices')
        .insert([
          {
            user_id: userId,
            slice_name: newSliceName.trim().toUpperCase(),
            slice_type: 'CUSTOM',
            allocated_percentage: 0
          }
        ]);

      if (error) throw error;

      setNewSliceName('');
      setSuccessMsg('BUCKET_CREATED_SUCCESSFULLY');
      // Trigger parent store layout update
      await useAppStore.getState().fetchBudgetSlices();
    } catch (err: any) {
      console.error("Failed to persist custom slice:", err.message);
      setErrorMsg(err.message || 'Failed to save slice.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlice = async (id: string) => {
    if (!navigator.onLine) {
      setErrorMsg('OFFLINE_MODE — Connect to delete slice.');
      return;
    }
    if (confirm('Are you sure you want to delete this budget slice? This will remove all associated category bounds.')) {
      setErrorMsg(null);
      setSuccessMsg(null);
      try {
        await deleteBudgetSlice(id);
        setSuccessMsg('Slice deleted.');
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to delete slice.');
      }
    }
  };

  const handleAnchorChange = async (day: number) => {
    setPaydayAnchor(day);
    setAnchorSaving(true);
    setAnchorError(null);
    setAnchorSuccess(null);
    try {
      const token = useAppStore.getState().auth.session?.access_token;
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/user/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ payday_anchor_day: day })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update payday anchor settings');
      }
      setAnchorSuccess('Payday anchor day updated successfully.');
      await useAppStore.getState().fetchProfile();
    } catch (err) {
      setAnchorError((err as Error).message || 'Failed to update anchor');
    } finally {
      setAnchorSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payday Anchor Section - Only for salary earners, hide for students */}
      {profile?.income_type === 'salary' && (
        <BentoCard hoverEffect={false} className="space-y-4 dark:bg-[#1A1A1A] border-2 border-black dark:border-white">
          <div className="border-b border-[var(--color-ink)] border-dashed pb-3">
            <h3 
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-base font-extrabold uppercase text-[var(--color-ink)] dark:text-white"
            >
              📅 SALARY_PAYDAY_ANCHOR
            </h3>
            <p 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase mt-1"
            >
              Defines your monthly financial cycle start date. Locked strictly to Days 25-31.
            </p>
          </div>

          <div className="max-w-xs space-y-2">
            <PaydayAnchorSelect
              value={paydayAnchor}
              onChange={handleAnchorChange}
              disabled={anchorSaving}
            />

            {anchorSaving && (
              <p className="text-[10px] font-mono font-bold text-gray-500 animate-pulse uppercase">
                Saving anchor settings...
              </p>
            )}

            {anchorSuccess && (
              <p className="text-[10px] font-mono font-bold text-green-600 dark:text-[#C6EF4E] uppercase">
                {anchorSuccess}
              </p>
            )}

            {anchorError && (
              <p className="text-[10px] font-mono font-bold text-red-500 uppercase">
                ERROR: {anchorError}
              </p>
            )}
          </div>
        </BentoCard>
      )}

      {/* Neubrutalist Slice Configuration Card */}
      <BentoCard hoverEffect={false} className="space-y-6 dark:bg-[#1A1A1A] border-2 border-black dark:border-white">
        <div className="border-b border-[var(--color-ink)] border-dashed pb-3">
          <h3 
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-base font-extrabold uppercase text-[var(--color-ink)] dark:text-white"
          >
            🛠️ MY_FINANCIAL_ARCHITECTURE
          </h3>
          <p 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase mt-1"
          >
            Manage custom budget slices for your account.
          </p>
        </div>

        {/* Dynamic Neubrutalist Slices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {budgetSlices.map(slice => (
            <div 
              key={slice.id} 
              className="border-2 border-black dark:border-white p-4 bg-[var(--color-surface)] dark:bg-zinc-800 rounded-none shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-mono font-bold uppercase text-xs text-black dark:text-white">
                    {slice.slice_name}
                  </span>
                </div>
                <div>
                  <span className="bg-black text-[#C6EF4E] dark:bg-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-black uppercase text-[9px] font-bold font-mono">
                    {slice.slice_type}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-zinc-300 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => handleDeleteSlice(slice.id)}
                  className="w-full py-1 text-center font-mono font-bold text-[9px] text-red-500 hover:text-white hover:bg-red-500 border border-red-500 rounded transition-all cursor-pointer uppercase"
                >
                  Delete Slice
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Clean, High-Contrast Custom Bucket Creation Manager */}
        <div className="border-2 border-black dark:border-white p-4 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] space-y-3">
          <h4 className="font-display font-black text-xs uppercase text-black dark:text-white">
            Create Custom Slice Category
          </h4>
          <input 
            type="text" 
            placeholder="ENTER CUSTOM BUCKET NAME (e.g., LAUNDRY)" 
            value={newSliceName}
            onChange={(e) => setNewSliceName(e.target.value)}
            className="w-full border-2 border-black p-3 font-mono text-xs uppercase focus:outline-none mb-3 bg-white dark:bg-zinc-800 text-black dark:text-white placeholder-gray-400"
          />
          <button 
            onClick={handleCreateBucket}
            disabled={loading}
            className="w-full bg-[#C6EF4E] border-2 border-black p-3 font-mono font-bold text-xs uppercase text-black hover:bg-[#b5dc3f] transition-colors cursor-pointer"
          >
            {loading ? '[ SAVING_BUCKET... ]' : '+ CREATE BUCKET'}
          </button>
        </div>

        {successMsg && (
          <div 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="bg-[#CCFF00] text-black font-black border-2 border-black rounded-none p-3 text-xs text-center uppercase shadow-[2px_2px_0px_0px_#000000]"
          >
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="bg-red-50 text-red-700 font-bold border-2 border-black rounded-none p-3 text-xs text-center uppercase"
          >
            ERROR: {errorMsg}
          </div>
        )}
      </BentoCard>
    </div>
  );
}
