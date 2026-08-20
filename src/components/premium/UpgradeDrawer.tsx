import { motion, AnimatePresence } from 'framer-motion';
import { X }                       from 'lucide-react';
import { useState }                from 'react';
import { useUpgradeDrawer }        from './UpgradeDrawerContext';
import { useAppStore }             from '../../store';

export function UpgradeDrawer() {
  const { isOpen, openFrom, close } = useUpgradeDrawer();
  const session  = useAppStore(s => s.auth.session);
  const [plan,    setPlan]    = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const PERKS = [
    'Sapa Burn Rate Warning — see when you will go broke',
    'What-If Simulator — test spend before you commit',
    'Custom notification style',
    'Full 12-month expense history',
    'Streak restoration (1 per month)',
  ];

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payments/initiate`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ plan }),
        }
      );
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.error || 'Failed to initiate payment.');
      }
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50
              bg-[var(--color-surface)]
              border-t-2 border-[var(--color-ink)]
              rounded-t-2xl p-6"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-[var(--color-ink)]/20 rounded-full mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p
                  style={{ fontFamily: 'var(--font-display)' }}
                  className="text-lg font-bold text-[var(--color-ink)] leading-tight"
                >
                  Kiny Premium
                </p>
                {openFrom && (
                  <p
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className="text-[10px] text-[var(--color-ink-muted)] uppercase mt-0.5"
                  >
                    // Unlocks {openFrom} + more
                  </p>
                )}
              </div>
              <button
                onClick={close}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Perks list */}
            <div className="space-y-2 mb-5">
              {PERKS.map(perk => (
                <div key={perk} className="flex items-start gap-2">
                  <span className="text-[var(--color-primary)] mt-0.5 flex-shrink-0">
                    ✓
                  </span>
                  <p
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className="text-[11px] text-[var(--color-ink)] leading-relaxed"
                  >
                    {perk}
                  </p>
                </div>
              ))}
            </div>

            {/* Plan selector */}
            <div className="flex gap-2 mb-4">
              {([
                { value: 'monthly', label: '₦1,500 / month' },
                { value: 'annual',  label: '₦12,000 / year', badge: 'SAVE 33%' },
              ] as const).map(p => (
                <button
                  key={p.value}
                  onClick={() => setPlan(p.value)}
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className={`
                    flex-1 py-3 border-2 border-[var(--color-ink)]
                    rounded-[var(--border-radius)] text-xs font-bold
                    transition-all relative
                    ${plan === p.value
                      ? 'bg-[var(--color-ink)] text-[var(--color-primary)] shadow-[var(--shadow-btn)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-ink)]'
                    }
                  `}
                >
                  {p.label}
                  {'badge' in p && (
                    <span className="absolute -top-2 -right-1 bg-[var(--color-primary)] text-[var(--color-ink)] text-[8px] font-bold px-1 border border-[var(--color-ink)]">
                      {p.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={handleUpgrade}
              disabled={loading}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full py-3.5 bg-[var(--color-primary)]
                text-[var(--color-ink)] font-bold text-sm uppercase
                tracking-widest border-2 border-[var(--color-ink)]
                rounded-[var(--border-radius)]
                shadow-[4px_4px_0px_0px_var(--color-ink)]
                hover:-translate-x-[1px] hover:-translate-y-[1px]
                hover:shadow-[5px_5px_0px_0px_var(--color-ink)]
                active:translate-x-[1px] active:translate-y-[1px]
                active:shadow-[2px_2px_0px_0px_var(--color-ink)]
                transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              {loading ? 'REDIRECTING...' : 'UNLOCK_PREMIUM →'}
            </button>

            {error && (
              <p
                style={{ fontFamily: 'var(--font-mono)' }}
                className="text-[10px] text-[var(--color-danger)] font-bold mt-2 text-center"
              >
                ERROR: {error}
              </p>
            )}

            <p
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-[9px] text-[var(--color-ink-muted)] text-center mt-3"
            >
              // Cancel anytime via Paystack subscription portal
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
