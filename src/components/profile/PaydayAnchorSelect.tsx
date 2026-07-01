// src/components/profile/PaydayAnchorSelect.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface PaydayAnchorSelectProps {
  value:    number | null;
  onChange: (day: number) => void;
  disabled?: boolean;
}

const ANCHOR_DAYS = Array.from({ length: 7 }, (_, i) => 25 + i); // 25–31

export function PaydayAnchorSelect({ value, onChange, disabled }: PaydayAnchorSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        style={{ fontFamily: 'var(--font-mono)' }}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] text-xs font-bold uppercase text-[var(--color-ink)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{value ? `${value}${value === 1 ? 'ST' : value === 2 ? 'ND' : value === 3 ? 'RD' : 'TH'} OF MONTH` : 'SELECT PAYDAY'}</span>
        <ChevronDown size={14} />
      </button>

      {/* Bottom drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/50"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t-2 border-[var(--color-ink)] rounded-t-2xl p-6 safe-area-inset-bottom"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            >
              <div className="w-10 h-1 bg-[var(--color-ink)]/20 rounded-full mx-auto mb-6" />
              <p style={{ fontFamily: 'var(--font-mono)' }} className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] mb-4">
                SELECT_PAYDAY_ANCHOR
              </p>
              <div className="grid grid-cols-4 gap-3">
                {ANCHOR_DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => { onChange(day); setIsOpen(false); }}
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className={`py-4 text-sm font-bold border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] transition-all ${
                      value === day
                        ? 'bg-[var(--color-primary)] text-[var(--color-ink)] shadow-[var(--shadow-btn)]'
                        : 'bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-primary)]/20'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
