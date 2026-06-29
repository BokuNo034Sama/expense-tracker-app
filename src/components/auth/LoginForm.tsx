import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [incomeType, setIncomeType] = useState<'salary' | 'business' | 'student'>('salary');
  const [anchorDay, setAnchorDay] = useState<number>(30);
  const [fluidWindowDays, setFluidWindowDays] = useState<number>(30);
  const [studentCycleType] = useState<'weekly' | 'custom'>('weekly');
  const [studentAnchorDay] = useState<number>(30);

  const classification = incomeType;
  const setClassification = setIncomeType;
  const paydayAnchor = anchorDay;
  const setPaydayAnchor = (val: string | number) => setAnchorDay(typeof val === 'string' ? parseInt(val, 10) || 30 : val);
  
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const signIn = useAppStore(s => s.signIn);
  const signUp = useAppStore(s => s.signUp);
  const signInMagicLink = useAppStore(s => s.signInMagicLink);
  const serverError = useAppStore(s => s.errors.auth);
  const deferredPrompt = useAppStore(s => s.pwa.deferredPrompt);
  const setDeferredPrompt = useAppStore(s => s.setDeferredPrompt);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[KINY] Install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
  };

  const validate = () => {
    setLocalError(null);
    setSuccessMsg(null);
    
    if (!email.trim()) {
      setLocalError('Email is required');
      return false;
    }
    
    if (!useMagicLink) {
      if (!password) {
        setLocalError('Password is required');
        return false;
      }
      
      if (isSignUp) {
        if (password.length < 6) {
          setLocalError('Password must be at least 6 characters');
          return false;
        }
        if (password !== confirmPassword) {
          setLocalError('Passwords do not match');
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (useMagicLink) {
        await signInMagicLink(email.trim());
        setSuccessMsg('CHECK_YOUR_EMAIL — magic link sent.');
      } else {
        if (isSignUp) {
          const cleanAnchorDay = anchorDay ? parseInt(String(anchorDay).replace(/\D/g, ""), 10) : null;
          const cleanStudentAnchorDay = studentAnchorDay ? parseInt(String(studentAnchorDay).replace(/\D/g, ""), 10) : null;
          const finalAnchorDay = incomeType === 'salary'
            ? cleanAnchorDay
            : incomeType === 'student'
              ? (studentCycleType === 'weekly' ? 0 : cleanStudentAnchorDay)
              : null;
          const finalFluidWindowDays = incomeType === 'business' ? fluidWindowDays : null;

          await signUp(
            email.trim(), 
            password, 
            incomeType, 
            finalAnchorDay, 
            finalFluidWindowDays
          );
          setSuccessMsg('Check your email to verify your signup.');
        } else {
          await signIn(email.trim(), password);
        }
      }
    } catch (err) {
      const error = err as Error;
      setLocalError(error.message || 'An authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  const activeTabClass = "bg-[var(--color-brand-primary)] text-[#000000] font-bold";
  const inactiveTabClass = "bg-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4 transition-colors duration-200">
      <div className="w-full max-w-[420px]">
        {/* Logo/Wordmark */}
        <div className="flex justify-center mb-6">
          <img src="/logo.svg" alt="Kiny Logo" className="w-16 h-16 mx-auto mb-6 object-contain" />
        </div>

        <BentoCard hoverEffect={false} className="w-full">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 border-[var(--border-default)] rounded-[var(--border-radius)] overflow-hidden mb-6 bg-[var(--color-surface)]">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setUseMagicLink(false);
                setLocalError(null);
                setSuccessMsg(null);
              }}
              style={{ fontFamily: 'var(--font-display)' }}
              className={`py-3 border-r-[var(--border-default)] text-sm font-semibold tracking-wide uppercase transition-all duration-150 ${!isSignUp ? activeTabClass : inactiveTabClass}`}
            >
              LOG IN
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setUseMagicLink(false);
                setLocalError(null);
                setSuccessMsg(null);
              }}
              style={{ fontFamily: 'var(--font-display)' }}
              className={`py-3 text-sm font-semibold tracking-wide uppercase transition-all duration-150 ${isSignUp ? activeTabClass : inactiveTabClass}`}
            >
              SIGN UP
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
              >
                EMAIL_ADDRESS
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                style={{ fontFamily: 'var(--font-mono)' }}
                className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
              />
            </div>

            {/* Password Fields */}
            {!useMagicLink && (
              <>
                <div>
                  <label 
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
                  >
                    PASSWORD
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="w-full pl-4 pr-10 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label 
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
                    >
                      CONFIRM_PASSWORD
                    </label>
                    <div className="relative w-full">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ fontFamily: 'var(--font-mono)' }}
                        className="w-full pl-4 pr-10 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] focus:outline-none"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {isSignUp && (
              <div className="space-y-4 pt-2 border-t border-[var(--border-default)] border-dashed border-opacity-20">
                <div>
                  <label 
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-2"
                  >
                    USER_CLASSIFICATION
                  </label>
                  <div className="flex flex-row gap-2 w-full">
                    {(['salary', 'business', 'student'] as const).map((type) => {
                      const labels: Record<string, string> = {
                        salary: 'SALARY',
                        business: 'BUSINESS',
                        student: 'STUDENT',
                      };
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setClassification(type)}
                          style={{ fontFamily: 'var(--font-mono)' }}
                          className={`flex-1 py-2.5 px-1 border-2 border-black font-mono font-bold text-[10px] uppercase whitespace-nowrap transition-all duration-100 text-center cursor-pointer ${
                            classification === type
                              ? 'bg-[#C6EF4E] text-[#000000] shadow-[2px_2px_0px_0px_#000000] translate-x-[0.5px] translate-y-[0.5px]'
                              : 'bg-white text-black'
                          }`}
                        >
                          [ {labels[type]} ]
                        </button>
                      );
                    })}
                  </div>
                </div>

                {classification !== 'student' && classification === 'salary' && (
                  <div>
                    <label 
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
                    >
                      PAYDAY_ANCHOR_DAY (25-31)
                    </label>
                    <select
                      value={paydayAnchor}
                      onChange={(e) => setPaydayAnchor(e.target.value)}
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="w-full px-4 py-3 bg-[var(--color-surface)] border-2 border-black text-[var(--color-ink)] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all duration-150 font-bold"
                    >
                      {Array.from({ length: 7 }, (_, i) => i + 25).map((day) => (
                        <option key={day} value={day}>
                          {day}th
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {classification === 'business' && (
                  <div>
                    <label 
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
                    >
                      FLUID_WINDOW_DAYS (ROLLING WINDOW)
                    </label>
                    <select
                      value={fluidWindowDays}
                      onChange={(e) => setFluidWindowDays(parseInt(e.target.value, 10))}
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="w-full px-4 py-3 bg-[var(--color-surface)] border-2 border-black text-[var(--color-ink)] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all duration-150 font-bold uppercase text-xs"
                    >
                      <option value="7">7 DAYS WINDOW</option>
                      <option value="15">15 DAYS WINDOW</option>
                      <option value="30">30 DAYS WINDOW</option>
                      <option value="45">45 DAYS WINDOW</option>
                      <option value="60">60 DAYS WINDOW</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* CTA Button */}
            <button
              type="submit"
              disabled={loading}
              style={{ fontFamily: 'var(--font-display)' }}
              className={`
                w-full mt-6 py-4 bg-[var(--color-brand-primary)] text-[#000000] 
                border-[var(--border-default)] rounded-[var(--border-radius)] 
                shadow-[var(--shadow-btn)] hover:-translate-x-[1px] hover:-translate-y-[1px] 
                hover:shadow-[var(--shadow-card)] active:translate-x-[1px] active:translate-y-[1px] 
                active:shadow-[var(--shadow-btn-active)] font-extrabold uppercase tracking-widest 
                transition-all duration-100 flex items-center justify-center gap-2
                ${loading ? 'animate-pulse cursor-wait' : ''}
              `}
            >
              {loading ? (
                'AUTHENTICATING...'
              ) : (
                <>
                  {isSignUp ? 'REGISTER_ACCOUNT' : 'ACCESS_KINY'} <span>→</span>
                </>
              )}
            </button>

            {/* Toggle Magic Link Option (only for Log In) */}
            {!isSignUp && (
              <button
                type="button"
                onClick={() => {
                  setUseMagicLink(!useMagicLink);
                  setLocalError(null);
                  setSuccessMsg(null);
                }}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="w-full py-2.5 mt-2 bg-transparent text-[var(--color-ink)] hover:text-[var(--color-ink-muted)] border-[var(--border-default)] border-dashed rounded-[var(--border-radius)] text-xs font-bold uppercase transition-all duration-100"
              >
                {useMagicLink ? 'USE PASSWORD INSTEAD' : 'SEND MAGIC LINK'}
              </button>
            )}

            {deferredPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                style={{ fontFamily: 'var(--font-display)' }}
                className="w-full py-3 mt-4 bg-[var(--color-brand-primary)] text-[#000000] border-[var(--border-default)] rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-btn-active)] font-extrabold text-xs uppercase transition-all duration-100 flex items-center justify-center gap-2"
              >
                [ 📲 INSTALL_KINY_OS ]
              </button>
            )}

            {/* Disclaimer for Sign Up */}
            {isSignUp && (
              <p 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="text-[10px] text-[var(--color-ink-muted)] leading-relaxed text-center mt-4"
              >
                By signing up you agree to store your financial data securely on our servers.
              </p>
            )}

            {/* Success and Error messages */}
            {successMsg && (
              <div 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="bg-[var(--color-brand-primary)] text-[#000000] border-[var(--border-default)] rounded-[var(--border-radius)] p-3 text-xs font-bold text-center uppercase mt-4"
              >
                {successMsg}
              </div>
            )}

            {(localError || serverError) && (() => {
              const raw = localError || serverError || '';
              const rawStr = typeof raw === 'object' ? (raw as any).message || JSON.stringify(raw) : String(raw);
              const friendly = rawStr.toLowerCase().includes('rate limit') || rawStr.toLowerCase().includes('email rate limit')
                ? 'Too many attempts — please wait a few minutes before trying again.'
                : rawStr.toLowerCase().includes('invalid login credentials') || rawStr.toLowerCase().includes('invalid credentials')
                ? 'Incorrect email or password. Please try again.'
                : rawStr.toLowerCase().includes('user already registered') || rawStr.toLowerCase().includes('already been registered')
                ? 'An account with this email already exists. Try logging in instead.'
                : rawStr.toLowerCase().includes('email not confirmed')
                ? 'Please check your email and confirm your account first.'
                : rawStr.toLowerCase().includes('network') || rawStr.toLowerCase().includes('fetch')
                ? 'Network error — check your connection and try again.'
                : rawStr;
              return (
                <div
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="bg-[var(--color-surface)] border-l-4 border-l-[var(--color-danger)] border-[var(--border-default)] text-[var(--color-danger)] rounded-[var(--border-radius)] p-3 text-xs font-bold mt-4 break-words"
                >
                  ⚠ {friendly}
                </div>
              );
            })()}
          </form>
        </BentoCard>
      </div>
    </div>
  );
}
