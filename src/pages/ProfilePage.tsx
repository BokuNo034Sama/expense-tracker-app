import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { BentoCard } from '../components/shared/BentoCard';
import { IncomeList } from '../components/income/IncomeList';
import { Sun, Moon, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const profile = useAppStore(s => s.profile);
  const updateProfile = useAppStore(s => s.updateProfile);
  const theme = useAppStore(s => s.theme);
  const setTheme = useAppStore(s => s.setTheme);
  const signOut = useAppStore(s => s.signOut);

  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [salaryStr, setSalaryStr] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setOccupation(profile.occupation || '');
      setSalaryStr(profile.monthly_salary.toString());
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
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light').catch(console.error);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-3xl font-extrabold tracking-tight text-[var(--color-ink)] uppercase"
        >
          PROFILE_&_SETTINGS
        </h1>
        <p 
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-xs text-[var(--color-ink-muted)] uppercase mt-1"
        >
          Configure your personal OS settings and income channels
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Left Side: Profile Form */}
        <BentoCard hoverEffect={false} className="space-y-6">
          <div className="border-b border-[var(--color-ink)] border-dashed pb-3">
            <h3 
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-base font-extrabold uppercase text-[var(--color-ink)]"
            >
              PROFILE_DETAILS
            </h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Name */}
            <div>
              <label 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
              >
                USER_DISPLAY_NAME
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
              />
            </div>

            {/* Occupation */}
            <div>
              <label 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
              >
                OCCUPATION
              </label>
              <input
                type="text"
                value={occupation}
                onChange={e => setOccupation(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
              />
            </div>

            {/* Monthly Salary */}
            <div>
              <label 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
              >
                ESTIMATED_MONTHLY_SALARY (₦)
              </label>
              <input
                type="number"
                required
                value={salaryStr}
                onChange={e => setSalaryStr(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
              />
            </div>

            {/* Save Buttons & Theme Toggle inside form row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--color-ink)] border-dashed">
              <button
                type="button"
                onClick={handleThemeToggle}
                style={{ fontFamily: 'var(--font-display)' }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 border-[var(--border-default)] rounded-[var(--border-radius)] bg-[var(--color-surface)] text-[var(--color-ink)] text-xs font-bold shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-btn-active)] uppercase transition-all duration-100"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="h-3.5 w-3.5" />
                    DARK_THEME
                  </>
                ) : (
                  <>
                    <Sun className="h-3.5 w-3.5" />
                    LIGHT_THEME
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{ fontFamily: 'var(--font-display)' }}
                className={`
                  px-5 py-2.5 bg-[var(--color-ink)] text-[var(--color-primary)] border-[var(--border-default)] 
                  rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] 
                  hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-card)] active:translate-x-[0.5px] 
                  active:translate-y-[0.5px] active:shadow-[var(--shadow-btn-active)] font-extrabold text-xs 
                  uppercase transition-all duration-100 flex items-center justify-center gap-1.5
                  ${saving ? 'animate-pulse cursor-wait' : ''}
                `}
              >
                {saving ? 'SAVING...' : 'SAVE_CHANGES'}
              </button>
            </div>

            {successMsg && (
              <div 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="bg-[var(--color-primary)] text-[var(--color-ink)] border-[var(--border-default)] rounded-[var(--border-radius)] p-3 text-xs font-bold text-center uppercase"
              >
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="bg-[var(--color-surface)] border-l-4 border-l-[var(--color-danger)] border-[var(--border-default)] text-[var(--color-danger)] rounded-[var(--border-radius)] p-3 text-xs font-bold mt-4"
              >
                ERROR: {errorMsg}
              </div>
            )}
          </form>

          {/* Sign Out Card Button */}
          <div className="pt-6 border-t border-[var(--color-ink)] border-dashed flex justify-between gap-4">
            <button
              onClick={() => signOut().catch(console.error)}
              style={{ fontFamily: 'var(--font-display)' }}
              className="inline-flex items-center gap-2 px-5 py-3 border-[var(--border-default)] rounded-[var(--border-radius)] bg-transparent text-[var(--color-danger)] text-xs font-bold shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-btn-active)] uppercase transition-all duration-100"
            >
              <LogOut className="h-4 w-4" />
              SIGN_OUT_SESSION
            </button>
          </div>
        </BentoCard>

        {/* Right Side: Income Tracking */}
        <div className="space-y-6">
          <IncomeList />
        </div>
      </div>
    </div>
  );
}
