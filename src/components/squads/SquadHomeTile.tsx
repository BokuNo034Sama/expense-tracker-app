import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { SquadDashboardTile } from './SquadDashboardTile';

export function SquadHomeTile() {
  const squads   = useAppStore(s => s.squads);
  const navigate = useNavigate();

  // No squads yet — show a subtle prompt linking to Profile
  if (!squads || squads.length === 0) {
    return (
      <button
        onClick={() => navigate('/profile')}
        style={{ fontFamily: 'var(--font-mono)' }}
        className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] border border-[var(--color-ink)]/20 rounded-[var(--border-radius)] hover:bg-[var(--color-ink)]/5 transition-colors cursor-pointer"
      >
        + CREATE_OR_JOIN_A_SQUAD →
      </button>
    );
  }

  // Has squads — show the shield tiles only (no form)
  return (
    <div className="space-y-3">
      {squads.map(sq => (
        <SquadDashboardTile
          key={sq.id}
          squadId={sq.id}
          squadName={sq.name}
          inviteCode={sq.invite_code}
        />
      ))}
      <button
        onClick={() => navigate('/profile')}
        style={{ fontFamily: 'var(--font-mono)' }}
        className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] border border-[var(--color-ink)]/20 rounded-[var(--border-radius)] hover:bg-[var(--color-ink)]/5 transition-colors cursor-pointer"
      >
        MANAGE_SQUADS →
      </button>
    </div>
  );
}
