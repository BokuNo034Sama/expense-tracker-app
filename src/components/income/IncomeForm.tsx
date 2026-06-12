import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import type { Income, IncomeSource } from '../../store/types';

interface IncomeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income?: Income | null; // Edit mode
}

export function IncomeForm({ open, onOpenChange, income }: IncomeFormProps) {
  const addIncome = useAppStore(s => s.addIncome);
  const updateIncome = useAppStore(s => s.updateIncome);

  const [source, setSource] = useState<IncomeSource>('Salary');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (income) {
        setSource(income.source);
        setAmount(income.amount.toString());
        setDate(income.date);
        setNote(income.note || '');
      } else {
        setSource('Salary');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
      }
      setErrorMsg(null);
    }
  }, [open, income]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    if (!navigator.onLine) {
      setErrorMsg('OFFLINE_MODE — Connect to save changes.');
      return;
    }

    const amtVal = parseFloat(amount);
    if (isNaN(amtVal) || amtVal <= 0) {
      setErrorMsg('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        source,
        amount: amtVal,
        date,
        note: note.trim() || null
      };

      if (income) {
        await updateIncome(income.id, payload);
      } else {
        await addIncome(payload);
      }
      onOpenChange(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving income.');
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
            {income ? 'EDIT_INCOME_LOG' : 'LOG_NEW_INCOME'}
          </DialogTitle>
          <DialogDescription 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs text-[var(--color-ink-muted)] uppercase"
          >
            {income ? 'Modify the details of your logged income.' : 'Enter the incoming revenue stream to track.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Selection */}
          <div>
            <label 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
            >
              INCOME_SOURCE
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Salary', 'Business', 'Gifting'] as IncomeSource[]).map(src => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSource(src)}
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className={`py-2 px-3 text-xs font-bold border-[var(--border-default)] rounded-[var(--border-radius)] transition-all duration-100 uppercase ${source === src ? 'bg-[var(--color-brand-primary)] text-[#000000] shadow-[var(--shadow-btn-active)] translate-x-[0.5px] translate-y-[0.5px]' : 'bg-[var(--color-surface)]'}`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          {/* Amount field */}
          <div>
            <label 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
            >
              AMOUNT (₦)
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
            />
          </div>

          {/* Date field */}
          <div>
            <label 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
            >
              TRANSACTION_DATE
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
            />
          </div>

          {/* Note field */}
          <div>
            <label 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
            >
              NOTE_OR_MEMO
            </label>
            <input
              type="text"
              placeholder="Salary payment, client payment, etc."
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
            />
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
              {isSubmitting ? 'SAVING...' : 'SAVE_RECORD'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
