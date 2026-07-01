import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';

interface SummaryCardProps {
  type: 'totalSpent' | 'transactions' | 'topCategory';
}

export function SummaryCard({ type }: SummaryCardProps) {
  const isDataMasked = useAppStore(s => s.isDataMasked);
  const { totalSpent, transactionCount, topCategory, topCategoryAmount } = useDashboardMetrics();

  const formatNaira = (amount: number) => {
    if (isDataMasked) return '••••••';
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const getContent = () => {
    switch (type) {
      case 'totalSpent':
        return {
          title: 'TOTAL_SPENT_THIS_MONTH',
          value: formatNaira(totalSpent),
          subText: 'Sum of all monthly logs'
        };
      case 'transactions':
        return {
          title: 'MONTHLY_LOG_COUNT',
          value: String(transactionCount),
          subText: `${transactionCount === 1 ? 'transaction' : 'transactions'} logged`
        };
      case 'topCategory':
        return {
          title: 'TOP_SPENDING_CATEGORY',
          value: topCategory.toUpperCase(),
          subText: topCategoryAmount > 0 ? `${formatNaira(topCategoryAmount)} spent` : 'No logs recorded'
        };
    }
  };

  const content = getContent();

  return (
    <BentoCard className="h-auto flex flex-col justify-between hover:scale-[1.01]">
      <div>
        <h4 
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1.5"
        >
          {content.title}
        </h4>
        <div 
          style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', minWidth: '10ch' }}
          className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] break-words inline-block"
        >
          {content.value}
        </div>
      </div>
      <div 
        style={{ fontFamily: 'var(--font-mono)' }}
        className="text-[10px] text-[var(--color-ink-muted)] font-semibold mt-4 uppercase border-t border-[var(--color-ink)] border-dashed pt-2.5"
      >
        {content.subText}
      </div>
    </BentoCard>
  );
}
