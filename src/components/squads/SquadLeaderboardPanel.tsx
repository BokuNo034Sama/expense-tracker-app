import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store';
import type { SquadLeaderboardData, LeaderboardMember } from '../../store/types';
import { Info, Sparkles } from 'lucide-react';

interface SquadLeaderboardPanelProps {
  squadId: string;
}

export function SquadLeaderboardPanel({ squadId }: SquadLeaderboardPanelProps) {
  const fetchSquadLeaderboard = useAppStore(s => s.fetchSquadLeaderboard);
  const [leaderboard, setLeaderboard] = useState<SquadLeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!squadId) return;

    setLoading(true);
    fetchSquadLeaderboard(squadId)
      .then(data => {
        if (isMounted) {
          setLeaderboard(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLeaderboard(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [squadId, fetchSquadLeaderboard]);

  if (loading) {
    return (
      <div className="py-6 text-center">
        <p
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-xs text-[var(--color-ink-muted)] dark:text-zinc-400 animate-pulse tracking-wider uppercase"
        >
          // COMPUTING_RANKINGS...
        </p>
      </div>
    );
  }

  if (!leaderboard || (leaderboard.ranked.length === 0 && leaderboard.unranked.length === 0)) {
    return (
      <div className="py-6 text-center">
        <p
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-xs text-[var(--color-ink-muted)] dark:text-zinc-400"
        >
          No leaderboard scores computed yet for this week.
        </p>
      </div>
    );
  }

  // Calculate week date range display
  const startDate = new Date(leaderboard.weekStartDate || new Date());
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const dateRangeStr = `WEEK OF ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} · RESETS MONDAY`;

  return (
    <div className="space-y-3">
      {/* Week Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
        <span
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-ink-muted)] dark:text-zinc-400"
        >
          {dateRangeStr}
        </span>
      </div>

      {/* Ranked Members */}
      {leaderboard.ranked.length > 0 && (
        <div className="space-y-2">
          {leaderboard.ranked.map((m: LeaderboardMember) => (
            <motion.div
              key={m.user_id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-2.5 rounded-lg border-2 transition-all ${
                m.is_self
                  ? 'bg-[#C6EF4E]/10 border-[#C6EF4E] shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]'
                  : 'bg-black/5 dark:bg-zinc-800/60 border-black/15 dark:border-white/15'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className={`text-xs font-black w-5 text-center ${
                      m.rank === 1
                        ? 'text-[#C6EF4E] bg-black px-1 rounded dark:bg-white dark:text-black'
                        : 'text-[var(--color-ink)] dark:text-white'
                    }`}
                  >
                    #{m.rank}
                  </span>
                  <div className="w-7 h-7 rounded bg-black text-[#C6EF4E] border border-black/20 flex items-center justify-center text-[10px] font-bold font-mono">
                    {m.avatar_initials || '??'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-[var(--color-ink)] dark:text-white leading-tight">
                        {m.name}
                      </p>
                      {m.is_self && (
                        <span
                          style={{ fontFamily: 'var(--font-mono)' }}
                          className="text-[9px] font-bold text-[#C6EF4E] bg-black px-1 py-0.2 rounded dark:bg-white dark:text-black"
                        >
                          YOU
                        </span>
                      )}
                      {m.all_buckets_locked && (
                        <span
                          style={{ fontFamily: 'var(--font-mono)' }}
                          className="flex items-center gap-0.5 text-[8px] font-extrabold bg-[#C6EF4E] text-black px-1.5 py-0.5 rounded shadow-sm"
                          title="Locked all buckets within limits this week"
                        >
                          <Sparkles size={8} /> ALL BUCKETS LOCKED
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-sm font-black text-[var(--color-ink)] dark:text-white">
                    {m.composite_score.toFixed(0)}
                  </span>
                  <span className="text-[9px] text-[var(--color-ink-muted)] dark:text-zinc-400 font-bold">/100</span>
                </div>
              </div>

              {/* Dual Breakdown: Consistency & Adherence with adjacent numeric text (WCAG 1.4.1) */}
              <div className="space-y-1 pt-1.5 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-[var(--color-ink-muted)] dark:text-zinc-400 w-24">
                      Consistency:
                    </span>
                    <div className="flex-1 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black dark:bg-[#C6EF4E] rounded-full"
                        style={{ width: `${(m.logging_consistency / 50) * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-[var(--color-ink)] dark:text-zinc-200 whitespace-nowrap">
                      {m.logging_consistency.toFixed(0)}/50
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono">
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-[var(--color-ink-muted)] dark:text-zinc-400 w-24">
                      Adherence:
                    </span>
                    <div className="flex-1 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C6EF4E] text-black rounded-full"
                        style={{ width: `${(m.budget_adherence / 50) * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-[var(--color-ink)] dark:text-zinc-200 whitespace-nowrap">
                      {m.budget_adherence.toFixed(0)}/50
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Visually separated Unranked section with dashed border */}
      {leaderboard.unranked.length > 0 && (
        <div className="pt-3 mt-3 border-t-2 border-dashed border-black/20 dark:border-white/20 space-y-2">
          <div className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-[var(--color-ink-muted)] dark:text-zinc-400">
            <Info size={11} />
            <span>NOT YET RANKED (MIN 3 LOG DAYS & 1 CAPPED SLICE)</span>
          </div>

          <div className="space-y-1.5">
            {leaderboard.unranked.map((m: LeaderboardMember) => {
              const statusTag =
                m.distinct_log_days < 3
                  ? `LESS_THAN_3_DAYS_LOGGED (${m.distinct_log_days}/3)`
                  : 'SET_A_BUDGET_CAP_TO_RANK';

              return (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between p-2 rounded bg-black/5 dark:bg-white/5 opacity-80 border border-black/5 dark:border-white/5 text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center text-zinc-400 font-bold">—</span>
                    <span className="font-bold text-[var(--color-ink)] dark:text-zinc-300">
                      {m.name} {m.is_self && '(You)'}
                    </span>
                  </div>

                  {/* Status tag only — NO numeric composite score is displayed */}
                  <span
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className="text-[9px] font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[var(--color-ink-muted)] dark:text-zinc-400"
                  >
                    {statusTag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
