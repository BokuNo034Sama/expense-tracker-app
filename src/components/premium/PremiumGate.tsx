import { useAppStore } from '../../store';
import { Lock } from 'lucide-react';
import { useState } from 'react';

interface PremiumGateProps {
  children:    React.ReactNode;
  feature:     string; // display name e.g. "Burn Rate Warning"
}

export function PremiumGate({ children, feature }: PremiumGateProps) {
  const profile   = useAppStore(s => s.profile);
  const session   = useAppStore(s => s.auth.session);
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState<'monthly' | 'annual'>('monthly');

  const isPremium = profile?.is_premium === true &&
    (profile?.premium_expires_at
      ? new Date(profile.premium_expires_at) > new Date()
      : false);

  if (isPremium) return <>{children}</>;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(
        `${apiUrl}/api/payments/initiate`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ plan: tab }),
        }
      );
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (err) {
      console.error('[KINY] Upgrade error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      {/* Gate overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-surface)]/90 dark:bg-zinc-900/90 rounded-[var(--border-radius)] border-2 border-[var(--color-ink)] dark:border-white p-4 z-10">
        <Lock size={20} className="text-[var(--color-ink)] dark:text-white mb-2" />
        <p
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)] dark:text-white text-center mb-1"
        >
          PREMIUM_FEATURE
        </p>
        <p
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-[9px] text-[var(--color-ink-muted)] dark:text-zinc-400 text-center mb-4"
        >
          {feature} requires Kiny Premium
        </p>

        {/* Plan toggle */}
        <div className="flex gap-2 mb-3 w-full max-w-[200px]">
          {(['monthly', 'annual'] as const).map(p => (
            <button
              key={p}
              onClick={() => setTab(p)}
              style={{ fontFamily: 'var(--font-mono)' }}
              className={`flex-1 py-1.5 text-[9px] font-bold uppercase border-2 border-[var(--color-ink)] dark:border-white rounded transition-all cursor-pointer ${
                tab === p
                  ? 'bg-[var(--color-ink)] dark:bg-white text-[#CCFF00] dark:text-black font-extrabold'
                  : 'bg-[var(--color-surface)] dark:bg-zinc-800 text-[var(--color-ink)] dark:text-white'
              }`}
            >
              {p === 'monthly' ? '₦1.5k/mo' : '₦12k/yr'}
            </button>
          ))}
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{ fontFamily: 'var(--font-mono)' }}
          className="w-full max-w-[200px] py-2 bg-[#CCFF00] text-black border-2 border-[var(--color-ink)] dark:border-white rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] text-[10px] font-bold uppercase disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'REDIRECTING...' : 'UNLOCK_PREMIUM →'}
        </button>
      </div>
    </div>
  );
}
