import { useAppStore } from '../../store';
import { useSyncStatus } from '../../hooks/useSyncStatus';

export function SyncIndicator() {
  // Initialize subscription hook
  useSyncStatus();
  
  const syncStatus = useAppStore(s => s.syncStatus);
  const lastSyncedAt = useAppStore(s => s.lastSyncedAt);

  const getStatusDetails = () => {
    switch (syncStatus) {
      case 'synced':
      case 'idle':
        return {
          label: 'SYNC_READY',
          color: '#C6EF4E',
          icon: '●',
          pulse: false
        };
      case 'syncing':
        return {
          label: 'SYNCING...',
          color: '#C6EF4E',
          icon: '⟳',
          pulse: true
        };
      case 'error':
        return {
          label: 'SYNC_ERROR',
          color: '#FF4444',
          icon: '✕',
          pulse: false
        };
      case 'offline':
        return {
          label: 'OFFLINE_MODE',
          color: '#555555',
          icon: '○',
          pulse: false
        };
      default:
        return {
          label: 'SYNC_READY',
          color: '#C6EF4E',
          icon: '●',
          pulse: false
        };
    }
  };

  const details = getStatusDetails();

  return (
    <div 
      style={{ fontFamily: 'var(--font-mono)' }}
      className="inline-flex items-center gap-2 px-3 py-1.5 border-[var(--border-default)] rounded-[var(--border-radius)] bg-[var(--color-surface)] text-[var(--color-ink)] text-xs font-bold shadow-[var(--shadow-btn-active)]"
      title={lastSyncedAt ? `Last Synced: ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Not synced yet'}
    >
      <span 
        style={{ color: details.color }}
        className={`font-extrabold ${details.pulse ? 'animate-spin inline-block origin-center' : ''}`}
      >
        {details.icon}
      </span>
      <span>{details.label}</span>
    </div>
  );
}
