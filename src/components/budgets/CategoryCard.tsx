import { useState } from 'react';
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
  const updateCategory = useAppStore(s => s.updateCategory);
  const expenses = useAppStore(s => s.expenses);

  const [isExpanded, setIsExpanded] = useState(false);
  const [newLimit, setNewLimit] = useState(String(category.budget_limit || 0));
  const [submitting, setSubmitting] = useState(false);

  const limit = Number(category.budget_limit);
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const isOver = limit > 0 && spent > limit;

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const categoryExpenses = expenses.filter(e => e.category_id === category.id);

  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateCategory(category.id, { budget_limit: Number(newLimit) });
      setIsExpanded(false);
    } catch (err) {
      console.error('[KINY] Failed to update category budget limit:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BentoCard className="flex flex-col justify-between h-auto hover:scale-[1.01] p-0 overflow-hidden">
      {/* Compact header row (Collapsed View) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-3 cursor-pointer select-none bg-[rgba(0,0,0,0.02)] border-b border-[var(--color-ink)] border-opacity-5"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-[9px] font-bold bg-[var(--color-brand-primary)] text-[#000000] px-2 py-0.5 border border-[var(--color-border)] rounded-full uppercase shrink-0"
          >
            {category.slice}
          </span>
          <h4 
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-sm font-extrabold uppercase text-[var(--color-ink)] truncate"
          >
            {category.name}
          </h4>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(category);
            }}
            className="p-1 hover:bg-[rgba(0,0,0,0.05)] border border-transparent rounded transition-all duration-100"
            title="Edit category"
          >
            <Edit2 className="h-3 w-3 text-[var(--color-ink)]" />
          </button>
          
          <Popover>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 hover:bg-[rgba(255,68,68,0.1)] border border-transparent rounded transition-all duration-100"
                title="Delete category"
              >
                <Trash2 className="h-3 w-3 text-[var(--color-danger)]" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              onClick={(e) => e.stopPropagation()}
              className="w-64 border-[var(--border-default)] rounded-[var(--border-radius)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-4 z-50" 
              align="end"
            >
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

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            style={{ fontFamily: 'var(--font-mono)' }}
            className="px-2 py-0.5 border border-[var(--color-border)] bg-[var(--color-brand-primary)] text-[#000000] rounded text-[10px] font-bold shadow-[1px_1px_0px_#000] active:translate-y-[1px] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] cursor-pointer transition-all uppercase"
          >
            {isExpanded ? 'CLOSE' : 'ADJUST'}
          </button>
        </div>
      </div>

      {/* Main card body (always visible, holds spending figures) */}
      <div className="p-3">
        <div style={{ fontFamily: 'var(--font-mono)' }} className="text-xl font-extrabold text-[var(--color-ink)]">
          {formatNaira(spent)}
        </div>
        
        {limit > 0 ? (
          <div className="mt-1 space-y-1.5">
            <div className="flex justify-between items-start gap-2 text-[10px] flex-wrap">
              <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[var(--color-ink-muted)] break-all">LIMIT: {formatNaira(limit)}</span>
              <span style={{ fontFamily: 'var(--font-mono)' }} className={`font-bold shrink-0 ${isOver ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink-muted)]'}`}>
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
            className="text-[8px] bg-[var(--color-brand-primary)] text-[#000000] font-bold px-2 py-0.5 border border-[var(--color-border)] rounded-full inline-block mt-2 uppercase"
          >
            ★ PRIORITY_TARGET
          </div>
        )}

        {/* Progressive Disclosure Panel (Expanded View) */}
        {isExpanded && (
          <form 
            onSubmit={handleUpdateLimit}
            onClick={(e) => e.stopPropagation()}
            className="border-t border-black/10 pt-3 mt-2 space-y-2.5"
          >
            <div className="flex flex-col gap-1">
              <label 
                style={{ fontFamily: 'var(--font-mono)' }} 
                className="text-[9px] text-[var(--color-ink-muted)] uppercase font-bold"
              >
                SET_BUDGET_CAP:
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="e.g. 50000"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="flex-1 px-2.5 py-1.5 bg-white text-black border-2 border-black rounded-[var(--border-radius)] text-xs font-bold focus:outline-none focus:bg-gray-50 uppercase"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[var(--color-brand-primary)] text-[#000000] text-xs font-mono p-2 border border-[var(--color-border)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold uppercase rounded-[var(--border-radius)] cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {submitting ? '...' : 'UPDATE_CAP_✓'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </BentoCard>
  );
}
