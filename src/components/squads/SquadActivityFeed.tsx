import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store';
import type { SquadActivityLogItem } from '../../store/types';
import { Activity } from 'lucide-react';

interface SquadActivityFeedProps {
  squadId: string;
  squadName: string;
  onActivityEvent?: () => void;
}

export function SquadActivityFeed({ squadId, squadName, onActivityEvent }: SquadActivityFeedProps) {
  const fetchSquadActivity = useAppStore(s => s.fetchSquadActivity);
  const [activities, setActivities] = useState<SquadActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial 5 activity items
  useEffect(() => {
    let isMounted = true;
    if (!squadId) return;

    fetchSquadActivity(squadId)
      .then(items => {
        if (isMounted) {
          setActivities(items);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setActivities([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [squadId, fetchSquadActivity]);

  // Realtime subscription on squad_activity_log for this squad
  useEffect(() => {
    if (!squadId) return;

    const channel = supabase
      .channel(`squad_activity_${squadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'squad_activity_log',
          filter: `squad_id=eq.${squadId}`,
        },
        () => {
          // Re-fetch latest activities on new event
          fetchSquadActivity(squadId)
            .then(items => setActivities(items))
            .catch(() => {});

          // Trigger live roster reload
          if (onActivityEvent) {
            onActivityEvent();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [squadId, fetchSquadActivity, onActivityEvent]);

  if (loading) {
    return (
      <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded p-2 mb-3">
        <p
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-[9px] text-[var(--color-ink-muted)] dark:text-zinc-500 animate-pulse uppercase tracking-wider"
        >
          // SYNCING_SQUAD_FEED...
        </p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded p-2 mb-3">
        <p
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-[9px] text-[var(--color-ink-muted)] dark:text-zinc-500 uppercase tracking-wider"
        >
          // SQUAD_LOG_INITIALIZED · WAITING FOR ACTIVITY
        </p>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Squad live activity log"
      aria-live="polite"
      className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded p-2 mb-3 space-y-1"
    >
      <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-black/5 dark:border-white/5">
        <Activity size={10} className="text-[#C6EF4E] animate-pulse" />
        <span
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] dark:text-zinc-400"
        >
          LIVE_SYSTEM_FEED
        </span>
      </div>

      <div className="space-y-1">
        {activities.slice(0, 5).map(act => {
          const rawName = (act.name || 'A MEMBER').toUpperCase();
          let logText = `// ${rawName} PERFORMED AN ACTION`;

          if (act.event_type === 'joined') {
            logText = `// ${rawName} JOINED ${squadName.toUpperCase()}`;
          } else if (act.event_type === 'all_buckets_locked') {
            logText = `// ${rawName} LOCKED ALL BUCKETS THIS WEEK`;
          }

          return (
            <div key={act.id} className="flex items-center justify-between">
              <span
                style={{ fontFamily: 'var(--font-mono)' }}
                className="text-[9px] font-bold text-[var(--color-ink)] dark:text-zinc-300 tracking-wide"
              >
                {logText}
              </span>
              <span
                style={{ fontFamily: 'var(--font-mono)' }}
                className="text-[8px] text-[var(--color-ink-muted)] dark:text-zinc-500 whitespace-nowrap ml-2"
              >
                {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
