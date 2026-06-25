import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';
import { PaydayAnchorSelect } from './PaydayAnchorSelect';

export function SliceManager() {
  const profile = useAppStore(s => s.profile);
  const budgetSlices = useAppStore(s => s.budgetSlices || []);
  const upsertBudgetSlices = useAppStore(s => s.upsertBudgetSlices);
  const deleteBudgetSlice = useAppStore(s => s.deleteBudgetSlice);

  const [localSlices, setLocalSlices] = useState<any[]>([]);
  const [paydayAnchor, setPaydayAnchor] = useState<number>(30);
  const [anchorSaving, setAnchorSaving] = useState(false);
  const [anchorSuccess, setAnchorSuccess] = useState<string | null>(null);
  const [anchorError, setAnchorError] = useState<string | null>(null);

  // Custom Slice Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSliceName, setNewSliceName] = useState('');
  const [newSliceType, setNewSliceType] = useState('Custom');
  const [newSlicePercent, setNewSlicePercent] = useState('10');

  const [savingMatrix, setSavingMatrix] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync profile details
  useEffect(() => {
    if (profile) {
      setPaydayAnchor(profile.anchor_day ?? 30);
    }
  }, [profile]);

  // Sync budget slices
  useEffect(() => {
    if (budgetSlices.length > 0) {
      setLocalSlices(budgetSlices);
    } else if (profile) {
      // Fallbacks
      const fallback = profile.income_type === 'student' ? [
        { id: 'temp-1', user_id: profile.id, slice_name: 'Basic Needs', slice_type: 'Basic', allocated_percentage: 30, created_at: '' },
        { id: 'temp-2', user_id: profile.id, slice_name: 'Handouts & Books', slice_type: 'Handout', allocated_percentage: 20, created_at: '' },
        { id: 'temp-3', user_id: profile.id, slice_name: 'Feeding', slice_type: 'Feeding', allocated_percentage: 25, created_at: '' },
        { id: 'temp-4', user_id: profile.id, slice_name: 'Flex Money', slice_type: 'Flex_Money', allocated_percentage: 15, created_at: '' },
        { id: 'temp-5', user_id: profile.id, slice_name: 'Savings', slice_type: 'Saving', allocated_percentage: 10, created_at: '' }
      ] : [
        { id: 'temp-1', user_id: profile.id, slice_name: 'Basic Needs', slice_type: 'Basic', allocated_percentage: 50, created_at: '' },
        { id: 'temp-2', user_id: profile.id, slice_name: 'Feeding', slice_type: 'Feeding', allocated_percentage: 20, created_at: '' },
        { id: 'temp-3', user_id: profile.id, slice_name: 'Flex Money', slice_type: 'Flex_Money', allocated_percentage: 10, created_at: '' },
        { id: 'temp-4', user_id: profile.id, slice_name: 'Savings', slice_type: 'Saving', allocated_percentage: 20, created_at: '' }
      ];
      setLocalSlices(fallback);
    }
  }, [budgetSlices, profile]);

  const handleUpdateLocalSlice = (id: string, patch: Partial<any>) => {
    setLocalSlices(prev =>
      prev.map(s => s.id === id ? { ...s, ...patch } : s)
    );
  };

  const handleAddLocalSlice = () => {
    if (!newSliceName.trim()) {
      setErrorMsg('Slice name is required.');
      return;
    }
    const pct = parseInt(newSlicePercent, 10) || 0;
    if (pct <= 0 || pct > 100) {
      setErrorMsg('Percentage must be between 1 and 100.');
      return;
    }

    const newSlice = {
      id: `temp-${Date.now()}`,
      slice_name: newSliceName.trim(),
      slice_type: newSliceType,
      allocated_percentage: pct,
      created_at: new Date().toISOString()
    };

    setLocalSlices(prev => [...prev, newSlice]);
    setNewSliceName('');
    setNewSlicePercent('10');
    setErrorMsg(null);
    setShowAddForm(false);
  };

  const handleDeleteLocalSlice = async (id: string) => {
    try {
      if (id.startsWith('temp-')) {
        setLocalSlices(prev => prev.filter(s => s.id !== id));
      } else {
        if (confirm('Are you sure you want to delete this budget slice? This will remove all associated category bounds.')) {
          await deleteBudgetSlice(id);
          setLocalSlices(prev => prev.filter(s => s.id !== id));
          setSuccessMsg('Slice deleted.');
        }
      }
    } catch (err) {
      setErrorMsg('Failed to delete slice.');
    }
  };

  const handleSaveMatrix = async () => {
    if (!navigator.onLine) {
      setErrorMsg('OFFLINE_MODE — Connect to save changes.');
      return;
    }

    const totalPercentage = localSlices.reduce((sum, s) => sum + s.allocated_percentage, 0);
    if (totalPercentage !== 100) {
      setErrorMsg(`Invalid allocation: Total percentage must sum to exactly 100% (currently ${totalPercentage}%).`);
      return;
    }

    setSavingMatrix(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await upsertBudgetSlices(localSlices);
      setSuccessMsg('FINANCIAL_ARCHITECTURE_SAVED');
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || 'Failed to save matrix.');
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleAnchorChange = async (day: number) => {
    setPaydayAnchor(day);
    setAnchorSaving(true);
    setAnchorError(null);
    setAnchorSuccess(null);
    try {
      const token = useAppStore.getState().auth.session?.access_token;
      const response = await fetch('/api/user/settings', {
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

  const totalPercentage = localSlices.reduce((sum, s) => sum + s.allocated_percentage, 0);
  const isAllocationValid = totalPercentage === 100;

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
            Configure budget slice allocations and manage custom slices.
          </p>
        </div>

        {/* Dynamic Neubrutalist Slices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {localSlices.map(slice => (
            <div 
              key={slice.id} 
              className="border-2 border-black dark:border-white p-4 bg-[var(--color-surface)] dark:bg-zinc-800 rounded-none shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <input
                    type="text"
                    value={slice.slice_name}
                    onChange={e => handleUpdateLocalSlice(slice.id, { slice_name: e.target.value })}
                    className="w-full bg-transparent font-mono font-bold outline-none uppercase text-xs text-black dark:text-white border-b-2 border-dashed border-black dark:border-white focus:border-[var(--color-brand-primary)] focus:border-solid transition-colors"
                  />
                </div>
                <div>
                  <span className="bg-black text-[#C6EF4E] dark:bg-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-black uppercase text-[9px] font-bold font-mono">
                    {slice.slice_type}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-dashed border-zinc-300 dark:border-zinc-700">
                <div className="flex items-center justify-between font-mono text-xs font-bold">
                  <span className="text-gray-500 uppercase text-[9px]">Allocation:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={slice.allocated_percentage}
                      onChange={e => handleUpdateLocalSlice(slice.id, { allocated_percentage: parseInt(e.target.value, 10) || 0 })}
                      className="w-14 bg-white dark:bg-zinc-700 border-2 border-black dark:border-white text-center font-bold font-mono text-xs text-black dark:text-white outline-none focus:bg-[#F4F4F0]"
                    />
                    <span>%</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteLocalSlice(slice.id)}
                  className="w-full py-1 text-center font-mono font-bold text-[9px] text-red-500 hover:text-white hover:bg-red-500 border border-red-500 rounded transition-all cursor-pointer uppercase"
                >
                  Delete Slice
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Validation Check */}
        <div 
          className={`p-3 border-2 border-black font-mono text-xs font-bold uppercase text-center select-none rounded ${
            isAllocationValid 
              ? 'bg-[#C6EF4E] text-black' 
              : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
          }`}
        >
          Total Allocation Sum: {totalPercentage}% {isAllocationValid ? '✓ (Valid)' : '✗ (Must equal 100%)'}
        </div>

        {/* Inline Slice Creation Form */}
        {!showAddForm ? (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 border-2 border-black dark:border-white border-dashed bg-transparent text-black dark:text-white font-mono font-bold text-xs uppercase hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer rounded"
          >
            + Add Custom Slice
          </button>
        ) : (
          <div className="border-2 border-black dark:border-white p-4 bg-[#F4F4F0] dark:bg-zinc-900 space-y-4 rounded shadow-[3px_3px_0px_0px_#000000]">
            <h4 className="font-display font-black text-xs uppercase text-black dark:text-white">
              Add Custom Slice Configuration
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-mono text-[9px] font-bold text-gray-500 uppercase mb-1">Slice Name</label>
                <input
                  type="text"
                  placeholder="e.g. Travel"
                  value={newSliceName}
                  onChange={e => setNewSliceName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white font-mono text-xs outline-none text-black dark:text-white focus:shadow-[2px_2px_0px_0px_#000000]"
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] font-bold text-gray-500 uppercase mb-1">Slice Type</label>
                <select
                  value={newSliceType}
                  onChange={e => setNewSliceType(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white font-mono text-xs outline-none font-bold uppercase text-[10px] text-black dark:text-white cursor-pointer"
                >
                  <option value="Basic" className="bg-white dark:bg-zinc-800 text-black dark:text-white">BASIC (ESSENTIALS)</option>
                  <option value="Handout" className="bg-white dark:bg-zinc-800 text-black dark:text-white">HANDOUT (EDUCATION)</option>
                  <option value="Feeding" className="bg-white dark:bg-zinc-800 text-black dark:text-white">FEEDING (FOOD)</option>
                  <option value="Flex_Money" className="bg-white dark:bg-zinc-800 text-black dark:text-white">FLEX MONEY (LIFESTYLE)</option>
                  <option value="Saving" className="bg-white dark:bg-zinc-800 text-black dark:text-white">SAVING (INVEST/WEALTH)</option>
                  <option value="Custom" className="bg-white dark:bg-zinc-800 text-black dark:text-white">CUSTOM</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-[9px] font-bold text-gray-500 uppercase mb-1">Allocation %</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newSlicePercent}
                    onChange={e => setNewSlicePercent(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white font-mono text-xs outline-none text-black dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddLocalSlice}
                      className="bg-[#C6EF4E] text-black px-4 py-2 border-2 border-black font-mono font-bold text-[10px] uppercase shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer whitespace-nowrap"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="bg-white text-black px-4 py-2 border-2 border-black font-mono font-bold text-[10px] uppercase shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[var(--color-ink)] border-dashed flex justify-between items-center">
          <span 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase font-bold"
          >
            {localSlices.length} SLICE(S) DEFINED
          </span>
          <button
            type="button"
            onClick={handleSaveMatrix}
            disabled={savingMatrix || !isAllocationValid}
            style={{ fontFamily: 'var(--font-display)' }}
            className={`
              px-5 py-2.5 bg-[var(--color-brand-primary)] text-[#000000] border-2 border-black 
              rounded-none shadow-[3px_3px_0px_0px_#000000] active:translate-x-[2px] 
              active:translate-y-[2px] active:shadow-none font-extrabold text-xs 
              uppercase transition-all duration-100 flex items-center justify-center gap-1.5 cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0
              ${savingMatrix ? 'animate-pulse cursor-wait' : ''}
            `}
          >
            {savingMatrix ? 'SAVING...' : '[ SAVE_MATRIX ]'}
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
