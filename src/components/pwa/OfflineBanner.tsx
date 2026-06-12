import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div 
      style={{ fontFamily: 'var(--font-mono)' }}
      className="w-full bg-[var(--color-warn)] text-[#000000] border-2 border-[var(--color-border)] rounded-[var(--border-radius)] p-3 text-xs font-bold text-center uppercase tracking-wide shadow-[var(--shadow-btn-active)] mb-6 select-none animate-[slideIn_0.2s_ease-out]"
    >
      ○ OFFLINE_MODE — Data is read-only. Changes will sync when reconnected.
    </div>
  );
}
