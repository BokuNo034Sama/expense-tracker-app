/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { usePWA } from '../hooks/usePWA';
import { BentoCard } from '../components/shared/BentoCard';
import { IncomeList } from '../components/income/IncomeList';
import { LogOut } from 'lucide-react';
import { PaydayAnchorSelect } from '../components/profile/PaydayAnchorSelect';

export default function ProfilePage() {
  const profile = useAppStore(s => s.profile);
  const updateProfile = useAppStore(s => s.updateProfile);
  const signOut = useAppStore(s => s.signOut);
  const deferredPrompt = useAppStore(s => s.pwa.deferredPrompt);
  const setDeferredPrompt = useAppStore(s => s.setDeferredPrompt);

  const budgetSlices = useAppStore(s => s.budgetSlices || []);
  const upsertBudgetSlices = useAppStore(s => s.upsertBudgetSlices);
  const deleteBudgetSlice = useAppStore(s => s.deleteBudgetSlice);

  const { registerPushNotifications } = usePWA();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setIsSubscribing(true);
    try {
      await registerPushNotifications();
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
    } catch (err) {
      console.error('[KINY] Failed to register push notifications:', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSendTestNotification = async () => {
    if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification('KINY_OS', {
          body: 'Maintain your momentum. Log your receipts, spending, or added income for the day.',
          icon: '/logo.svg',
          badge: '/logo.svg',
          vibrate: [100, 50, 100],
          data: { dateOfArrival: Date.now() }
        } as NotificationOptions);
      } catch (err) {
        console.error('[KINY] Failed to show test notification:', err);
      }
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[KINY] Install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
  };

  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [salaryStr, setSalaryStr] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);

  const [localSlices, setLocalSlices] = useState<any[]>([]);
  const [newSliceName, setNewSliceName] = useState('');
  const [newSliceType, setNewSliceType] = useState('Custom');
  const [newSlicePercent, setNewSlicePercent] = useState('10');

  const [paydayAnchor, setPaydayAnchor] = useState<number>(30);
  const [studentCycleType, setStudentCycleType] = useState<'weekly' | 'custom'>('weekly');
  const [studentAnchorDay, setStudentAnchorDay] = useState<number>(30);

  const isProfileDirty = name !== (profile?.name || '') ||
                         occupation !== (profile?.occupation || '') ||
                         salaryStr !== (profile?.monthly_salary || 0).toString();

  const isAnchorDirty = profile?.income_type === 'student'
    ? (studentCycleType === 'weekly' ? (profile?.anchor_day !== 0) : (profile?.anchor_day !== studentAnchorDay))
    : (profile?.income_type !== 'business' && profile?.income_type !== 'FLUID_ROLLING' ? (profile?.anchor_day !== paydayAnchor) : false);

  const isDirty = isProfileDirty || isAnchorDirty;

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setOccupation(profile.occupation || '');
      setSalaryStr(profile.monthly_salary.toString());
      
      
      const anchor = profile.anchor_day ?? 30;
      setPaydayAnchor(anchor);
      if (profile.income_type === 'student') {
        if (anchor === 0) {
          setStudentCycleType('weekly');
        } else {
          setStudentCycleType('custom');
          setStudentAnchorDay(anchor);
        }
      }
    }
  }, [profile]);

  useEffect(() => {
    if (budgetSlices.length > 0) {
      setLocalSlices(budgetSlices);
    } else if (profile) {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!navigator.onLine) {
      setErrorMsg('OFFLINE_MODE — Connect to save changes.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Name is required');
      return;
    }

    const salaryVal = parseFloat(salaryStr);
    if (isNaN(salaryVal) || salaryVal < 0) {
      setErrorMsg('Salary must be a valid number');
      return;
    }

    setSaving(true);
    try {
      if (isProfileDirty) {
        // Recompute initials
        const avatarInitials = name
          .split(' ')
          .filter(Boolean)
          .map(w => w[0].toUpperCase())
          .join('')
          .slice(0, 2);

        await updateProfile({
          name: name.trim(),
          occupation: occupation.trim(),
          monthly_salary: salaryVal,
          avatar_initials: avatarInitials
        });
      }

      if (isAnchorDirty) {
        const finalAnchor = profile?.income_type === 'student'
          ? (studentCycleType === 'weekly' ? 0 : studentAnchorDay)
          : paydayAnchor;

        const token = useAppStore.getState().auth.session?.access_token;
        const response = await fetch('/api/user/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ payday_anchor_day: finalAnchor })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update payday anchor settings');
        }
      }

      setSuccessMsg('PROFILE_UPDATED_SUCCESSFULLY');
      setIsEditing(false);
      await useAppStore.getState().fetchProfile();
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
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

    setIsSavingMatrix(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await upsertBudgetSlices(localSlices);
      
      // Also update enabled_slices in profile for backwards compatibility
      const sliceNames = localSlices.map(s => s.slice_name);
      await updateProfile({
        enabled_slices: sliceNames
      });

      setSuccessMsg('FINANCIAL_ARCHITECTURE_SAVED');
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || 'Failed to save matrix.');
    } finally {
      setIsSavingMatrix(false);
    }
  };

  return (
    <div className="space-y-6 w-full py-6 text-black dark:text-white">
      {/* Profile Details Card */}
      <BentoCard hoverEffect={false} className="space-y-6 dark:bg-[#1A1A1A] border-2 border-black dark:border-white">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 border-b-2 border-dashed border-[var(--color-ink)] pb-2 mb-4">
          <h3 
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-base font-black tracking-wider uppercase break-words text-[var(--color-ink)] dark:text-white"
          >
            PROFILE_DETAILS
          </h3>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="whitespace-nowrap px-3 py-1.5 bg-[var(--color-brand-primary)] text-black border-2 border-black rounded-[var(--border-radius)] shadow-[3px_3px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-bold text-[10px] uppercase transition-all cursor-pointer self-start xs:self-auto"
            >
              Edit Profile
            </button>
          )}
        </div>

        {!isEditing ? (
          <div style={{ fontFamily: 'var(--font-mono)' }} className="space-y-4 text-xs font-bold text-[var(--color-ink)] dark:text-white">
            <div className="bg-[var(--color-surface)] dark:bg-zinc-800 p-3 border-2 border-black dark:border-white">
              <div className="text-[14px] font-black uppercase text-black dark:text-white">{name}</div>
              <div className="text-gray-500 dark:text-zinc-400 mt-1 uppercase">{occupation || 'NO OCCUPATION SET'}</div>
              <div className="mt-2 text-black dark:text-white">
                ₦{parseFloat(salaryStr || '0').toLocaleString('en-NG')} / {profile?.income_type === 'student' ? 'ALLOWANCE' : 'MONTH'}
              </div>
              {profile?.income_type === 'student' && (
                <div className="mt-2 text-black dark:text-white">
                  CYCLE RESET: {profile.anchor_day === 0 ? 'WEEKLY RESET (EVERY MONDAY)' : `FLEX ANCHOR (DAY ${profile.anchor_day})`}
                </div>
              )}
              {profile?.income_type !== 'student' && profile?.income_type !== 'business' && profile?.income_type !== 'FLUID_ROLLING' && (
                <div className="mt-2 text-black dark:text-white">
                  PAYDAY ANCHOR: DAY {profile?.anchor_day || 30}
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Name */}
            <div>
              <label 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="block text-xs font-bold tracking-wider text-[var(--color-ink)] dark:text-[#E4E4E7] uppercase mb-1.5"
              >
                USER_DISPLAY_NAME
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="w-full px-4 py-3 bg-[var(--color-surface)] dark:bg-zinc-800 border-2 border-black dark:border-white rounded-[var(--border-radius)] text-[var(--color-ink)] dark:text-white outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
              />
            </div>

            {/* Occupation */}
            <div>
              <label 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="block text-xs font-bold tracking-wider text-[var(--color-ink)] dark:text-[#E4E4E7] uppercase mb-1.5"
              >
                OCCUPATION
              </label>
              <input
                type="text"
                value={occupation}
                onChange={e => setOccupation(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="w-full px-4 py-3 bg-[var(--color-surface)] dark:bg-zinc-800 border-2 border-black dark:border-white rounded-[var(--border-radius)] text-[var(--color-ink)] dark:text-white outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
              />
            </div>

            {/* Monthly Salary / Allowance */}
            <div>
              <label 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="block text-xs font-bold tracking-wider text-[var(--color-ink)] dark:text-[#E4E4E7] uppercase mb-1.5"
              >
                {profile?.income_type === 'student' ? 'ESTIMATED_MONTHLY_ALLOWANCE (₦)' : 'ESTIMATED_MONTHLY_SALARY (₦)'}
              </label>
              <input
                type="number"
                required
                value={salaryStr}
                onChange={e => setSalaryStr(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="w-full px-4 py-3 bg-[var(--color-surface)] dark:bg-zinc-800 border-2 border-black dark:border-white rounded-[var(--border-radius)] text-[var(--color-ink)] dark:text-white outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
              />
            </div>

            {/* Payday Anchor for Salary Earners */}
            {profile?.income_type !== 'student' && profile?.income_type !== 'business' && profile?.income_type !== 'FLUID_ROLLING' && (
              <div>
                <label 
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="block text-xs font-bold tracking-wider text-[var(--color-ink)] dark:text-[#E4E4E7] uppercase mb-1.5"
                >
                  PAYDAY_ANCHOR_DAY (SALARY_CYCLE)
                </label>
                <PaydayAnchorSelect
                  value={paydayAnchor}
                  onChange={setPaydayAnchor}
                  disabled={saving}
                />
                <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1 uppercase font-bold">
                  Defines your cycle start day. Constrained strictly to days 25-31.
                </p>
              </div>
            )}

            {/* Student Cycle configuration */}
            {profile?.income_type === 'student' && (
              <div className="space-y-4">
                <div>
                  <label 
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className="block text-xs font-bold tracking-wider text-[var(--color-ink)] dark:text-[#E4E4E7] uppercase mb-1.5"
                  >
                    STUDENT_CYCLE_MODEL
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStudentCycleType('weekly')}
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className={`py-2 px-3 text-xs font-bold border-2 border-black transition-all duration-100 uppercase cursor-pointer ${
                        studentCycleType === 'weekly' 
                          ? 'bg-[#C6EF4E] text-[#000000] shadow-[2px_2px_0px_0px_#000000] translate-x-[0.5px] translate-y-[0.5px]' 
                          : 'bg-white text-black'
                      }`}
                    >
                      WEEKLY_RESET
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentCycleType('custom')}
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className={`py-2 px-3 text-xs font-bold border-2 border-black transition-all duration-100 uppercase cursor-pointer ${
                        studentCycleType === 'custom' 
                          ? 'bg-[#C6EF4E] text-[#000000] shadow-[2px_2px_0px_0px_#000000] translate-x-[0.5px] translate-y-[0.5px]' 
                          : 'bg-white text-black'
                      }`}
                    >
                      FLEX_ANCHOR
                    </button>
                  </div>
                </div>

                {studentCycleType === 'weekly' ? (
                  <div className="p-3 bg-[var(--color-surface)] border-2 border-black font-mono text-[10px] text-gray-500 uppercase leading-relaxed font-bold">
                    BUDGET_CYCLE resets every Monday. Speak directly to student pocket allowances.
                  </div>
                ) : (
                  <div>
                    <label 
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="block text-xs font-bold tracking-wider text-[var(--color-ink)] dark:text-[#E4E4E7] uppercase mb-1.5"
                    >
                      FLEX_PAYDAY_ANCHOR (1-31)
                    </label>
                    <select
                      value={studentAnchorDay}
                      onChange={(e) => setStudentAnchorDay(parseInt(e.target.value, 10))}
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="w-full px-4 py-3 bg-[var(--color-surface)] dark:bg-zinc-800 border-2 border-black dark:border-white text-[var(--color-ink)] dark:text-white outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150 font-bold font-mono"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day} className="bg-white dark:bg-zinc-800 text-black dark:text-white">
                          {day === 1 ? '1st' : day === 2 ? '2nd' : day === 3 ? '3rd' : `${day}th`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Cancel & Save Changes inside form row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--color-ink)] border-dashed">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (profile) {
                    setName(profile.name);
                    setOccupation(profile.occupation || '');
                    setSalaryStr(profile.monthly_salary.toString());
                  }
                }}
                style={{ fontFamily: 'var(--font-display)' }}
                className="px-4 py-2.5 border-2 border-black dark:border-white rounded-[var(--border-radius)] bg-[var(--color-surface)] dark:bg-zinc-800 text-[var(--color-ink)] dark:text-white text-xs font-bold shadow-[3px_3px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase transition-all duration-100 cursor-pointer"
              >
                CANCEL
              </button>

              {isDirty && (
                <button
                  type="submit"
                  disabled={saving}
                  style={{ fontFamily: 'var(--font-display)' }}
                  className={`
                    px-5 py-2.5 bg-[var(--color-brand-primary)] text-[#000000] border-2 border-black 
                    rounded-[var(--border-radius)] shadow-[3px_3px_0px_0px_#000000] active:translate-x-[2px] 
                    active:translate-y-[2px] active:shadow-none font-extrabold text-xs 
                    uppercase transition-all duration-100 flex items-center justify-center gap-1.5 cursor-pointer
                    ${saving ? 'animate-pulse cursor-wait' : ''}
                  `}
                >
                  {saving ? 'SAVING...' : 'SAVE_CHANGES'}
                </button>
              )}
            </div>

            {successMsg && (
              <div 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="bg-[#CCFF00] text-black dark:text-black font-black border-2 border-black rounded-[var(--border-radius)] p-3 text-xs text-center uppercase"
              >
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="bg-[var(--color-surface)] border-l-4 border-l-[var(--color-danger)] border-2 border-black rounded-[var(--border-radius)] p-3 text-xs font-bold mt-4"
              >
                ERROR: {errorMsg}
              </div>
            )}
          </form>
        )}

        {deferredPrompt && (
          <div className="pt-6 border-t border-[var(--color-ink)] border-dashed">
            <button
              type="button"
              onClick={handleInstallClick}
              style={{ fontFamily: 'var(--font-display)' }}
              className="w-full py-3 bg-[var(--color-brand-primary)] text-[#000000] border-2 border-black rounded-[var(--border-radius)] shadow-[3px_3px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-extrabold text-xs uppercase transition-all duration-100 flex items-center justify-center gap-2 cursor-pointer"
            >
              [ 📲 INSTALL_KINY_OS ]
            </button>
          </div>
        )}

        {/* Sign Out Card Button */}
        <div className="pt-6 border-t border-[var(--color-ink)] border-dashed flex justify-between gap-4">
          <button
            onClick={() => signOut().catch(console.error)}
            style={{ fontFamily: 'var(--font-display)' }}
            className="inline-flex items-center gap-2 px-5 py-3 border-2 border-black rounded-[var(--border-radius)] bg-transparent text-[var(--color-danger)] text-xs font-bold shadow-[3px_3px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase transition-all duration-100 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            SIGN_OUT_SESSION
          </button>
        </div>
      </BentoCard>

      {/* Income Streams List */}
      <IncomeList />

      {/* Neubrutalist Notification Configuration Card */}
      <BentoCard hoverEffect={false} className="space-y-6 dark:bg-[#1A1A1A] border-2 border-black dark:border-white">
        <div className="border-b border-[var(--color-ink)] border-dashed pb-3">
          <h3 
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-base font-extrabold uppercase text-[var(--color-ink)] dark:text-white"
          >
            🔔 NOTIFICATION_SETTINGS
          </h3>
          <p 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase mt-1"
          >
            Configure background system push reminders and streaks monitor.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-black dark:border-white bg-[var(--color-surface)] dark:bg-zinc-800 p-4 font-mono text-xs">
            <div>
              <div className="font-bold uppercase text-black dark:text-white">System Web Push Reminders</div>
              <div className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1 uppercase">
                {permissionStatus === 'granted' 
                  ? 'Status: Active and subscribed' 
                  : permissionStatus === 'denied' 
                    ? 'Status: Blocked by browser settings' 
                    : 'Status: Action required'}
              </div>
            </div>
            <div className="flex gap-2">
              {permissionStatus !== 'granted' ? (
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  disabled={permissionStatus === 'denied' || isSubscribing}
                  style={{ fontFamily: 'var(--font-display)' }}
                  className={`
                    px-4 py-2 bg-[var(--color-brand-primary)] text-black border-2 border-black 
                    rounded-[var(--border-radius)] shadow-[3px_3px_0px_0px_#000000] active:translate-x-[2px] 
                    active:translate-y-[2px] active:shadow-none font-bold text-[10px] 
                    uppercase transition-all cursor-pointer
                    ${permissionStatus === 'denied' ? 'opacity-50 cursor-not-allowed shadow-none active:translate-y-0' : ''}
                    ${isSubscribing ? 'animate-pulse' : ''}
                  `}
                >
                  {isSubscribing ? 'SUBSCRIBING...' : '[ ENABLE_PUSH ]'}
                </button>
              ) : (
                <>
                  <div className="bg-[#CCFF00] text-black border-2 border-black font-mono font-bold text-[10px] px-3 py-2 uppercase select-none flex items-center">
                    ACTIVE
                  </div>
                  <button
                    type="button"
                    onClick={handleSendTestNotification}
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="px-4 py-2 bg-white dark:bg-zinc-700 text-black dark:text-white border-2 border-black dark:border-white rounded-[var(--border-radius)] shadow-[3px_3px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-bold text-[10px] uppercase transition-all cursor-pointer"
                  >
                    [ TEST_PUSH ]
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Neubrutalist Slice Configuration Card */}
      <BentoCard hoverEffect={false} className="space-y-6 dark:bg-[#1A1A1A] border-2 border-black dark:border-white">
        <div className="border-b border-[var(--color-ink)] border-dashed pb-3">
          <h3 
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-base font-extrabold uppercase text-[var(--color-ink)] dark:text-white"
          >
            🛠_MY_FINANCIAL_ARCHITECTURE
          </h3>
          <p 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase mt-1"
          >
            Configure budget slice allocations and manage custom slices.
          </p>
        </div>

        {/* Dynamic Slices List Table */}
        <div className="space-y-3">
          <div className="border-2 border-black dark:border-white overflow-hidden bg-[var(--color-surface)] dark:bg-zinc-800">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-black dark:border-white bg-[#F4F4F0] dark:bg-zinc-900 font-bold uppercase text-[10px]">
                  <th className="p-3 border-r-2 border-black dark:border-white text-black dark:text-white">Slice Name</th>
                  <th className="p-3 border-r-2 border-black dark:border-white text-black dark:text-white">Type</th>
                  <th className="p-3 border-r-2 border-black dark:border-white w-24 text-center text-black dark:text-white">Allocated %</th>
                  <th className="p-3 w-12 text-center text-black dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {localSlices.map(slice => (
                  <tr key={slice.id} className="border-b-2 border-black dark:border-white last:border-b-0">
                    <td className="p-2 border-r-2 border-black dark:border-white">
                      <input
                        type="text"
                        value={slice.slice_name}
                        onChange={e => handleUpdateLocalSlice(slice.id, { slice_name: e.target.value })}
                        className="w-full bg-transparent p-1 font-bold outline-none uppercase text-xs text-black dark:text-white"
                      />
                    </td>
                    <td className="p-2 border-r-2 border-black dark:border-white font-bold uppercase text-[10px]">
                      <span className="bg-black text-[#C6EF4E] dark:bg-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-black uppercase">
                        {slice.slice_type}
                      </span>
                    </td>
                    <td className="p-2 border-r-2 border-black dark:border-white">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={slice.allocated_percentage}
                        onChange={e => handleUpdateLocalSlice(slice.id, { allocated_percentage: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-transparent p-1 text-center font-bold outline-none text-black dark:text-white"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteLocalSlice(slice.id)}
                        className="text-red-500 hover:text-red-700 font-black cursor-pointer uppercase text-[10px]"
                      >
                        [ Delete ]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Validation Check */}
        {(() => {
          const totalPercentage = localSlices.reduce((sum, s) => sum + s.allocated_percentage, 0);
          const isValid = totalPercentage === 100;
          return (
            <div 
              className={`p-3 border-2 border-black font-mono text-[11px] font-bold uppercase text-center select-none ${
                isValid 
                  ? 'bg-[#C6EF4E] text-black' 
                  : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
              }`}
            >
              Total Allocation Sum: {totalPercentage}% {isValid ? '✓ (Valid)' : '✗ (Must equal 100%)'}
            </div>
          );
        })()}

        {/* Inline Slice Creation Form */}
        <div className="border-2 border-black dark:border-white p-4 bg-[#F4F4F0] dark:bg-zinc-900 space-y-3">
          <h4 className="font-display font-black text-xs uppercase text-black dark:text-white">
            Add Custom Slice
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[9px] font-bold text-gray-500 uppercase mb-1">Slice Name</label>
              <input
                type="text"
                placeholder="e.g. Travel"
                value={newSliceName}
                onChange={e => setNewSliceName(e.target.value)}
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white font-mono text-xs outline-none text-black dark:text-white"
              />
            </div>
            <div>
              <label className="block font-mono text-[9px] font-bold text-gray-500 uppercase mb-1">Slice Type</label>
              <select
                value={newSliceType}
                onChange={e => setNewSliceType(e.target.value)}
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white font-mono text-xs outline-none font-bold uppercase text-[10px] text-black dark:text-white"
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
                  className="w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white font-mono text-xs outline-none text-black dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddLocalSlice}
                  className="bg-[#C6EF4E] text-black px-3 py-1.5 border-2 border-black font-mono font-bold text-[10px] uppercase shadow-[2px_2px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer whitespace-nowrap"
                >
                  [ Add ]
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--color-ink)] border-dashed flex justify-between items-center">
          <span 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase"
          >
            {localSlices.length} SLICE(S) DEFINED
          </span>
          <button
            type="button"
            onClick={handleSaveMatrix}
            disabled={isSavingMatrix}
            style={{ fontFamily: 'var(--font-display)' }}
            className={`
              px-5 py-2.5 bg-[var(--color-brand-primary)] text-[#000000] border-2 border-black 
              rounded-[var(--border-radius)] shadow-[3px_3px_0px_0px_#000000] active:translate-x-[2px] 
              active:translate-y-[2px] active:shadow-none font-extrabold text-xs 
              uppercase transition-all duration-100 flex items-center justify-center gap-1.5 cursor-pointer
              ${isSavingMatrix ? 'animate-pulse cursor-wait' : ''}
            `}
          >
            {isSavingMatrix ? 'SAVING...' : '[ SAVE_MATRIX ]'}
          </button>
        </div>
      </BentoCard>
    </div>
  );
}
