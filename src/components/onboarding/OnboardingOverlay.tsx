import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';
import type { Purpose, SavingsRate } from '../../store/types';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';
import { OnboardingStep2 } from './OnboardingStep2';

export function OnboardingOverlay() {
  const completeOnboarding = useAppStore(s => s.completeOnboarding);
  const profile = useAppStore(s => s.profile);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [incomeType, setIncomeType] = useState<'salary' | 'business' | 'student'>(() => {
    return (profile?.income_type as 'salary' | 'business' | 'student') || 'salary';
  });
  const [occupation, setOccupation] = useState(() => {
    if (profile?.occupation) return profile.occupation;
    if (profile?.income_type === 'student') return 'Student / Hustler';
    if (profile?.income_type === 'business') return 'Business Owner';
    return 'Salary Earner';
  });
  const [salaryStr, setSalaryStr] = useState('');
  const [purpose, setPurpose] = useState<Purpose>('clarity');
  const [savingsRate, setSavingsRate] = useState<SavingsRate>(20);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1 && !name.trim()) {
      setErrorMsg('Name is required');
      return;
    }
    if (step === 2 && !occupation.trim()) {
      setErrorMsg('Occupation is required');
      return;
    }
    if (step === 3) {
      const salaryVal = parseFloat(salaryStr);
      if (isNaN(salaryVal) || salaryVal <= 0) {
        setErrorMsg('Please enter a valid monthly salary');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setErrorMsg(null);
    setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    setErrorMsg(null);
    setSaving(true);
    try {
      const monthlySalary = parseFloat(salaryStr);
      const defaultAnchorDay = incomeType === 'salary' ? 30 : incomeType === 'student' ? 0 : null;
      const defaultFluidWindowDays = incomeType === 'business' ? 30 : null;
      await completeOnboarding(
        name.trim(),
        purpose,
        occupation.trim(),
        monthlySalary,
        purpose === 'saving' ? savingsRate : undefined,
        incomeType,
        defaultAnchorDay,
        defaultFluidWindowDays
      );
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || 'Failed to complete onboarding');
      setSaving(false);
    }
  };

  const stepsCount = 4;
  const progressPercent = (step / stepsCount) * 100;

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const direction = 1; // Slide forward animation

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)] p-4 overflow-y-auto">
      <div className="w-full max-w-[480px]">
        {/* Onboarding Header */}
        <div className="flex items-center justify-between mb-4">
          <div style={{ fontFamily: 'var(--font-display)' }} className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
            SETUP_KINY_PROFILE
          </div>
          <div style={{ fontFamily: 'var(--font-mono)' }} className="text-xs font-bold text-[var(--color-ink-muted)]">
            STEP {step}/{stepsCount}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-[var(--color-surface)] border-[var(--border-default)] rounded-full mb-6 overflow-hidden">
          <div 
            className="h-full bg-[var(--color-brand-primary)] border-r-[var(--border-default)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <BentoCard hoverEffect={false} className="relative overflow-hidden min-h-[360px] flex flex-col justify-between">
          <div className="flex-grow flex flex-col justify-center py-4">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-extrabold uppercase text-[var(--color-ink)]">
                    WHAT_IS_YOUR_NAME?
                  </h2>
                  <p style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                    Let's customize your personal finance environment.
                  </p>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  <OnboardingStep2
                    selectedId={incomeType}
                    onSelect={(id, label) => {
                      setIncomeType(id as 'salary' | 'business' | 'student');
                      setOccupation(label);
                    }}
                  />
                </motion.div>
              )}
 
              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-extrabold uppercase text-[var(--color-ink)]">
                    {incomeType === 'student' ? 'MONTHLY_ALLOWANCE?' : 'MONTHLY_SALARY?'}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                    {incomeType === 'student'
                      ? 'How much allowance, side gig cash, or average cash flow do you get in a month (₦)?'
                      : 'How much do you take home each month (after tax) in Naira (₦)?'}
                  </p>
                  <div className="relative">
                    <div 
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="absolute left-4 top-3 text-[var(--color-ink)] font-bold text-lg pointer-events-none select-none"
                    >
                      ₦
                    </div>
                    <input
                      type="number"
                      required
                      autoFocus
                      placeholder={incomeType === 'student' ? '20000' : '500000'}
                      value={salaryStr}
                      onChange={(e) => setSalaryStr(e.target.value)}
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150 text-lg"
                    />
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-extrabold uppercase text-[var(--color-ink)]">
                      SELECT_YOUR_GOAL
                    </h2>
                    <TooltipProvider>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-black bg-white text-black font-mono font-bold text-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none transition-all cursor-help"
                          >
                            ?
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center">
                          Your selection alters how the advice engine and category priorities flag your account data.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-[var(--color-ink-muted)] mb-2">
                    What is the primary objective you're using Kiny to achieve?
                  </p>

                  <div className="space-y-3">
                    {(() => {
                      const defaultPurposes = [
                        {
                          id: 'clarity' as Purpose,
                          title: 'SAPA_EARLY_WARNING_SYSTEM',
                          description: 'For tracking baseline costs so you stop asking where your money vanished to.'
                        },
                        {
                          id: 'saving' as Purpose,
                          title: 'ACTIVE_WEALTH_ENGINE',
                          description: 'Prioritizes aggressive tracking, investment nudges, and wealth multiplication.'
                        },
                        {
                          id: 'habit' as Purpose,
                          title: 'SUBSCRIPTION_URGENT_CARE',
                          description: 'Flags recurring streaming plans, hidden data leaks, and unnecessary auto-debits.'
                        }
                      ];
                      const purposes = [...defaultPurposes];
                      if (profile?.purpose && !purposes.some(p => p.id === profile.purpose)) {
                        purposes.push({
                          id: profile.purpose,
                          title: `${profile.purpose.toUpperCase()}_ENGINE`,
                          description: `Custom goal requested by profile: ${profile.purpose}`
                        });
                      }

                      return purposes.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPurpose(p.id)}
                          style={{ border: 'var(--border-default)' }}
                          className={`w-full p-4 text-left rounded-[var(--border-radius)] flex items-center justify-between transition-all duration-100 ${
                            purpose === p.id
                              ? 'bg-[var(--color-brand-primary)] text-[#000000] font-bold shadow-[var(--shadow-card)] -translate-x-[2px] -translate-y-[2px]'
                              : 'bg-[var(--color-surface)] text-[var(--color-text-main)] shadow-[var(--shadow-btn)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[var(--shadow-card)]'
                          }`}
                        >
                          <div>
                            <div style={{ fontFamily: 'var(--font-display)' }} className="text-sm uppercase font-bold text-[var(--color-text-main)]">
                              {p.title}
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-[var(--color-text-muted)] mt-1 leading-relaxed">
                              {p.description}
                            </div>
                          </div>
                          {purpose === p.id && (
                            <span className="font-bold text-xs bg-black text-[var(--color-brand-primary)] px-2 py-0.5 rounded border border-black">
                              ACTIVE
                            </span>
                          )}
                        </button>
                      ));
                    })()}
                  </div>

                  {purpose === 'saving' && (
                    <div className="pt-2 animate-[fadeIn_0.2s_ease-out]">
                      <label 
                        style={{ fontFamily: 'var(--font-mono)' }}
                        className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-2"
                      >
                        TARGET_SAVINGS_RATE (%)
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {(() => {
                          const defaultRates = [15, 20, 30, 40];
                          const rates = [...defaultRates];
                          if (profile?.target_savings_rate && !rates.includes(profile.target_savings_rate)) {
                            rates.push(profile.target_savings_rate);
                          }
                          return rates.map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => setSavingsRate(rate)}
                              style={{ fontFamily: 'var(--font-mono)' }}
                              className={`py-2 text-center text-xs font-bold border-[var(--border-default)] rounded-[var(--border-radius)] transition-all duration-100 ${savingsRate === rate ? 'bg-[var(--color-brand-primary)] text-[#000000] shadow-[var(--shadow-btn-active)] translate-x-[0.5px] translate-y-[0.5px]' : 'bg-[var(--color-surface)]'}`}
                            >
                              {rate}%
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="border-t-[var(--border-default)] border-dashed pt-4 mt-6 flex justify-between gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={saving}
                style={{ fontFamily: 'var(--font-display)' }}
                className="px-6 py-3 bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--border-default)] rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[var(--shadow-card)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-btn-active)] font-bold text-xs uppercase transition-all duration-100 disabled:opacity-50"
              >
                ← BACK
              </button>
            ) : (
              <div />
            )}

            {step < stepsCount ? (
              <button
                type="button"
                onClick={handleNext}
                style={{ fontFamily: 'var(--font-display)' }}
                className="px-6 py-3 bg-[var(--color-brand-primary)] text-[#000000] border-[var(--border-default)] rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[var(--shadow-card)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-btn-active)] font-bold text-xs uppercase transition-all duration-100"
              >
                NEXT →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                style={{ fontFamily: 'var(--font-display)' }}
                className={`
                  px-6 py-3 bg-[var(--color-brand-primary)] text-[#000000] border-[var(--border-default)] 
                  rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] hover:-translate-x-[1px] 
                  hover:-translate-y-[1px] hover:shadow-[var(--shadow-card)] active:translate-x-[1px] 
                  active:translate-y-[1px] active:shadow-[var(--shadow-btn-active)] font-bold text-xs 
                  uppercase transition-all duration-100 flex items-center gap-2
                  ${saving ? 'animate-pulse cursor-wait' : ''}
                `}
              >
                {saving ? 'SAVING...' : 'FINISH_SETUP ✓'}
              </button>
            )}
          </div>

          {/* Inline Error Alerts */}
          {errorMsg && (
            <div 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="bg-[var(--color-surface)] border-l-4 border-l-[var(--color-danger)] border-[var(--border-default)] text-[var(--color-danger)] rounded-[var(--border-radius)] p-3 text-xs font-bold mt-4"
            >
              ERROR: {errorMsg}
            </div>
          )}
        </BentoCard>
      </div>
    </div>
  );
}
