import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';

export function MonthlyWrap() {
  const snapshots = useAppStore(s => s.monthlySnapshots);
  const isDataMasked = useAppStore(s => s.isDataMasked);

  if (!snapshots || snapshots.length === 0) return null;

  const latest = snapshots[0];
  const [year, monthStr] = latest.month_year.split('-');
  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = monthNames[monthIdx] || 'MONTH';
  const title = `${monthName}_${year}_WRAPPED`;

  const formatNaira = (amount: number) => {
    if (isDataMasked) return '••••••';
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <BentoCard hoverEffect={false} className="border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#FFFFFF] p-6 text-black dark:text-white rounded-none bg-[#F4F4F0] dark:bg-zinc-900 space-y-6">
      {/* Title Header */}
      <div className="border-b-4 border-black dark:border-white pb-4 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-black uppercase tracking-wide">
            {title}
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-gray-600 dark:text-gray-400 uppercase font-bold mt-1">
            Historical monthly financial wrap summary
          </p>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)' }} className="text-[9px] bg-black text-[#CCFF00] font-extrabold px-2 py-0.5 uppercase rounded-none border border-black shrink-0">
          ARCHIVE // LOADED
        </div>
      </div>

      {/* 2-Column Grid for Income and Expenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 p-4 rounded-none flex flex-col justify-between font-mono shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#FFFFFF]">
          <span className="text-[10px] text-gray-500 block uppercase font-bold mb-1">TOTAL_INCOME</span>
          <span className="text-lg font-black text-black dark:text-white">{formatNaira(latest.total_income)}</span>
        </div>
        <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 p-4 rounded-none flex flex-col justify-between font-mono shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#FFFFFF]">
          <span className="text-[10px] text-gray-500 block uppercase font-bold mb-1">TOTAL_SPENT</span>
          <span className="text-lg font-black text-red-500 dark:text-red-400">{formatNaira(latest.total_expense)}</span>
        </div>
      </div>

      {/* Flat Toxic Lime Callout blocks for Top Category & Savings Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-4 border-black bg-[#CCFF00] dark:bg-[#C6EF4E] p-4 text-black rounded-none flex flex-col justify-between font-mono shadow-[3px_3px_0px_0px_#000000]">
          <span className="text-[10px] text-black/60 block uppercase font-black mb-1">TOP_EXPENSE_CATEGORY</span>
          <span className="text-base font-black uppercase text-black">{latest.top_category}</span>
        </div>
        <div className="border-4 border-black bg-[#CCFF00] dark:bg-[#C6EF4E] p-4 text-black rounded-none flex flex-col justify-between font-mono shadow-[3px_3px_0px_0px_#000000]">
          <span className="text-[10px] text-black/60 block uppercase font-black mb-1">FINAL_SAVINGS_RATE</span>
          <span className="text-base font-black text-black">{latest.savings_rate.toFixed(1)}%</span>
        </div>
      </div>
    </BentoCard>
  );
}
