import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Copy, Check, Trophy, Shield, Info } from 'lucide-react';
import { useAppStore } from '../../store';
import type { SquadLeaderboardData, LeaderboardMember } from '../../store/types';

interface SquadMemberDisplay {
  user_id:         string;
  name:            string;
  avatar_initials: string;
  current_streak:  number;
  shield_active:   boolean;
}

interface SquadDashboardTileProps {
  squadId:    string;
  squadName:  string;
  inviteCode: string;
}

export function SquadDashboardTile({
  squadId, squadName, inviteCode
}: SquadDashboardTileProps) {
  const session               = useAppStore(s => s.auth.session);
  const fetchSquadLeaderboard = useAppStore(s => s.fetchSquadLeaderboard);

  const [activeTab,    setActiveTab]    = useState<'shields' | 'leaderboard'>('shields');
  const [members,      setMembers]      = useState<SquadMemberDisplay[]>([]);
  const [leaderboard,  setLeaderboard]  = useState<SquadLeaderboardData | null>(null);
  const [copied,       setCopied]       = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [lbLoading,    setLbLoading]    = useState(false);

  // Fetch squad shields
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const res = await fetch(
          `${apiUrl}/api/squads/${squadId}/members`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );
        const data = await res.json();
        setMembers(data.members ?? []);
      } catch {
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };
    if (squadId) {
      fetchMembers();
    }
  }, [squadId, session?.access_token]);

  // Fetch squad leaderboard
  useEffect(() => {
    if (activeTab === 'leaderboard' && squadId) {
      setLbLoading(true);
      fetchSquadLeaderboard(squadId)
        .then(data => setLeaderboard(data))
        .catch(() => setLeaderboard(null))
        .finally(() => setLbLoading(false));
    }
  }, [activeTab, squadId, fetchSquadLeaderboard]);

  const copyInvite = () => {
    const inviteUrl = `${window.location.origin}?join=${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface)] dark:bg-zinc-900 border-2 border-[var(--color-ink)] dark:border-white rounded-[var(--border-radius)] p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-[var(--color-ink)] dark:text-white" />
          <span
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] dark:text-white"
          >
            {squadName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyInvite}
            className="flex items-center gap-1 px-2 py-1 border border-[var(--color-ink)] dark:border-white rounded text-[10px] font-mono font-bold hover:bg-[#CCFF00] hover:text-black transition-colors cursor-pointer"
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? 'COPIED' : inviteCode.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Segmented Controls (Shields vs Leaderboard) */}
      <div
        role="tablist"
        aria-label="Squad Views"
        className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-md mb-3 border border-black/10 dark:border-white/10"
      >
        <button
          role="tab"
          id={`tab-shields-${squadId}`}
          aria-selected={activeTab === 'shields'}
          aria-controls={`panel-shields-${squadId}`}
          onClick={() => setActiveTab('shields')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold font-mono transition-all rounded ${
            activeTab === 'shields'
              ? 'bg-black text-[#C6EF4E] shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Shield size={12} />
          SHIELDS
        </button>
        <button
          role="tab"
          id={`tab-leaderboard-${squadId}`}
          aria-selected={activeTab === 'leaderboard'}
          aria-controls={`panel-leaderboard-${squadId}`}
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold font-mono transition-all rounded ${
            activeTab === 'leaderboard'
              ? 'bg-black text-[#C6EF4E] shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Trophy size={12} />
          LEADERBOARD
        </button>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'shields' ? (
          <motion.div
            key="shields-panel"
            id={`panel-shields-${squadId}`}
            role="tabpanel"
            aria-labelledby={`tab-shields-${squadId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {loading ? (
              <p
                style={{ fontFamily: 'var(--font-mono)' }}
                className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 animate-pulse"
              >
                LOADING_SQUAD_DATA...
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map(member => (
                  <div key={member.user_id} className="flex flex-col items-center gap-1">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`w-10 h-10 rounded-lg border-2 border-[var(--color-ink)] dark:border-white flex items-center justify-center font-bold text-xs transition-all ${
                        member.shield_active
                          ? 'bg-[#C6EF4E] text-black shadow-[2px_2px_0px_0px_#000]'
                          : 'bg-black/10 dark:bg-white/10 text-gray-500 dark:text-zinc-400'
                      }`}
                      title={`${member.name} — ${member.shield_active ? 'Logged today ✓' : 'Not logged yet'}`}
                    >
                      {member.avatar_initials || '??'}
                    </motion.div>
                    <span
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="text-[8px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase font-semibold"
                    >
                      {member.current_streak}🔥
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="leaderboard-panel"
            id={`panel-leaderboard-${squadId}`}
            role="tabpanel"
            aria-labelledby={`tab-leaderboard-${squadId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {lbLoading ? (
              <p
                style={{ fontFamily: 'var(--font-mono)' }}
                className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 animate-pulse"
              >
                COMPUTING_RANKINGS...
              </p>
            ) : !leaderboard || (leaderboard.ranked.length === 0 && leaderboard.unranked.length === 0) ? (
              <p
                style={{ fontFamily: 'var(--font-mono)' }}
                className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400"
              >
                No leaderboard scores computed yet for this week.
              </p>
            ) : (
              <div className="space-y-3">
                {/* Ranked Members */}
                {leaderboard.ranked.length > 0 && (
                  <div className="space-y-1.5">
                    {leaderboard.ranked.map((m: LeaderboardMember) => (
                      <div
                        key={m.user_id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          m.is_self
                            ? 'bg-[#C6EF4E]/15 border-[#C6EF4E] dark:bg-[#C6EF4E]/10'
                            : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold w-5 text-center text-[var(--color-ink)] dark:text-white">
                            #{m.rank}
                          </span>
                          <div className="w-7 h-7 rounded bg-black text-[#C6EF4E] flex items-center justify-center text-[10px] font-bold font-mono">
                            {m.avatar_initials || '??'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--color-ink)] dark:text-white leading-tight">
                              {m.name} {m.is_self && <span className="text-[10px] text-zinc-500">(You)</span>}
                            </p>
                            <p className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400">
                              Log {m.logging_consistency.toFixed(0)}/50 • Cap {m.budget_adherence.toFixed(0)}/50
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span className="text-xs font-black text-[var(--color-ink)] dark:text-white">
                            {m.composite_score.toFixed(0)}
                          </span>
                          <span className="text-[9px] text-zinc-500 dark:text-zinc-400"> /100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Unranked Members */}
                {leaderboard.unranked.length > 0 && (
                  <div className="pt-2 border-t border-black/10 dark:border-white/10 space-y-1">
                    <p className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Info size={10} /> NOT YET RANKED (MIN 3 LOG DAYS & 1 CAPPED SLICE)
                    </p>
                    {leaderboard.unranked.map((m: LeaderboardMember) => (
                      <div
                        key={m.user_id}
                        className="flex items-center justify-between p-1.5 rounded bg-black/5 dark:bg-white/5 opacity-70 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-center text-zinc-400">—</span>
                          <span className="font-bold text-[var(--color-ink)] dark:text-zinc-300">
                            {m.name} {m.is_self && '(You)'}
                          </span>
                        </div>
                        <span className="text-[9px] text-zinc-500">
                          {m.distinct_log_days < 3 ? `${m.distinct_log_days}/3 log days` : 'No caps set'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy note */}
      <p
        style={{ fontFamily: 'var(--font-mono)' }}
        className="text-[9px] text-[var(--color-ink-muted)] dark:text-zinc-400 mt-3 border-t border-[var(--color-ink)]/10 dark:border-white/10 pt-2"
      >
        // DISCIPLINE_ONLY — balances and spends are private
      </p>
    </motion.div>
  );
}
