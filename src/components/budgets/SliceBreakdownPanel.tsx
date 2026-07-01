// src/components/budgets/SliceBreakdownPanel.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { BudgetProgressBar } from '../dashboard/BudgetProgressBar';
import { useSliceSummary } from '../../hooks/useSliceSummary';

interface SliceBreakdownPanelProps {
  isOpen: boolean;
}

export function SliceBreakdownPanel({ isOpen }: SliceBreakdownPanelProps) {
  const sliceSummary = useSliceSummary();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="overflow-hidden"
        >
          <div className="bg-[var(--color-surface)] border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] shadow-[var(--shadow-card)] p-4 space-y-4 mt-3">
            <span
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)]"
            >
              SLICE_BREAKDOWN
            </span>
            {Object.entries(sliceSummary).map(([slice, metrics]) => (
              <BudgetProgressBar
                key={slice}
                label={slice.replace('_', ' ')}
                spent={metrics.totalSpent}
                limit={metrics.totalLimit}
                progressPct={metrics.progressPct}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
