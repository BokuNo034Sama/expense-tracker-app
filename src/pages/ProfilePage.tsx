/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { usePWA } from '../hooks/usePWA';
import { BentoCard } from '../components/shared/BentoCard';
import { IncomeList } from '../components/income/IncomeList';
import { LogOut } from 'lucide-react';

export default function ProfilePage() {
  const profile = useAppStore(s => s.profile);
  const updateProfile = useAppStore(s => s.updateProfile);
  const signOut = useAppStore(s => s.signOut);
  const deferredPrompt = useAppStore(s => s.pwa.deferredPrompt);
  const setDeferredPrompt = useAppStore(s => s.setDeferredPrompt);

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
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
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
  const [selectedSlices, setSelectedSlices] = useState<string[]>([]);
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);

  const isDirty = name !== (profile?.name || '') ||
                  occupation !== (profile?.occupation || '') ||
                  salaryStr !== (profile?.monthly_salary || 0).toString();

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setOccupation(profile.occupation || '');
      setSalaryStr(profile.monthly_salary.toString());
      setSelectedSlices(profile.enabled_slices || ['Basic', 'Family', 'Wealth', 'Subscription']);
    }
  }, [profile]);

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
      setSuccessMsg('PROFILE_UPDATED_SUCCESSFULLY');
      setIsEditing(false);
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSlice = (slice: string) => {
    setSelectedSlices(prev =>
      prev.includes(slice)
        ? prev.filter(s => s !== slice)
        : [...prev, slice]
    );
  };

  const handleSaveMatrix = async () => {
    if (!navigator.onLine) {
      setErrorMsg('OFFLINE_MODE — Connect to save changes.');
      return;
    }
    setIsSavingMatrix(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateProfile({
        enabled_slices: selectedSlices
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
              <div className="mt-2 text-black dark:text-white">₦{parseFloat(salaryStr || '0').toLocaleString('en-NG')} / MONTH</div>
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

            {/* Monthly Salary */}
            <div>
              <label 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="block text-xs font-bold tracking-wider text-[var(--color-ink)] dark:text-[#E4E4E7] uppercase mb-1.5"
              >
                ESTIMATED_MONTHLY_SALARY (₦)
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
            🛠️ MY_FINANCIAL_ARCHITECTURE
          </h3>
          <p 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase mt-1"
          >
            Enable or disable budget slice buckets in your workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {['Basic', 'Family', 'Wealth', 'Subscription', 'Chop_Life', 'Black_Tax', 'Side_Hustle'].map(slice => {
            const isChecked = selectedSlices.includes(slice);
            return (
              <label
                key={slice}
                style={{ cursor: 'pointer' }}
                className="border-2 border-black dark:border-white bg-[var(--color-surface)] dark:bg-zinc-800 text-[var(--color-text-main)] dark:text-white p-3 flex justify-between items-center font-mono text-xs select-none"
              >
                <span className="font-bold uppercase">{slice.replace('_', ' ')}</span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleSlice(slice)}
                  className="h-4 w-4 accent-black cursor-pointer"
                />
              </label>
            );
          })}
        </div>

        <div className="pt-4 border-t border-[var(--color-ink)] border-dashed flex justify-between items-center">
          <span 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase"
          >
            {selectedSlices.length} SLICE(S) ACTIVE
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
