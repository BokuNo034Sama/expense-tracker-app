import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Globe, ShieldCheck, Flame, Info } from 'lucide-react';
import { useAppStore } from '../../store';
import type { GlobalLeaderboardData, LeaderboardMember } from '../../store/types';

interface GlobalLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalLeaderboardModal({ isOpen, onClose }: GlobalLeaderboardModalProps) {
  const fetchGlobalLeaderboard = useAppStore(s => s.fetchGlobalLeaderboard);
  const [data, setData] = useState<GlobalLeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchGlobalLeaderboard()
        .then(res => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [isOpen, fetchGlobalLeaderboard]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[var(--color-surface)] dark:bg-zinc-900 border-2 border-[var(--color-ink)] dark:border-white rounded-xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="global-leaderboard-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-[var(--color-ink)] dark:border-white bg-black text-[#C6EF4E]">
            <div className="flex items-center gap-2">
              <Globe size={18} />
              <h2
                id="global-leaderboard-title"
                style={{ fontFamily: 'var(--font-mono)' }}
                className="text-sm font-black tracking-wider uppercase"
              >
                GLOBAL_DISCIPLINE_LEADERBOARD
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close Global Leaderboard"
            >
              <X size={18} />
            </button>
          </div>

          {/* Subheader info */}
          <div className="bg-[#C6EF4E]/10 border-b border-black/10 dark:border-white/10 px-4 py-2 flex items-center gap-2 text-[11px] font-mono text-[var(--color-ink)] dark:text-zinc-300">
            <ShieldCheck size={14} className="text-[#C6EF4E] shrink-0" />
            <span>Scores track logging consistency & budget caps. Spending amounts remain 100% private.</span>
          </div>

          {/* Rankings List */}
          <div className="p-4 overflow-y-auto flex-1 space-y-2">
            {loading ? (
              <div className="text-center py-12 space-y-2">
                <Trophy size={28} className="mx-auto text-zinc-400 animate-bounce" />
                <p className="font-mono text-xs text-zinc-500 animate-pulse">
                  FETCHING_GLOBAL_RANKS...
                </p>
              </div>
            ) : !data || data.rankings.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Info size={28} className="mx-auto text-zinc-400" />
                <p className="font-mono text-xs text-zinc-500">
                  {data?.opt_in_required
                    ? 'You must opt in via Profile Settings to view the Global Leaderboard.'
                    : 'No scores computed yet for this week.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {data.rankings.map((m: LeaderboardMember) => (
                  <div
                    key={m.user_id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border ${
                      m.is_self
                        ? 'bg-[#C6EF4E]/20 border-[#C6EF4E] shadow-sm font-semibold'
                        : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-mono text-xs font-black w-6 text-center ${
                          m.rank === 1
                            ? 'text-yellow-500'
                            : m.rank === 2
                            ? 'text-zinc-400'
                            : m.rank === 3
                            ? 'text-amber-600'
                            : 'text-[var(--color-ink)] dark:text-white'
                        }`}
                      >
                        #{m.rank}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-black text-[#C6EF4E] flex items-center justify-center text-xs font-bold font-mono">
                        {m.avatar_initials || '??'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--color-ink)] dark:text-white leading-tight">
                          {m.name} {m.is_self && <span className="text-[10px] text-zinc-500">(You)</span>}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                          <span>Log {m.logging_consistency.toFixed(0)}/50</span>
                          <span>•</span>
                          <span>Cap {m.budget_adherence.toFixed(0)}/50</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-sm font-black text-[var(--color-ink)] dark:text-white">
                        {m.composite_score.toFixed(0)}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400"> /100</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pinned Self Rank Card if caller is ranked */}
          {data?.selfRank && (
            <div className="p-3 bg-black text-white border-t-2 border-[var(--color-ink)] dark:border-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-[#C6EF4E]" />
                <span className="font-mono text-xs font-bold">
                  YOUR RANK: #{data.selfRank.rank}
                </span>
                <span className="text-[11px] text-zinc-400">({data.selfRank.name})</span>
              </div>
              <div className="font-mono text-xs font-extrabold text-[#C6EF4E]">
                {data.selfRank.composite_score.toFixed(0)}/100 PTS
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
