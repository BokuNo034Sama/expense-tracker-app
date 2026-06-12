import { useState } from 'react';
import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';
import type { InvestmentType } from '../../store/types';

export function InvestmentNudge() {
  const profile = useAppStore(s => s.profile);
  const logInvestmentInterest = useAppStore(s => s.logInvestmentInterest);
  const expenses = useAppStore(s => s.expenses);
  const incomes = useAppStore(s => s.incomes);
  const isDataMasked = useAppStore(s => s.isDataMasked);

  const [clickedType, setClickedType] = useState<InvestmentType | null>(null);
  const [loading, setLoading] = useState(false);

  // If already seen, don't show the nudge
  if (!profile || profile.has_seen_investment_nudge) return null;

  // Calculate wealth balance (total income - total spent overall)
  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const wealthBalance = totalIncome - totalExpenses;

  // Show nudge only if they have positive savings / wealth (> 0)
  if (wealthBalance <= 0) return null;

  const handleInterestClick = async (type: InvestmentType) => {
    setLoading(true);
    try {
      await logInvestmentInterest(type, wealthBalance);
      setClickedType(type);
    } catch (err) {
      console.error('Failed to log investment interest', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BentoCard className="p-5 relative overflow-hidden col-span-full">
      {clickedType ? (
        <div 
          style={{ fontFamily: 'var(--font-mono)' }}
          className="py-6 text-center text-xs font-bold text-[var(--color-ink)] uppercase animate-[fadeIn_0.2s_ease-out]"
        >
          ✓ INTEREST_LOGGED — Thank you! A counselor will review your preference for {clickedType}.
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-xs font-bold bg-[var(--color-brand-primary)] text-[#000000] border border-[var(--color-border)] px-2 py-0.5 rounded-full inline-block uppercase mb-1.5"
            >
              ★ WEALTH_BUILDER_INTELLIGENCE
            </h4>
            <h3 
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-sm font-extrabold uppercase text-[var(--color-ink)]"
            >
              Put your savings of {isDataMasked ? '••••••' : `₦${wealthBalance.toLocaleString()}`} to work!
            </h3>
            <p 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-[10px] text-[var(--color-ink-muted)] uppercase"
            >
              We detected net savings in your portfolio. Select a growth interest stream:
            </p>
          </div>

          <div className="flex gap-2 flex-wrap shrink-0">
            {(['Stocks', 'Mutual Funds', 'ETFs'] as InvestmentType[]).map((type) => (
              <button
                key={type}
                disabled={loading}
                onClick={() => handleInterestClick(type)}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="px-4 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-brand-primary)] hover:text-[#000000] text-[var(--color-text-main)] border-2 border-[var(--color-border)] rounded-[var(--border-radius)] text-[10px] font-bold shadow-[var(--shadow-btn)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[var(--shadow-btn-active)] uppercase transition-all duration-100 disabled:opacity-50"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}
    </BentoCard>
  );
}
