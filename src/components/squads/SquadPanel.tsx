import { useState } from 'react';
import { useAppStore } from '../../store';
import { SquadDashboardTile } from './SquadDashboardTile';

export function SquadPanel() {
  const squads     = useAppStore(s => s.squads);
  const createSquad = useAppStore(s => s.createSquad);
  const joinSquad   = useAppStore(s => s.joinSquad);
  const leaveSquad  = useAppStore(s => s.leaveSquad);

  const [newSquadName, setNewSquadName] = useState('');
  const [inviteInput,  setInviteInput]  = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [tab,          setTab]          = useState<'create' | 'join'>('create');

  const handleCreate = async () => {
    if (!newSquadName.trim()) return;
    setLoading(true); setError(null);
    try {
      await createSquad(newSquadName);
      setNewSquadName('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!inviteInput.trim()) return;
    setLoading(true); setError(null);
    try {
      await joinSquad(inviteInput);
      setInviteInput('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Existing squads */}
      {squads.map(sq => (
        <SquadDashboardTile
          key={sq.id}
          squadId={sq.id}
          squadName={sq.name}
          inviteCode={sq.invite_code}
          onLeave={() => leaveSquad(sq.id)}
        />
      ))}

      {/* Create / Join tabs */}
      <div className="bg-[var(--color-surface)] dark:bg-zinc-800 border-2 border-[var(--color-ink)] dark:border-white rounded-[var(--border-radius)] p-4">
        <div className="flex gap-2 mb-4">
          {(['create', 'join'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ fontFamily: 'var(--font-mono)' }}
              className={`flex-1 py-2 text-[10px] font-bold uppercase border-2 border-[var(--color-ink)] dark:border-white rounded transition-all cursor-pointer ${
                tab === t
                  ? 'bg-[var(--color-ink)] dark:bg-white text-[#CCFF00] dark:text-black font-extrabold'
                  : 'bg-[var(--color-surface)] dark:bg-zinc-900 text-[var(--color-ink)] dark:text-white'
              }`}
            >
              {t === 'create' ? '+ CREATE' : '# JOIN'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="e.g. December Savings Gang"
              value={newSquadName}
              onChange={e => setNewSquadName(e.target.value)}
              maxLength={40}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full px-3 py-2.5 bg-[var(--color-surface)] dark:bg-zinc-900 border-2 border-[var(--color-ink)] dark:border-white text-[var(--color-ink)] dark:text-white rounded-[var(--border-radius)] text-xs outline-none"
            />
            <button
              onClick={handleCreate}
              disabled={loading || !newSquadName.trim()}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full py-2.5 bg-[var(--color-ink)] dark:bg-white text-[#CCFF00] dark:text-black border-2 border-[var(--color-ink)] dark:border-white rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] text-xs font-bold uppercase disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'CREATING...' : 'CREATE_SQUAD'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter 8-character invite code"
              value={inviteInput}
              onChange={e => setInviteInput(e.target.value.toLowerCase())}
              maxLength={8}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full px-3 py-2.5 bg-[var(--color-surface)] dark:bg-zinc-900 border-2 border-[var(--color-ink)] dark:border-white text-[var(--color-ink)] dark:text-white rounded-[var(--border-radius)] text-xs outline-none uppercase tracking-widest"
            />
            <button
              onClick={handleJoin}
              disabled={loading || inviteInput.length < 6}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full py-2.5 bg-[#C6EF4E] text-black border-2 border-[var(--color-ink)] dark:border-white rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] text-xs font-bold uppercase disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'JOINING...' : 'JOIN_SQUAD'}
            </button>
          </div>
        )}

        {error && (
          <p style={{ fontFamily: 'var(--font-mono)' }}
             className="text-[10px] text-red-500 font-bold mt-2 border-l-4 border-red-500 pl-2">
            ERROR: {error}
          </p>
        )}
      </div>
    </div>
  );
}
