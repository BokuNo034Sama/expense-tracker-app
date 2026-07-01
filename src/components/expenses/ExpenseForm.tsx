/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import type { Expense } from '../../store/types';
import { parseBankAlertString, mapCategoryToWorkspace } from '../../utils/parser';
import { useReceiptParser } from '../../hooks/useReceiptParser';

const CACHE_KEY_FORM = 'KINY_TEMP_EXPENSE_FORM';

const isLocalStorageAvailable = () => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && window.localStorage !== null;
  } catch {
    return false;
  }
};

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null; // Edit mode
}

export function ExpenseForm({ open, onOpenChange, expense }: ExpenseFormProps) {
  const addExpense = useAppStore(s => s.addExpense);
  const updateExpense = useAppStore(s => s.updateExpense);
  const deleteExpense = useAppStore(s => s.deleteExpense);
  const categories = useAppStore(s => s.categories);

  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vendorName, setVendorName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!expense) return;
    if (!window.confirm('Delete this receipt? This cannot be undone.')) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await deleteExpense(expense.id);
      onOpenChange(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { isParsing, parseError: ocrError, parseReceipt } = useReceiptParser();
  const finalError = errorMsg || ocrError;

  const handleImageFile = async (file: File) => {
    const validExtensions = ['jpg', 'jpeg', 'png'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !validExtensions.includes(fileExt)) {
      setErrorMsg('Invalid format. Strictly limited to .jpg, .jpeg, and .png.');
      return;
    }

    const result = await parseReceipt(file);
    if (result) {
      setVendorName(result.vendor);
      setAmount(result.amount);
      setTransactionDate(result.date);
      setMemo(result.memo);
      setCategoryId(result.categoryId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (!val) return;
    const { amount: parsedAmount, vendor: parsedVendor, date: parsedDate } = parseBankAlertString(val);
    if (parsedAmount) setAmount(parsedAmount);
    if (parsedVendor) setVendorName(parsedVendor);
    if (parsedDate) setTransactionDate(parsedDate);

    const lowerText = val.toLowerCase();
    const matchedCatId = mapCategoryToWorkspace(lowerText, categories);
    if (matchedCatId) {
      setCategoryId(matchedCatId);
    }
  };

  // Rehydrate form values upon unexpected reload crashes
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;
    const cachedData = localStorage.getItem(CACHE_KEY_FORM);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setAmount(parsed.amount || '');
        setCategoryId(parsed.categoryId || '');
        setTransactionDate(parsed.transactionDate || new Date().toISOString().split('T')[0]);
        setVendorName(parsed.vendorName || '');
        setMemo(parsed.memo || '');
        // Automatically re-open the form view component container
        onOpenChange(true);
      } catch (e) {
        console.error("Failed to restore cached form metrics:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reactively backup the form configuration parameters
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;
    if (open && !expense) {
      localStorage.setItem(CACHE_KEY_FORM, JSON.stringify({
        amount,
        categoryId,
        transactionDate,
        vendorName,
        memo
      }));
    }
  }, [amount, categoryId, transactionDate, vendorName, memo, open, expense]);

  // Clear cache when modal is closed
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;
    if (!open) {
      localStorage.removeItem(CACHE_KEY_FORM);
    }
  }, [open]);

  useEffect(() => {
    if (isParsing) return;

    if (open) {
      if (expense) {
        setTransactionDate(expense.date);
        setVendorName(expense.vendor);
        setCategoryId(expense.category_id || '');
        setAmount(expense.amount.toString());
        setMemo(expense.note || '');
      } else {
        // Only reset to defaults if we don't have a cached form
        const cachedData = isLocalStorageAvailable() ? localStorage.getItem(CACHE_KEY_FORM) : null;
        if (!cachedData) {
          setTransactionDate(new Date().toISOString().split('T')[0]);
          setVendorName('');
          setCategoryId(categories[0]?.id || '');
          setAmount('');
          setMemo('');
        }
      }
      setErrorMsg(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isParsing) return;
    setErrorMsg(null);

    if (!navigator.onLine) {
      setErrorMsg('OFFLINE_MODE — Connect to save changes.');
      return;
    }

    if (!vendorName.trim()) {
      setErrorMsg('Vendor name is required');
      return;
    }

    const amtVal = parseFloat(amount);
    if (isNaN(amtVal) || amtVal <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const matchedCategory = categories.find(c =>
        c.id === categoryId ||
        c.name.toLowerCase() === categoryId.toLowerCase()
      );

      const payload = {
        date: transactionDate,
        vendor: vendorName.trim(),
        category_id: matchedCategory ? matchedCategory.id : null,
        amount: amtVal,
        note: memo.trim() || null
      };

      if (expense) {
        await updateExpense(expense.id, payload);
      } else {
        await addExpense(payload);
      }
      onOpenChange(false);
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || 'An error occurred while saving the expense.');
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
            {expense ? 'EDIT_EXPENSE_LOG' : 'LOG_NEW_EXPENSE'}
          </DialogTitle>
          <DialogDescription
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs text-[var(--color-ink-muted)] uppercase"
          >
            {expense ? 'Update payment information for this log.' : 'Log a new purchase transaction details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Parser */}
          {!expense && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png"
                className="hidden"
              />
              <div className="border-2 border-dashed border-[var(--color-ink-muted)] rounded-[var(--border-radius)] p-3 bg-white/5">
                <label
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="block text-[10px] font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1"
                >
                  ⚡ QUICK_PARSER // PASTE_BANK_ALERT_STRING
                </label>
                <textarea
                  placeholder="Paste your SMS/Bank Alert string here to autofill Vendor & Amount (e.g. Debit: NGN6,500.00 at SHOPRITE)"
                  onChange={handlePasteChange}
                  rows={2}
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[10px] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150 resize-none font-bold"
                />

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-3 p-4 flex flex-col items-center justify-center cursor-pointer border-4 border-[var(--color-ink)] bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[4px_4px_0px_0px_#000000] rounded-[var(--border-radius)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
                >
                  {isParsing ? (
                    <div className="flex flex-col items-center justify-center space-y-2 py-2">
                      <div className="w-6 h-6 border-4 border-[var(--color-ink)] border-t-transparent animate-spin rounded-full"></div>
                      <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] font-bold tracking-widest uppercase animate-pulse">
                        INGESTING_IMAGE_DATA...
                      </span>
                    </div>
                  ) : (
                    <span
                      style={{ fontFamily: 'var(--font-mono)' }}
                      className="text-[10px] font-bold text-center uppercase tracking-wider leading-relaxed"
                    >
                      UPLOAD RECEIPT IMAGE (JPG/JPEG/PNG) — Drag & drop or click to browse bank screenshots.
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          <div>
            <label
              style={{ fontFamily: 'var(--font-mono)' }}
              className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
            >
              VENDOR_NAME
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Shoprite, Uber, Spar"
              value={vendorName}
              onChange={e => setVendorName(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
            />
          </div>

          <div>
            <label
              style={{ fontFamily: 'var(--font-mono)' }}
              className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
            >
              SPENDING_CATEGORY
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150 font-bold uppercase text-xs"
            >
              <option value="">UNCATEGORIZED</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {(c.name || '').toUpperCase()} ({(c.slice || 'UNCATEGORIZED').toUpperCase()})
                </option>
              ))}
            </select>
          </div>

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
              value={transactionDate}
              onChange={e => setTransactionDate(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
            />
          </div>

          <div>
            <label
              style={{ fontFamily: 'var(--font-mono)' }}
              className="block text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase mb-1.5"
            >
              MEMO_OR_NOTE
            </label>
            <input
              type="text"
              placeholder="Add optional notes..."
              value={memo}
              onChange={e => setMemo(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full px-4 py-3 bg-[var(--color-surface)] border-[var(--border-default)] rounded-[var(--border-radius)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:shadow-[var(--shadow-btn)] transition-all duration-150"
            />
          </div>

          {finalError && (
            <div
              style={{ fontFamily: 'var(--font-mono)' }}
              className="bg-[var(--color-surface)] border-l-4 border-l-[var(--color-danger)] border-[var(--border-default)] text-[var(--color-danger)] rounded-[var(--border-radius)] p-3 text-xs font-bold mt-4 animate-shake"
            >
              ERROR: {finalError}
            </div>
          )}

          <DialogFooter className="border-t border-[var(--color-ink)] border-dashed pt-4 mt-6 gap-2 sm:gap-0 flex flex-row items-center justify-between">
            {expense && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                style={{ fontFamily: 'var(--font-display)' }}
                className="px-5 py-3 bg-[var(--color-danger)] text-white border-[var(--border-default)] rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[var(--shadow-card)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-btn-active)] font-bold text-xs uppercase transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed mr-auto"
              >
                {isSubmitting ? '...' : 'DELETE'}
              </button>
            )}
            <div className="flex gap-2 ml-auto">
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
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}