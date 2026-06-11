import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';

export function WealthCard() {
  const profile = useAppStore(s => s.profile);
  const expenses = useAppStore(s => s.expenses);
  const incomes = useAppStore(s => s.incomes);

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Filter current month data (date prefix: "YYYY-MM")
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);

  const monthlyIncomeTotal = incomes
    .filter(i => i.date.startsWith(currentMonthPrefix))
    .reduce((sum, i) => sum + Number(i.amount), 0);

  // Fallback to profile monthly salary if no income logs exist this month
  const totalIncome = monthlyIncomeTotal > 0 ? monthlyIncomeTotal : (profile?.monthly_salary ? Number(profile.monthly_salary) : 0);

  const totalExpenses = expenses
    .filter(e => e.date.startsWith(currentMonthPrefix))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  return (
    <BentoCard className="bg-[var(--color-primary)] text-[var(--color-ink)] h-full flex flex-col justify-between hover:scale-[1.01]">
      <div>
        <h3 
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1"
        >
          NET_MONTHLY_FLOW
        </h3>
        <div 
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-3xl font-extrabold tracking-tight mb-4 break-words"
        >
          {formatNaira(netSavings)}
        </div>
      </div>

      <div className="space-y-2 border-t border-[var(--color-ink)] border-dashed pt-4">
        <div className="flex justify-between items-start gap-2 text-xs flex-wrap">
          <span style={{ fontFamily: 'var(--font-display)' }} className="font-semibold uppercase text-[var(--color-ink-muted)]">ESTIMATED_INCOME:</span>
          <span style={{ fontFamily: 'var(--font-mono)' }} className="font-bold shrink-0">{formatNaira(totalIncome)}</span>
        </div>
        <div className="flex justify-between items-start gap-2 text-xs flex-wrap">
          <span style={{ fontFamily: 'var(--font-display)' }} className="font-semibold uppercase text-[var(--color-ink-muted)]">MONTH_EXPENSES:</span>
          <span style={{ fontFamily: 'var(--font-mono)' }} className="font-bold shrink-0">{formatNaira(totalExpenses)}</span>
        </div>
        <div className="flex justify-between items-start gap-2 text-xs flex-wrap">
          <span style={{ fontFamily: 'var(--font-display)' }} className="font-semibold uppercase text-[var(--color-ink-muted)]">SAVINGS_RATE:</span>
          <span style={{ fontFamily: 'var(--font-mono)' }} className={`font-extrabold shrink-0 ${savingsRate < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink)]'}`}>
            {savingsRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </BentoCard>
  );
}
