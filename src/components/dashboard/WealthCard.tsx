import { useAppStore, getCycleBoundaries } from '../../store';
import { BentoCard } from '../shared/BentoCard';
import { Eye, EyeOff } from 'lucide-react';

export function WealthCard() {
  const profile = useAppStore(s => s.profile);
  const expenses = useAppStore(s => s.expenses);
  const incomes = useAppStore(s => s.incomes);
  const isDataMasked = useAppStore(s => s.isDataMasked);
  const toggleDataMasked = useAppStore(s => s.toggleDataMasked);

  const formatNaira = (amount: number) => {
    if (isDataMasked) return '••••••';
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const currentCycle = getCycleBoundaries(profile);

  const baseSalary = parseFloat(String(profile?.estimated_monthly_salary || 0));
  const loggedIncomesSum = incomes
    .filter(i => {
      const d = new Date(i.date);
      return d >= currentCycle.startDate && d <= currentCycle.endDate;
    })
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalIncome = baseSalary + loggedIncomesSum;

  const totalExpenses = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d >= currentCycle.startDate && d <= currentCycle.endDate;
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  return (
    <BentoCard className="bg-[var(--color-primary)] text-[var(--color-ink)] w-full h-auto flex flex-col justify-between p-4 md:p-6 gap-3 hover:scale-[1.01]">
      <div>
        <div className="flex justify-between items-center mb-1">
          <h3 
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]"
          >
            NET_MONTHLY_FLOW
          </h3>
          <button
            onClick={toggleDataMasked}
            className="p-1 border border-black bg-white hover:bg-gray-100 rounded text-black transition-colors focus:outline-none flex items-center justify-center cursor-pointer active:translate-y-[1px]"
            title={isDataMasked ? "Show balances" : "Hide balances"}
            aria-label={isDataMasked ? "Show balances" : "Hide balances"}
          >
            {isDataMasked ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <span 
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-3xl font-extrabold tracking-tight mb-2 block break-words"
        >
          {formatNaira(netSavings)}
        </span>
      </div>

      <div className="w-full flex flex-col gap-1.5 border-t border-dashed border-black/20 pt-2">
        <div className="flex justify-between items-center text-[11px] font-mono">
          <span className="uppercase text-[var(--color-ink-muted)]">ESTIMATED_INCOME:</span>
          <span className="font-bold shrink-0">{formatNaira(totalIncome)}</span>
        </div>
        <div className="flex justify-between items-center text-[11px] font-mono">
          <span className="uppercase text-[var(--color-ink-muted)]">MONTH_EXPENSES:</span>
          <span className="font-bold shrink-0">{formatNaira(totalExpenses)}</span>
        </div>
        <div className="flex justify-between items-center text-[11px] font-mono">
          <span className="uppercase text-[var(--color-ink-muted)]">SAVINGS_RATE:</span>
          <span className={`font-extrabold shrink-0 ${savingsRate < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink)]'}`}>
            {savingsRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </BentoCard>
  );
}
