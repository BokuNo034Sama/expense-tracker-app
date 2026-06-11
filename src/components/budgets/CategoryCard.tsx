import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Edit2, Trash2 } from 'lucide-react';
import type { Category } from '../../store/types';

interface CategoryCardProps {
  category: Category;
  spent: number;
  onEdit: (cat: Category) => void;
}

export function CategoryCard({ category, spent, onEdit }: CategoryCardProps) {
  const deleteCategory = useAppStore(s => s.deleteCategory);
  const expenses = useAppStore(s => s.expenses);

  const limit = Number(category.budget_limit);
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const isOver = limit > 0 && spent > limit;

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const categoryExpenses = expenses.filter(e => e.category_id === category.id);

  return (
    <BentoCard className="flex flex-col justify-between h-full hover:scale-[1.01]">
      <div className="flex items-start justify-between">
        <div>
          <span 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-[9px] font-bold bg-[var(--color-ink)] text-[var(--color-primary)] px-2 py-0.5 border border-[var(--color-ink)] rounded-full uppercase"
          >
            {category.slice}
          </span>
          <h4 
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-sm font-extrabold uppercase mt-2 text-[var(--color-ink)]"
          >
            {category.name}
          </h4>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(category)}
            className="p-1 hover:bg-[rgba(0,0,0,0.05)] border border-transparent rounded transition-all duration-100"
            title="Edit category"
          >
            <Edit2 className="h-3 w-3 text-[var(--color-ink)]" />
          </button>
          
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-1 hover:bg-[rgba(255,68,68,0.1)] border border-transparent rounded transition-all duration-100"
                title="Delete category"
              >
                <Trash2 className="h-3 w-3 text-[var(--color-danger)]" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 border-[var(--border-default)] rounded-[var(--border-radius)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-4" align="end">
              <div className="space-y-3">
                <h4 style={{ fontFamily: 'var(--font-display)' }} className="font-extrabold text-xs uppercase text-[var(--color-ink)]">DELETE_CATEGORY?</h4>
                {categoryExpenses.length > 0 ? (
                  <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[9px] text-[var(--color-danger)] font-bold uppercase leading-relaxed">
                    WARNING: {categoryExpenses.length} EXPENSES WILL LOSE THEIR CATEGORY LINK IF YOU DELETE THIS.
                  </p>
                ) : (
                  <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-[var(--color-ink-muted)] uppercase">This action cannot be undone.</p>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => deleteCategory(category.id).catch(console.error)}
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="px-3 py-1.5 bg-[var(--color-danger)] text-white border-[var(--border-default)] rounded-[var(--border-radius)] font-bold text-[10px] uppercase shadow-[var(--shadow-btn-active)]"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--color-ink)] border-dashed pt-3">
        <div style={{ fontFamily: 'var(--font-mono)' }} className="text-xl font-extrabold text-[var(--color-ink)]">
          {formatNaira(spent)}
        </div>
        
        {limit > 0 ? (
          <div className="mt-1 space-y-1.5">
            <div className="flex justify-between items-center text-[10px]">
              <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[var(--color-ink-muted)]">LIMIT: {formatNaira(limit)}</span>
              <span style={{ fontFamily: 'var(--font-mono)' }} className={`font-bold ${isOver ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink-muted)]'}`}>
                {percentage.toFixed(0)}%
              </span>
            </div>
            
            <div className="h-2 w-full bg-[var(--color-surface)] border-[var(--border-default)] rounded-full overflow-hidden">
              <div
                className={`h-full border-r border-[var(--color-ink)] transition-all duration-300 ${isOver ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-primary)]'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-[var(--color-ink-muted)] mt-1 uppercase">
            NO LIMIT CONFIGURED
          </div>
        )}

        {category.is_priority && (
          <div 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-[8px] bg-[var(--color-primary)] text-[var(--color-ink)] font-bold px-2 py-0.5 border border-[var(--color-ink)] rounded-full inline-block mt-3 uppercase"
          >
            ★ PRIORITY_TARGET
          </div>
        )}
      </div>
    </BentoCard>
  );
}
