import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Copy, Check, Trophy, Shield, MoreVertical, Trash2, UserX, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store';
import type { SquadMember } from '../../store/types';
import { SquadActivityFeed } from './SquadActivityFeed';
import { SquadLeaderboardPanel } from './SquadLeaderboardPanel';

interface SquadDashboardTileProps {
  squadId: string;
  squadName: string;
  inviteCode: string;
}

export function SquadDashboardTile({
  squadId,
  squadName,
  inviteCode,
}: SquadDashboardTileProps) {
  const session = useAppStore(s => s.auth.session);
  const removeSquadMember = useAppStore(s => s.removeSquadMember);
  const deleteSquad = useAppStore(s => s.deleteSquad);

  const [activeTab, setActiveTab] = useState<'members' | 'leaderboard'>('members');
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [createdBy, setCreatedBy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin action states
  const [activeMenuMemberId, setActiveMenuMemberId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<SquadMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmNameInput, setConfirmNameInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const tabMembersRef = useRef<HTMLButtonElement>(null);
  const tabLeaderboardRef = useRef<HTMLButtonElement>(null);

  const currentUserId = session?.user?.id;
  const isCreator = Boolean(currentUserId && createdBy && currentUserId === createdBy);

  // Fetch squad members roster
  const fetchMembers = useCallback(async () => {
    if (!squadId) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const token = session?.access_token;
      const res = await fetch(`${apiUrl}/api/squads/${squadId}/members`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setMembers(data.members ?? []);
        setCreatedBy(data.created_by ?? null);
      } else {
        setMembers([]);
      }
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [squadId, session?.access_token]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Keyboard navigation for WAI-ARIA tab pattern
  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: 'members' | 'leaderboard') => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextTab = currentTab === 'members' ? 'leaderboard' : 'members';
      setActiveTab(nextTab);
      if (nextTab === 'members') {
        tabMembersRef.current?.focus();
      } else {
        tabLeaderboardRef.current?.focus();
      }
    }
  };

  const copyInvite = () => {
    const inviteUrl = `${window.location.origin}?join=${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRemoveMemberConfirm = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    setAdminError(null);
    try {
      await removeSquadMember(squadId, memberToRemove.user_id);
      setMembers(prev => prev.filter(m => m.user_id !== memberToRemove.user_id));
      setMemberToRemove(null);
      setActiveMenuMemberId(null);
    } catch (err: any) {
      setAdminError(err.message || 'Failed to remove member.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleDeleteSquadConfirm = async () => {
    if (confirmNameInput.trim().toLowerCase() !== squadName.trim().toLowerCase()) {
      setAdminError('Squad name does not match.');
      return;
    }

    setIsDeleting(true);
    setAdminError(null);
    try {
      await deleteSquad(squadId);
      setShowDeleteModal(false);
    } catch (err: any) {
      setAdminError(err.message || 'Failed to delete squad.');
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface)] dark:bg-zinc-900 border-2 border-[var(--color-ink)] dark:border-white rounded-[var(--border-radius)] p-4 shadow-sm relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-[var(--color-ink)] dark:text-white" />
          <span
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs font-black uppercase tracking-wider text-[var(--color-ink)] dark:text-white"
          >
            {squadName}
          </span>
          {isCreator && (
            <span
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-[8px] font-bold bg-black text-[#C6EF4E] dark:bg-white dark:text-black px-1.5 py-0.5 rounded tracking-widest uppercase"
            >
              CREATOR
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyInvite}
            aria-label={`Copy invite code for ${squadName}`}
            className="flex items-center gap-1 px-2.5 py-1 border border-[var(--color-ink)] dark:border-white rounded text-[10px] font-mono font-bold hover:bg-[#C6EF4E] hover:text-black transition-colors cursor-pointer"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'COPIED' : inviteCode.toUpperCase()}
          </button>

          {/* Squad-level Admin Delete button */}
          {isCreator && (
            <button
              onClick={() => {
                setAdminError(null);
                setConfirmNameInput('');
                setShowDeleteModal(true);
              }}
              title="Delete squad (Creator action)"
              aria-label="Delete squad"
              className="p-1 text-red-500 hover:bg-red-500/10 border border-red-500/30 rounded transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Segmented Controls (Members vs Leaderboard) — WAI-ARIA compliant */}
      <div
        role="tablist"
        aria-label="Squad view"
        className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-md mb-3 border border-black/10 dark:border-white/10"
      >
        <button
          ref={tabMembersRef}
          role="tab"
          id={`tab-members-${squadId}`}
          aria-selected={activeTab === 'members'}
          aria-controls={`panel-members-${squadId}`}
          tabIndex={activeTab === 'members' ? 0 : -1}
          onClick={() => setActiveTab('members')}
          onKeyDown={e => handleTabKeyDown(e, 'members')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold font-mono transition-all rounded ${
            activeTab === 'members'
              ? 'bg-[var(--color-ink)] text-[#C6EF4E] border-2 border-[var(--color-ink)] dark:bg-white dark:text-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]'
              : 'text-zinc-600 dark:text-zinc-400 border-2 border-transparent hover:text-black dark:hover:text-white'
          }`}
        >
          <Shield size={12} />
          MEMBERS
        </button>

        <button
          ref={tabLeaderboardRef}
          role="tab"
          id={`tab-leaderboard-${squadId}`}
          aria-selected={activeTab === 'leaderboard'}
          aria-controls={`panel-leaderboard-${squadId}`}
          tabIndex={activeTab === 'leaderboard' ? 0 : -1}
          onClick={() => setActiveTab('leaderboard')}
          onKeyDown={e => handleTabKeyDown(e, 'leaderboard')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold font-mono transition-all rounded ${
            activeTab === 'leaderboard'
              ? 'bg-[var(--color-ink)] text-[#C6EF4E] border-2 border-[var(--color-ink)] dark:bg-white dark:text-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]'
              : 'text-zinc-600 dark:text-zinc-400 border-2 border-transparent hover:text-black dark:hover:text-white'
          }`}
        >
          <Trophy size={12} />
          LEADERBOARD
        </button>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'members' ? (
          <motion.div
            key="members-panel"
            id={`panel-members-${squadId}`}
            role="tabpanel"
            aria-labelledby={`tab-members-${squadId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Live Activity Feed Strip */}
            <SquadActivityFeed
              squadId={squadId}
              squadName={squadName}
              onActivityEvent={fetchMembers}
            />

            {/* Member Roster List */}
            {loading ? (
              <p
                style={{ fontFamily: 'var(--font-mono)' }}
                className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 animate-pulse"
              >
                LOADING_SQUAD_ROSTER...
              </p>
            ) : members.length === 0 ? (
              <p
                style={{ fontFamily: 'var(--font-mono)' }}
                className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400"
              >
                No members found in this squad.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map(member => {
                  const isSelf = member.user_id === currentUserId;
                  const hasActivity = (member.current_streak ?? 0) > 0 || member.shield_active;

                  return (
                    <div
                      key={member.user_id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                        isSelf
                          ? 'bg-[#C6EF4E]/10 border-[#C6EF4E] shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_#fff]'
                          : 'bg-black/5 dark:bg-zinc-800/60 border-black/10 dark:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Avatar initials */}
                        <div className="w-8 h-8 rounded-lg border-2 border-[var(--color-ink)] dark:border-white bg-black text-[#C6EF4E] flex items-center justify-center font-black text-xs">
                          {member.avatar_initials || '??'}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-[var(--color-ink)] dark:text-white leading-tight">
                              {member.name}
                            </span>
                            {isSelf && (
                              <span
                                style={{ fontFamily: 'var(--font-mono)' }}
                                className="text-[8px] font-bold bg-black text-[#C6EF4E] dark:bg-white dark:text-black px-1 rounded"
                              >
                                YOU
                              </span>
                            )}
                            {/* ALL_BUCKETS_LOCKED badge — positive token (no lock glyph) */}
                            {member.all_buckets_locked && (
                              <span
                                style={{ fontFamily: 'var(--font-mono)' }}
                                className="flex items-center gap-0.5 text-[8px] font-extrabold bg-[#C6EF4E] text-black px-1.5 py-0.5 rounded shadow-sm"
                                title="Locked all buckets within limits this week"
                              >
                                <Sparkles size={8} /> ALL BUCKETS LOCKED
                              </span>
                            )}
                          </div>

                          {/* Streak Badge / New Member State */}
                          <div className="mt-0.5">
                            {hasActivity ? (
                              <span
                                style={{ fontFamily: 'var(--font-mono)' }}
                                className="text-[9px] font-extrabold text-[var(--color-ink-muted)] dark:text-zinc-300"
                              >
                                ⚡ {member.current_streak ?? 0}-day streak
                              </span>
                            ) : (
                              <span
                                style={{ fontFamily: 'var(--font-mono)' }}
                                className="text-[9px] text-[var(--color-ink-muted)] dark:text-zinc-500 italic"
                              >
                                New — no streak yet
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Shield Indicator — square box with text accessibility label */}
                        <div
                          className={`w-7 h-7 rounded border-2 flex items-center justify-center transition-all ${
                            member.shield_active
                              ? 'bg-[#C6EF4E] border-black text-black shadow-[1px_1px_0px_0px_#000]'
                              : 'bg-transparent border-dashed border-black/30 dark:border-white/30 text-zinc-400'
                          }`}
                          title={member.shield_active ? 'Shield active today' : 'Not logged today'}
                          aria-label={member.shield_active ? 'Shield active today' : 'Not logged today'}
                        >
                          {member.shield_active ? (
                            <Check size={12} className="stroke-[3]" />
                          ) : (
                            <span className="text-[9px] font-mono font-bold">—</span>
                          )}
                        </div>

                        {/* Admin Kebab Menu for Non-Self Members */}
                        {isCreator && !isSelf && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveMenuMemberId(activeMenuMemberId === member.user_id ? null : member.user_id)
                              }
                              aria-label={`Options for ${member.name}`}
                              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
                            >
                              <MoreVertical size={14} className="text-zinc-500" />
                            </button>

                            {activeMenuMemberId === member.user_id && (
                              <div className="absolute right-0 top-full mt-1 bg-[var(--color-surface)] dark:bg-zinc-800 border-2 border-black dark:border-white rounded-md shadow-lg py-1 z-20 min-w-[130px]">
                                <button
                                  onClick={() => {
                                    setMemberToRemove(member);
                                    setActiveMenuMemberId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-left text-[10px] font-mono font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <UserX size={12} />
                                  REMOVE MEMBER
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
          >
            <SquadLeaderboardPanel squadId={squadId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--color-surface)] dark:bg-zinc-900 border-2 border-[var(--color-ink)] dark:border-white rounded-[var(--border-radius)] p-4 max-w-xs w-full shadow-xl space-y-3">
            <h3
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-xs font-black uppercase text-[var(--color-ink)] dark:text-white"
            >
              CONFIRM_MEMBER_REMOVAL
            </h3>
            <p className="text-xs text-[var(--color-ink-muted)] dark:text-zinc-300">
              Are you sure you want to remove <strong>{memberToRemove.name}</strong> from <strong>{squadName}</strong>?
            </p>

            {adminError && (
              <p className="text-[10px] text-red-500 font-mono font-bold">{adminError}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                disabled={isRemoving}
                onClick={() => {
                  setMemberToRemove(null);
                  setAdminError(null);
                }}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="flex-1 py-1.5 border border-black/20 dark:border-white/20 rounded text-[10px] font-bold uppercase cursor-pointer"
              >
                CANCEL
              </button>
              <button
                disabled={isRemoving}
                onClick={handleRemoveMemberConfirm}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="flex-1 py-1.5 bg-red-600 text-white rounded text-[10px] font-bold uppercase disabled:opacity-50 cursor-pointer"
              >
                {isRemoving ? 'REMOVING...' : 'CONFIRM_REMOVE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Squad Confirmation Modal (Type-to-Confirm) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--color-surface)] dark:bg-zinc-900 border-2 border-[var(--color-ink)] dark:border-white rounded-[var(--border-radius)] p-4 max-w-sm w-full shadow-xl space-y-3">
            <h3
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-xs font-black uppercase text-red-500"
            >
              DELETE_SQUAD_PERMANENTLY
            </h3>
            <p className="text-xs text-[var(--color-ink-muted)] dark:text-zinc-300">
              This action is permanent and will disband <strong>{squadName}</strong> for all members.
            </p>
            <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Type <strong className="text-[var(--color-ink)] dark:text-white">{squadName}</strong> below to confirm:
            </p>

            <input
              type="text"
              value={confirmNameInput}
              onChange={e => setConfirmNameInput(e.target.value)}
              placeholder={squadName}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full px-3 py-2 bg-black/5 dark:bg-zinc-800 border-2 border-[var(--color-ink)] dark:border-white text-[var(--color-ink)] dark:text-white rounded text-xs outline-none"
            />

            {adminError && (
              <p className="text-[10px] text-red-500 font-mono font-bold">{adminError}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setAdminError(null);
                }}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="flex-1 py-1.5 border border-black/20 dark:border-white/20 rounded text-[10px] font-bold uppercase cursor-pointer"
              >
                CANCEL
              </button>
              <button
                disabled={isDeleting || confirmNameInput.trim().toLowerCase() !== squadName.trim().toLowerCase()}
                onClick={handleDeleteSquadConfirm}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="flex-1 py-1.5 bg-red-600 text-white rounded text-[10px] font-bold uppercase disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'DELETING...' : 'DELETE_SQUAD'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Invariant Note */}
      <p
        style={{ fontFamily: 'var(--font-mono)' }}
        className="text-[9px] text-[var(--color-ink-muted)] dark:text-zinc-400 mt-3 border-t border-[var(--color-ink)]/10 dark:border-white/10 pt-2"
      >
        // DISCIPLINE_ONLY — balances and spends are private
      </p>
    </motion.div>
  );
}
