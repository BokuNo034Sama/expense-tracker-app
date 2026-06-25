import React from 'react';

export const OCCUPATION_OPTIONS = [
  { id: 'salary', label: 'Salary Earner', desc: 'Fixed monthly alerts' },
  { id: 'business', label: 'Business Owner', desc: 'Daily/weekly sales cash' },
  { id: 'student', label: 'Student / Hustler', desc: 'Allowances, side gigs & urgent 2k' }
];

interface OnboardingStep2Props {
  selectedId: string;
  onSelect: (id: string, label: string) => void;
}

export function OnboardingStep2({ selectedId, onSelect }: OnboardingStep2Props) {
  return (
    <div className="space-y-4">
      <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-extrabold uppercase text-[var(--color-ink)]">
        SELECT_YOUR_TRACK
      </h2>
      <p style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
        Choose your account type to configure your tracking engine and cycle constraints.
      </p>

      <div className="space-y-3">
        {OCCUPATION_OPTIONS.map((opt) => {
          const isSelected = selectedId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id, opt.label)}
              style={{ border: 'var(--border-default)' }}
              className={`w-full p-4 text-left rounded-[var(--border-radius)] flex items-center justify-between transition-all duration-100 ${
                isSelected
                  ? 'bg-[#C6EF4E] text-[#000000] font-bold shadow-[var(--shadow-card)] -translate-x-[2px] -translate-y-[2px]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-main)] shadow-[var(--shadow-btn)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[var(--shadow-card)]'
              }`}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-display)' }} className="text-sm uppercase font-bold text-[var(--color-text-main)]">
                  {opt.label}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-[var(--color-text-muted)] mt-1 leading-relaxed">
                  {opt.desc}
                </div>
              </div>
              {isSelected && (
                <span className="font-bold text-xs bg-black text-[#C6EF4E] px-2.5 py-0.5 rounded border border-black uppercase">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
