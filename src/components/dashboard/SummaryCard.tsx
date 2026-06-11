import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';

interface SummaryCardProps {
  type: 'totalSpent' | 'transactions' | 'topCategory';
}

export function SummaryCard({ type }: SummaryCardProps) {
  const expenses = useAppStore(s => s.expenses);
  const categories = useAppStore(s => s.categories);

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Filter current month data (date prefix: "YYYY-MM")
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonthPrefix));

  const totalSpent = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const transactionsCount = monthlyExpenses.length;

  // Compute top category
  const categorySpends: { [id: string]: number } = {};
  monthlyExpenses.forEach(e => {
    if (e.category_id) {
      categorySpends[e.category_id] = (categorySpends[e.category_id] || 0) + Number(e.amount);
    }
  });

  let topCategoryId = '';
  let topCategoryAmount = 0;
  Object.entries(categorySpends).forEach(([id, amt]) => {
    if (amt > topCategoryAmount) {
      topCategoryAmount = amt;
      topCategoryId = id;
    }
  });

  const topCategoryName = categories.find(c => c.id === topCategoryId)?.name || 'None';

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
          value: String(transactionsCount),
          subText: `${transactionsCount === 1 ? 'transaction' : 'transactions'} logged`
        };
      case 'topCategory':
        return {
          title: 'TOP_SPENDING_CATEGORY',
          value: topCategoryName.toUpperCase(),
          subText: topCategoryAmount > 0 ? `${formatNaira(topCategoryAmount)} spent` : 'No logs recorded'
        };
    }
  };

  const content = getContent();

  return (
    <BentoCard className="h-full flex flex-col justify-between hover:scale-[1.01]">
      <div>
        <h4 
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1.5"
        >
          {content.title}
        </h4>
        <div 
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] break-words"
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
