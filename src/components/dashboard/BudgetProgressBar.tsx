// src/components/dashboard/BudgetProgressBar.tsx
import { motion } from 'framer-motion';

interface BudgetProgressBarProps {
  label:       string;
  spent:       number;
  limit:       number;
  progressPct: number;
}

export function BudgetProgressBar({ label, spent, limit, progressPct }: BudgetProgressBarProps) {
  const barColor =
    progressPct >= 80 ? 'bg-[var(--color-danger)]' :
    progressPct >= 60 ? 'bg-[var(--color-warn)]'   :
    'bg-[var(--color-ink)]';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink)]"
        >
          {label}
        </span>
        <span
          style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
          className="text-[10px] text-[var(--color-ink-muted)]"
        >
          ₦{Number(spent).toLocaleString('en-NG')} / ₦{Number(limit).toLocaleString('en-NG')}
        </span>
      </div>
      <div className="h-2.5 w-full bg-[var(--color-ink)]/10 border border-[var(--color-ink)] rounded-none">
        <motion.div
          className={`h-full ${barColor} rounded-none`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  );
}
