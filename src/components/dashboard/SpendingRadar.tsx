import { useMemo } from 'react';
import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

export function SpendingRadar() {
  const expenses = useAppStore(s => s.expenses);
  const categories = useAppStore(s => s.categories);

  // Filter current month data (date prefix: "YYYY-MM")
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonthPrefix));

  const radarData = useMemo(() => {
    // Total spent this month
    const totalSpent = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Group actual spending by slice
    const sliceSpends = {
      Basic: 0,
      Family: 0,
      Wealth: 0,
      Subscription: 0
    };

    monthlyExpenses.forEach(e => {
      const cat = categories.find(c => c.id === e.category_id);
      const slice = cat?.slice || 'Family';
      if (slice in sliceSpends) {
        sliceSpends[slice as keyof typeof sliceSpends] += Number(e.amount);
      }
    });

    // Recommended percentages (e.g. 50% Basic, 25% Family, 15% Wealth, 10% Subscription)
    const recommended = {
      Basic: 50,
      Family: 25,
      Wealth: 15,
      Subscription: 10
    };

    // Map to recharts data format
    return [
      {
        subject: 'BASIC_NEEDS',
        ACTUAL: totalSpent > 0 ? Math.round((sliceSpends.Basic / totalSpent) * 100) : 0,
        TARGET: recommended.Basic,
      },
      {
        subject: 'FAMILY_LIFE',
        ACTUAL: totalSpent > 0 ? Math.round((sliceSpends.Family / totalSpent) * 100) : 0,
        TARGET: recommended.Family,
      },
      {
        subject: 'WEALTH_GROWTH',
        ACTUAL: totalSpent > 0 ? Math.round((sliceSpends.Wealth / totalSpent) * 100) : 0,
        TARGET: recommended.Wealth,
      },
      {
        subject: 'SUBSCRIPTIONS',
        ACTUAL: totalSpent > 0 ? Math.round((sliceSpends.Subscription / totalSpent) * 100) : 0,
        TARGET: recommended.Subscription,
      }
    ];
  }, [monthlyExpenses, categories]);

  if (monthlyExpenses.length === 0) {
    return (
      <BentoCard className="h-full flex flex-col justify-between">
        <div>
          <h3 
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-lg font-extrabold uppercase tracking-wide mb-4 text-[var(--color-ink)]"
          >
            SPENDING_ALLOCATION
          </h3>
          <div 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs text-[var(--color-ink-muted)] py-16 text-center uppercase"
          >
            No data recorded for spending allocation radar.
          </div>
        </div>
      </BentoCard>
    );
  }

  return (
    <BentoCard className="h-full flex flex-col justify-between">
      <div>
        <h3 
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-lg font-extrabold uppercase tracking-wide mb-4 text-[var(--color-ink)]"
        >
          SPENDING_ALLOCATION (%)
        </h3>

        <div className="h-[250px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="var(--color-ink-muted)" strokeDasharray="2 2" opacity={0.3} />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: 'var(--color-ink)', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 'bold' }} 
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fill: 'var(--color-ink-muted)', fontSize: 8, fontFamily: 'var(--font-mono)' }}
              />
              <Radar 
                name="ACTUAL_SPEND %" 
                dataKey="ACTUAL" 
                stroke="var(--color-ink)" 
                fill="var(--color-primary)" 
                fillOpacity={0.6} 
              />
              <Radar 
                name="TARGET_LIMIT %" 
                dataKey="TARGET" 
                stroke="var(--color-ink-muted)" 
                fill="#888888" 
                fillOpacity={0.15} 
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', paddingTop: '10px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </BentoCard>
  );
}
