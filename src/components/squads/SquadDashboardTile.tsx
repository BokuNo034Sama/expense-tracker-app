import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Check, LogOut } from 'lucide-react';
import { useAppStore } from '../../store';

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
  onLeave:    () => void;
}

export function SquadDashboardTile({
  squadId, squadName, inviteCode, onLeave
}: SquadDashboardTileProps) {
  const session     = useAppStore(s => s.auth.session);
  const [members,   setMembers]   = useState<SquadMemberDisplay[]>([]);
  const [copied,    setCopied]    = useState(false);
  const [loading,   setLoading]   = useState(true);

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
      className="bg-[var(--color-surface)] dark:bg-zinc-800 border-2 border-[var(--color-ink)] dark:border-white rounded-[var(--border-radius)] p-4"
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
          <button
            onClick={onLeave}
            className="p-1 text-[var(--color-ink-muted)] hover:text-red-500 transition-colors cursor-pointer"
            title="Leave squad"
          >
            <LogOut size={12} />
          </button>
        </div>
      </div>

      {/* Member Shields */}
      {loading ? (
        <p style={{ fontFamily: 'var(--font-mono)' }}
           className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 animate-pulse">
          LOADING_SQUAD_DATA...
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {members.map(member => (
            <div key={member.user_id} className="flex flex-col items-center gap-1">
              <motion.div
                whileHover={{ scale: 1.1 }}
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
                className="text-[8px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase"
              >
                {member.current_streak}🔥
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Privacy note */}
      <p
        style={{ fontFamily: 'var(--font-mono)' }}
        className="text-[9px] text-[var(--color-ink-muted)] dark:text-zinc-400 mt-3 border-t border-[var(--color-ink)]/10 dark:border-white/10 pt-2"
      >
        // DISCIPLINE_ONLY — balances are private
      </p>
    </motion.div>
  );
}
