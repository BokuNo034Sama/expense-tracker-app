import { useState } from 'react';
import { useAppStore } from '../../store';
import type { Category } from '../../store/types';

interface CategoryCardProps {
  category: Category;
  spent: number;
  onEdit: (cat: Category) => void;
}

export function CategoryCard({ category, spent, onEdit }: CategoryCardProps) {
  const updateCategory = useAppStore(s => s.updateCategory);

  const [isExpanded, setIsExpanded] = useState(false);
  const [newLimit, setNewLimit] = useState(String(category?.budget_limit || 0));
  const [submitting, setSubmitting] = useState(false);

  const limit = Number(category?.budget_limit || 0);
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const isOver = limit > 0 && spent > limit;

  const formatNairaCompact = (amount: number) => {
    if (amount >= 1000000) {
      return '₦' + (amount / 1000000).toFixed(1) + 'M';
    }
    if (amount >= 1000) {
      return '₦' + (amount / 1000).toFixed(0) + 'k';
    }
    return '₦' + amount;
  };

  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category?.id) return;
    setSubmitting(true);
    try {
      await updateCategory(category.id, { budget_limit: Number(newLimit) });
      setIsExpanded(false);
    } catch (err) {
      console.error('[KINY] Failed to update category:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!category) return null;

  return (
    <div 
      className="relative flex flex-col justify-between bg-white dark:bg-zinc-800 border-2 border-black shadow-[2px_2px_0px_0px_#000000] p-2 rounded-none select-none transition-transform hover:-translate-y-[0.5px]"
    >
      {/* Top Row: Name and Edit Icon */}
      <div className="flex justify-between items-start gap-1">
        <h4 className="font-display font-black text-[10px] uppercase truncate text-black dark:text-white flex-1" title={category.name}>
          {category.name}
        </h4>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit(category);
          }}
          className="text-[9px] hover:bg-black/5 dark:hover:bg-white/5 px-1.5 border border-transparent hover:border-black rounded-none shrink-0 text-black dark:text-white cursor-pointer font-bold"
          title="Edit Category Details"
        >
          ✎
        </button>
      </div>

      {/* Middle Row: Spent / Limit figures */}
      <div className="mt-1 flex justify-between items-baseline gap-1 text-[9px] font-mono font-bold">
        <span className="text-black dark:text-white truncate">
          {formatNairaCompact(spent)}
        </span>
        <span className="text-gray-400 dark:text-gray-500 truncate">
          /{formatNairaCompact(limit)}
        </span>
      </div>

      {/* Bottom Row: Condensed Progress Bar & Percentage */}
      <div className="mt-1.5 space-y-1">
        <div className="flex justify-between items-center text-[7px] font-mono">
          <span className="font-bold text-gray-500">{category.slice.toUpperCase()}</span>
          <span className={`font-black ${isOver ? 'text-red-500' : 'text-black dark:text-white'}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
        
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-1.5 w-full bg-[#F4F4F0] dark:bg-zinc-900 border border-black rounded-none overflow-hidden cursor-pointer"
          title="Click progress bar to quick edit limit"
        >
          <div 
            className={`h-full transition-all duration-300 ${isOver ? 'bg-red-500' : 'bg-[#C6EF4E]'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Popover Limit Editor (Inline Form Overlay) */}
      {isExpanded && (
        <form 
          onSubmit={handleUpdateLimit}
          className="absolute inset-0 bg-white dark:bg-zinc-800 p-2 z-10 border border-black flex flex-col justify-between"
        >
          <div className="flex justify-between items-center text-[8px] font-mono font-bold text-black dark:text-white">
            <span>SET LIMIT:</span>
            <button 
              type="button" 
              onClick={() => setIsExpanded(false)}
              className="text-red-500 font-bold px-1 hover:bg-black/5 rounded-none cursor-pointer"
            >
              ✕
            </button>
          </div>
          <input 
            type="number" 
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            className="w-full text-[10px] font-mono font-bold p-1 bg-[#F4F4F0] dark:bg-[#18181B] text-black dark:text-white border border-black focus:outline-none"
            min="0"
            autoFocus
          />
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full mt-1 bg-[#C6EF4E] text-black text-[8px] font-mono font-bold py-1 border border-black uppercase active:translate-y-[1px] cursor-pointer"
          >
            {submitting ? '...' : 'SAVE ✓'}
          </button>
        </form>
      )}
    </div>
  );
}