import { useState } from 'react';
import { useAppStore } from '../../store';
import { useTipCardEligibility } from '../../hooks/useTipCardEligibility';
import { supabase } from '../../lib/supabaseClient';
import { Coffee, X } from 'lucide-react';

export function DeveloperTipCard() {
  const isEligible   = useTipCardEligibility();
  const profile      = useAppStore(s => s.profile);
  const fetchProfile = useAppStore(s => s.fetchProfile);
  const [dismissed, setDismissed] = useState(false);
  const [loading,   setLoading]   = useState(false);

  // Not eligible or dismissed this session
  if (!isEligible || dismissed) return null;

  const handleDismiss = async (permanently: boolean) => {
    setDismissed(true);
    if (!profile?.id) return;

    const uid = await supabase.auth.getUser()
      .then(r => r.data.user?.id);
    if (!uid) return;

    await supabase
      .from('profiles')
      .update({
        tip_dismissed_permanently: permanently,
        tip_last_shown_at:         new Date().toISOString(),
      })
      .eq('id', uid);

    await fetchProfile();
  };

  const handleTip = async () => {
    setLoading(true);
    // Mark as shown — open tip link
    await handleDismiss(false);
    // Open tip link
    window.open('https://paystack.com/pay/kiny-tip', '_blank', 'noopener,noreferrer');
    setLoading(false);
  };

  return (
    <div className="bg-[var(--color-surface)] border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] shadow-[var(--shadow-card)] p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Coffee size={14} className="text-[var(--color-ink)]" />
          <span
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)]"
          >
            ENJOYING_KINY?
          </span>
        </div>

        {/* Session dismiss — top right X */}
        <button
          onClick={() => setDismissed(true)}
          className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      <p
        style={{ fontFamily: 'var(--font-mono)' }}
        className="text-[10px] text-[var(--color-ink-muted)] mb-4 leading-relaxed"
      >
        You have logged 10+ expenses. If Kiny has been useful,
        consider sending the developer a drink. No pressure.
      </p>

      <div className="flex gap-2">
        {/* Primary CTA */}
        <button
          onClick={handleTip}
          disabled={loading}
          style={{ fontFamily: 'var(--font-mono)' }}
          className="flex-1 py-2 bg-[var(--color-primary)] text-[var(--color-ink)] border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] text-[10px] font-bold uppercase disabled:opacity-50 hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] transition-all cursor-pointer"
        >
          {loading ? 'OPENING...' : '☕ SEND_A_DRINK'}
        </button>

        {/* Permanent dismiss */}
        <button
          onClick={() => handleDismiss(true)}
          style={{ fontFamily: 'var(--font-mono)' }}
          className="flex-1 py-2 bg-[var(--color-surface)] text-[var(--color-ink-muted)] border-2 border-[var(--color-ink)]/30 rounded-[var(--border-radius)] text-[10px] font-bold uppercase hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition-all cursor-pointer"
        >
          NOT_NOW
        </button>
      </div>

      <p
        style={{ fontFamily: 'var(--font-mono)' }}
        className="text-[9px] text-[var(--color-ink-muted)] mt-2 text-center"
      >
        // Tapping NOT_NOW removes this permanently
      </p>
    </div>
  );
}
