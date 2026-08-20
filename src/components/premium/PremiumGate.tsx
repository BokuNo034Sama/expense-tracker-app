import { Lock }                  from 'lucide-react';
import { useAppStore }           from '../../store';
import { useUpgradeDrawer }      from './UpgradeDrawerContext';

interface PremiumGateProps {
  children:    React.ReactNode;
  feature:     string;
  description: string; // one line — what this feature does
}

export function PremiumGate({ children, feature, description }: PremiumGateProps) {
  const profile = useAppStore(s => s.profile);
  const { open } = useUpgradeDrawer();

  const isPremium =
    profile?.is_premium === true &&
    (profile?.premium_expires_at
      ? new Date(profile.premium_expires_at) > new Date()
      : false);

  // Premium user — render the real feature
  if (isPremium) return <>{children}</>;

  // Non-premium — compact teaser card, no inline payment form
  return (
    <button
      type="button"
      onClick={() => open(feature)}
      className="w-full text-left bg-[var(--color-surface)]
        border-2 border-[var(--color-ink)]/30
        rounded-[var(--border-radius)]
        shadow-[2px_2px_0px_0px_var(--color-ink)]
        hover:border-[var(--color-ink)]
        hover:shadow-[var(--shadow-card)]
        hover:-translate-x-[0.5px] hover:-translate-y-[0.5px]
        active:translate-x-[0.5px] active:translate-y-[0.5px]
        transition-all p-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 flex items-center justify-center
            bg-[var(--color-ink)]/8 border border-[var(--color-ink)]/20
            rounded-lg flex-shrink-0">
            <Lock size={12} className="text-[var(--color-ink-muted)]" />
          </div>
          <div>
            <p
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-[10px] font-bold uppercase tracking-wider
                text-[var(--color-ink)] leading-tight"
            >
              {feature}
            </p>
            <p
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-[9px] text-[var(--color-ink-muted)] mt-0.5"
            >
              {description}
            </p>
          </div>
        </div>
        <span
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-[9px] font-bold uppercase text-[var(--color-ink)]
            bg-[var(--color-primary)] border border-[var(--color-ink)]
            px-1.5 py-0.5 flex-shrink-0 ml-2"
        >
          PREMIUM
        </span>
      </div>
    </button>
  );
}
