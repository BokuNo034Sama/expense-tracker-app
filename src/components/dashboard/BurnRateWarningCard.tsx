import { useBurnRate } from '../../hooks/useBurnRate';
import { PremiumGate } from '../premium/PremiumGate';
import { AlertTriangle } from 'lucide-react';

export function BurnRateWarningCard() {
  const atRiskSlices = useBurnRate();

  return (
    <PremiumGate feature="Burn Rate Warning">
      <div className="bg-[var(--color-surface)] dark:bg-zinc-800 border-2 border-[var(--color-ink)] dark:border-white rounded-[var(--border-radius)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-amber-500" />
          <span
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)] dark:text-white"
          >
            SAPA_EARLY_WARNING
          </span>
        </div>

        {atRiskSlices.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-mono)' }}
             className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase">
            // ALL_SLICES_ON_TRACK — burn rate nominal
          </p>
        ) : (
          <div className="space-y-3">
            {atRiskSlices.map(risk => (
              <div
                key={risk.slice}
                className="border-l-4 border-red-500 pl-3 py-1"
              >
                <p style={{ fontFamily: 'var(--font-mono)' }}
                   className="text-[10px] font-bold uppercase text-[var(--color-ink)] dark:text-white mb-0.5">
                  {risk.slice.replace('_', ' ')} — SAPA_RISK
                </p>
                <p style={{ fontFamily: 'var(--font-mono)' }}
                   className="text-[9px] text-[var(--color-ink-muted)] dark:text-zinc-400">
                  At current rate: exhausted in {risk.daysRemaining} days.
                  Payday in {risk.daysUntilAnchor} days.
                </p>
                <p style={{ fontFamily: 'var(--font-mono)' }}
                   className="text-[9px] font-bold text-red-500 mt-0.5">
                  Daily burn: ₦{risk.dailyBurnRate.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PremiumGate>
  );
}
