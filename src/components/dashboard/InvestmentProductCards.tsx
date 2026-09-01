import { ExternalLink } from 'lucide-react';
import { useAppStore, getCycleBoundaries } from '../../store';

interface InvestmentProduct {
  name:        string;
  description: string;
  apy:         string;
  minimum:     string;
  ctaLabel:    string;
  affiliateUrl:string;
  type:        'Stocks' | 'Mutual Funds' | 'ETFs';
}

const PRODUCTS: InvestmentProduct[] = [
  {
    name:         'Cowrywise',
    description:  'Naira mutual funds and dollar investments',
    apy:          '12–15% p.a.',
    minimum:      '₦1,000',
    ctaLabel:     'START_WITH_COWRYWISE',
    affiliateUrl: 'https://cowrywise.com?ref=kiny',
    type:         'Mutual Funds',
  },
  {
    name:         'Risevest',
    description:  'US stocks, real estate, and fixed income',
    apy:          '10–18% p.a.',
    minimum:      '$10',
    ctaLabel:     'INVEST_ON_RISEVEST',
    affiliateUrl: 'https://rise.capital?ref=kiny',
    type:         'Stocks',
  },
  {
    name:         'Bamboo',
    description:  'US and Nigerian stocks, ETFs',
    apy:          'Market rate',
    minimum:      '$20',
    ctaLabel:     'TRADE_ON_BAMBOO',
    affiliateUrl: 'https://investbamboo.com?ref=kiny',
    type:         'ETFs',
  },
];

export function InvestmentProductCards() {
  const logInvestmentInterest = useAppStore(s => s.logInvestmentInterest);
  const wealthCatIds = useAppStore(s =>
    s.categories.filter(c => c.slice === 'Wealth').map(c => c.id)
  );
  const expenses = useAppStore(s => s.expenses);
  const profile = useAppStore(s => s.profile);

  const currentCycle = getCycleBoundaries(profile);
  const wealthBalance = expenses
    .filter(e => {
      if (!wealthCatIds.includes(e.category_id ?? '')) return false;
      const d = new Date(e.date);
      return d >= currentCycle.startDate && d <= currentCycle.endDate;
    })
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const handleCTA = (product: InvestmentProduct) => {
    logInvestmentInterest(product.type, wealthBalance);
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      <p
        style={{ fontFamily: 'var(--font-mono)' }}
        className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)] dark:text-white"
      >
        WEALTH_INTELLIGENCE — RECOMMENDED_PRODUCTS
      </p>
      {PRODUCTS.map(product => (
        <div
          key={product.name}
          className="bg-[var(--color-surface)] dark:bg-zinc-800 border-2 border-[var(--color-ink)] dark:border-white rounded-[var(--border-radius)] p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p style={{ fontFamily: 'var(--font-display)' }}
                 className="font-bold text-sm text-[var(--color-ink)] dark:text-white">
                {product.name}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)' }}
                 className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 mt-0.5">
                {product.description}
              </p>
            </div>
            <span
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-[9px] bg-[#CCFF00] text-black border border-[var(--color-ink)] dark:border-white px-1.5 py-0.5 font-bold"
            >
              {product.type.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              <p style={{ fontFamily: 'var(--font-mono)' }}
                 className="text-[9px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase">
                Returns · {product.apy}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)' }}
                 className="text-[9px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase">
                Min · {product.minimum}
              </p>
            </div>
            <button
              onClick={() => handleCTA(product)}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-ink)] dark:bg-white text-[#CCFF00] dark:text-black border-2 border-[var(--color-ink)] dark:border-white rounded-[var(--border-radius)] text-[9px] font-bold uppercase hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] transition-all cursor-pointer"
            >
              {product.ctaLabel} <ExternalLink size={9} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
