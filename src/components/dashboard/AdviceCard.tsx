import { useAdviceEngine } from '../../hooks/useAdviceEngine';
import { BentoCard } from '../shared/BentoCard';

export function AdviceCard() {
  const { advice } = useAdviceEngine();

  if (advice.length === 0) return null;

  return (
    <BentoCard className="h-auto flex flex-col justify-between">
      <div>
        <h3 
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-lg font-extrabold uppercase tracking-wide mb-4 text-[var(--color-ink)]"
        >
          FINANCIAL_INTELLIGENCE
        </h3>
        
        <div className="space-y-3">
          {advice.map((item) => {
            const getBorderColor = () => {
              if (item.type === 'warning') return 'border-l-[var(--color-warn)]';
              if (item.type === 'success') return 'border-l-[var(--color-primary)]';
              return 'border-l-[var(--color-ink)]';
            };

            return (
              <div 
                key={item.id}
                className={`p-3 bg-[var(--color-surface)] border-[var(--border-default)] border-l-8 ${getBorderColor()} rounded-[var(--border-radius)]`}
              >
                <h4 
                  style={{ fontFamily: 'var(--font-display)' }}
                  className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] mb-1"
                >
                  {item.title}
                </h4>
                <p 
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="text-xs text-[var(--color-ink-muted)] leading-relaxed"
                >
                  {item.message}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </BentoCard>
  );
}
