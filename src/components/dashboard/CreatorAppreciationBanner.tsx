import { useAppStore } from '../../store';

export function CreatorAppreciationBanner() {
  const profile = useAppStore(s => s.profile);

  if (!profile) return null;

  // Check if 30 days have passed since creation
  const createdAt = new Date(profile.created_at).getTime();
  const now = new Date().getTime();
  const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);

  // If 30 days have NOT passed, OR if they have already supported, do not show
  if (diffDays < 30 || profile.has_supported_creator) {
    return null;
  }

  return (
    <div 
      className="bg-[var(--color-surface)] text-[var(--color-text-main)] border-2 border-[var(--color-border)] shadow-[var(--shadow-neubrutalist)] p-5 rounded-[var(--border-radius)] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200"
    >
      <div className="space-y-1.5 flex-1">
        <h4 style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-extrabold uppercase tracking-wide">
          ☕ FUEL_THE_ENGINE // SUPPORT_THE_DEV
        </h4>
        <p style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-[var(--color-ink)] leading-relaxed max-w-3xl">
          Omo, you've been running your personal finance OS for over 30 days straight! If these bento grids and advice metrics have saved you from premium financial tears this month, consider tipping the creator a cold drink (Minimum ₦1,000) to keep the deployment burning bright.
        </p>
      </div>
      
      <div className="flex items-center">
        <a
          href="https://paystack.shop/pay/o5osm4vqf3"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: 'var(--font-display)' }}
          className="bg-[var(--color-brand-primary)] text-[#000000] border-2 border-[var(--color-border)] px-5 py-3 rounded-[var(--border-radius)] font-extrabold text-xs uppercase tracking-wide hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[var(--shadow-card)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-btn-active)] shadow-[var(--shadow-btn)] transition-all duration-100 whitespace-nowrap"
        >
          [ SEND_THE_CREATOR_A_DRINK ↗ ]
        </a>
      </div>
    </div>
  );
}
