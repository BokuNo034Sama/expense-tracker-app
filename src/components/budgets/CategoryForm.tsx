/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import type { Category, Slice } from '../../store/types';

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null; // Edit mode
}

export function CategoryForm({ open, onOpenChange, category }: CategoryFormProps) {
  const addCategory = useAppStore(s => s.addCategory);
  const updateCategory = useAppStore(s => s.updateCategory);
  const profile = useAppStore(s => s.profile);

  const [name, setName] = useState('');
  const [slice, setSlice] = useState<Slice>('Family');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [icon, setIcon] = useState('Folder');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name);
        setSlice(category.slice);
        setBudgetLimit(category.budget_limit.toString());
        setIcon(category.icon);
      } else {
        setName('');
        setSlice('Family');
        setBudgetLimit('');
        setIcon('Folder');
      }
      setErrorMsg(null);
    }
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    if (!navigator.onLine) {
      setErrorMsg('OFFLINE_MODE — Connect to save changes.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Category name is required');
      return;
    }

    const limitVal = parseFloat(budgetLimit) || 0;
    if (limitVal < 0) {
      setErrorMsg('Limit must be greater than or equal to 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const isBasic = slice === 'Basic';
      const isSubscription = slice === 'Subscription';
      
      // Compute priority target: e.g. purpose 'saving' targets Wealth, 'habit' targets Subscriptions/Other, etc.
      const purpose = profile?.purpose || 'clarity';
      const isPriority = 
        (purpose === 'saving'  && slice === 'Wealth') ||
        (purpose === 'habit'   && (slice === 'Subscription' || name.toLowerCase() === 'other')) ||
        (purpose === 'clarity' && isBasic);

      const payload = {
        name: name.trim(),
        icon,
        slice,
        budget_limit: limitVal,
        is_basic: isBasic,
        is_priority: isPriority,
        is_subscription: isSubscription
      };

      if (category) {
        await updateCategory(category.id, payload);
      } else {
        await addCategory(payload);
      }
      onOpenChange(false);
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || 'An error occurred while saving the category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-[var(--color-border)] rounded-[var(--border-radius)] bg-[var(--color-surface)] shadow-[var(--shadow-neubrutalist)] text-[var(--color-text-main)] p-6">
        <DialogHeader className="border-b border-[var(--color-ink)] border-dashed pb-3 mb-4">
          <DialogTitle 
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-lg font-extrabold uppercase tracking-wide text-[var(--color-ink)]"
          >
            {category ? 'EDIT_BUDGET_CATEGORY' : 'NEW_BUDGET_CATEGORY'}
          </DialogTitle>
          <DialogDescription 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs text-[var(--color-ink-muted)] uppercase"
          >
            {category ? 'Update configuration for this budget bucket.' : 'Create a new budget bucket to track spending.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Name */}
          <div>
            <label 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
            >
              CATEGORY_NAME
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Travel, Groceries"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
            />
          </div>

          {/* Slice Selector */}
          <div className="w-full block text-left space-y-2 clear-both">
            <label className="block text-xs font-mono tracking-wider font-bold text-black dark:text-white uppercase">
              FINANCIAL_SLICE
            </label>
            <div className="w-full block text-sm font-mono text-black dark:text-white break-words whitespace-normal">
              <select
                value={slice}
                onChange={e => setSlice(e.target.value as Slice)}
                style={{ fontFamily: 'var(--font-mono)' }}
                className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150 font-bold uppercase text-xs"
              >
                {(() => {
                  const financialSlices = profile?.enabled_slices;
                  let sliceOptions: unknown;
                  try {
                    sliceOptions = Array.isArray(financialSlices) 
                      ? financialSlices 
                      : typeof financialSlices === 'string'
                        ? JSON.parse(financialSlices)
                        : ['Basic', 'Family', 'Wealth', 'Subscription'];
                  } catch {
                    sliceOptions = ['Basic', 'Family', 'Wealth', 'Subscription'];
                  }

                  const targetOptions = (Array.isArray(sliceOptions) ? sliceOptions : [])
                    .filter((s): s is string => typeof s === 'string');

                  const finalOptions = [...targetOptions];
                  if (category && category.slice && !finalOptions.includes(category.slice)) {
                    finalOptions.push(category.slice);
                  }

                  return finalOptions.map((sliceOption: string) => (
                    <option key={sliceOption} value={sliceOption}>
                      {sliceOption.toUpperCase()}
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>

          {/* Monthly Budget Limit */}
          <div>
            <label 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
            >
              MONTHLY_LIMIT (₦)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0 = No limit"
              value={budgetLimit}
              onChange={e => setBudgetLimit(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
            />
          </div>

          {/* Icon Selector (Basic select) */}
          <div>
            <label 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
            >
              ICON_REPRESENTATION
            </label>
            <select
              value={icon}
              onChange={e => setIcon(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150 font-bold uppercase text-xs"
            >
              <option value="Folder">FOLDER (🗂)</option>
              <option value="UtensilsCrossed">FOOD (🍴)</option>
              <option value="Car">TRANSPORT (🚗)</option>
              <option value="HeartPulse">HEALTH (❤️)</option>
              <option value="Zap">UTILITIES (⚡)</option>
              <option value="ShoppingBag">SHOPPING (🛍)</option>
              <option value="GraduationCap">EDUCATION (🎓)</option>
              <option value="TrendingUp">WEALTH (📈)</option>
              <option value="Tv">SUBSCRIPTION (📺)</option>
              <option value="Wifi">DATA (📶)</option>
              <option value="Music">MUSIC (🎵)</option>
              <option value="MoreHorizontal">OTHER (•••)</option>
            </select>
          </div>

          {errorMsg && (
            <div 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="bg-[var(--color-surface)] border-l-4 border-l-[var(--color-danger)] border-[var(--border-default)] text-[var(--color-danger)] rounded-[var(--border-radius)] p-3 text-xs font-bold mt-4"
            >
              ERROR: {errorMsg}
            </div>
          )}

          <DialogFooter className="border-t border-[var(--color-ink)] border-dashed pt-4 mt-6 gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              style={{ fontFamily: 'var(--font-display)' }}
              className="px-5 py-3 bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--border-default)] rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[var(--shadow-card)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-btn-active)] font-bold text-xs uppercase transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ fontFamily: 'var(--font-display)' }}
              className={`
                px-5 py-3 bg-[var(--color-brand-primary)] text-[#000000] border-[var(--border-default)] 
                rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] hover:-translate-x-[1px] 
                hover:-translate-y-[1px] hover:shadow-[var(--shadow-card)] active:translate-x-[1px] 
                active:translate-y-[1px] active:shadow-[var(--shadow-btn-active)] font-bold text-xs 
                uppercase transition-all duration-100 flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isSubmitting ? 'animate-pulse cursor-wait' : ''}
              `}
            >
              {isSubmitting ? 'SAVING...' : 'SAVE_CATEGORY'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
