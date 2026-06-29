import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';
import { supabase } from '../../lib/supabaseClient';

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [incomeType, setIncomeType] = useState<'salary' | 'business' | 'student'>('salary');
  const [anchorDay, setAnchorDay] = useState<number>(30);
  const [fluidWindowDays, setFluidWindowDays] = useState<number>(30);
  const [studentCycleType] = useState<'weekly' | 'custom'>('weekly');
  const [studentAnchorDay] = useState<number>(30);

  const classification = incomeType;
  const setClassification = setIncomeType;
  const paydayAnchor = anchorDay;
  const setPaydayAnchor = (val: number) => setAnchorDay(val);
  
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const signIn = useAppStore(s => s.signIn);
  const signUp = useAppStore(s => s.signUp);
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
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
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
          incomeType.toUpperCase() as any, 
          finalAnchorDay, 
          finalFluidWindowDays
        );
        setSuccessMsg('Check your email to verify your signup.');
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      const error = err as Error;
      setLocalError(error.message || 'An authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${import.meta.env.VITE_APP_URL ?? window.location.origin}/`,
        },
      });
      if (error) throw error;
      // Note: on success, Supabase redirects the browser away from this page.
      // setLoading(false) is NOT needed on the success path.
    } catch (err: any) {
      setLocalError(err.message || 'Failed to initialize Google Sign-In.');
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
                      onChange={(e) => setPaydayAnchor(parseInt(e.target.value, 10))}
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

            {/* Divider */}
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t-2 border-[var(--color-ink)] opacity-10"></div>
              <span
                style={{ fontFamily: 'var(--font-mono)' }}
                className="flex-shrink mx-4 text-[10px] font-bold text-[var(--color-ink-muted)] uppercase tracking-widest"
              >
                OR
              </span>
              <div className="flex-grow border-t-2 border-[var(--color-ink)] opacity-10"></div>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full py-3.5 bg-white text-black border-2 border-black rounded-[var(--border-radius)] shadow-[2px_2px_0px_0px_#000000] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_#000000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none font-bold text-xs uppercase tracking-widest transition-all duration-100 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Inline Google G SVG — no external image dependency */}
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              CONTINUE_WITH_GOOGLE
            </button>

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
              
              // Safely extract the error string context
              let rawStr = '';
              if (raw && typeof raw === 'object') {
                rawStr = (raw as any).message || JSON.stringify(raw);
              } else {
                rawStr = String(raw);
              }

              // If the stringified output is just an empty object notation, fall back gracefully
              if (rawStr === '{}' || !rawStr.trim()) {
                rawStr = 'Registration rejected by API validation middleware.';
              }

              const friendly = rawStr.toLowerCase().includes('rate limit')
                ? 'Too many attempts — please wait a few minutes.'
                : rawStr.toLowerCase().includes('credentials')
                ? 'Incorrect email or password.'
                : rawStr.toLowerCase().includes('already registered')
                ? 'An account with this email already exists.'
                : rawStr.toLowerCase().includes('network') || rawStr.toLowerCase().includes('fetch')
                ? 'Network error — check your connection.'
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
