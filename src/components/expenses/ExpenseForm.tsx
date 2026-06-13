/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import type { Expense } from '../../store/types';
import { GoogleGenerativeAI as GoogleGenAI } from '@google/generative-ai';

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null; // Edit mode
}

const parseBankAlert = (text: string) => {
  let parsedAmount = '';
  let parsedVendor = '';
  let parsedDate = '';

  const amountRegexes = [
    /(?:amt|amount|debit|credit|spent|paid|value)[:\s]*(?:ngn|ng|₦|\$)?\s*([\d,]+\.\d{2})/i,
    /(?:ngn|ng|₦|\$)\s*([\d,]+\.\d{2})/i,
    /(?:amt|amount|debit|credit|spent|paid|value)[:\s]*(?:ngn|ng|₦|\$)?\s*([\d,]+)/i,
    /([\d,]+\.\d{2})/
  ];

  for (const regex of amountRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, '');
      if (!isNaN(parseFloat(cleaned))) {
        parsedAmount = cleaned;
        break;
      }
    }
  }

  const vendorRegexes = [
    /(?:at|to|ref|merchant|desc|description|payee)[:\s]+([A-Za-z0-9\s._-]{3,20})/i,
    /paid\s+(?:to|at)\s+([A-Za-z0-9\s._-]{3,20})/i,
    /purchase\s+(?:at|on)\s+([A-Za-z0-9\s._-]{3,20})/i
  ];

  for (const regex of vendorRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length >= 2) {
        parsedVendor = candidate;
        break;
      }
    }
  }

  // Parse Date YYYY-MM-DD
  const dateRegex = /(\d{4}-\d{2}-\d{2}(?:\s+[\d:]+(?:\s*[APap][Mm])?)?)/;
  const dateMatch = text.match(dateRegex);
  if (dateMatch && dateMatch[1]) {
    const extractedDate = dateMatch[1];
    const cleanDate = extractedDate.split(' ')[0].trim();
    parsedDate = cleanDate;
  }

  return { amount: parsedAmount, vendor: parsedVendor, date: parsedDate };
};


export function ExpenseForm({ open, onOpenChange, expense }: ExpenseFormProps) {
  const addExpense = useAppStore(s => s.addExpense);
  const updateExpense = useAppStore(s => s.updateExpense);
  const categories = useAppStore(s => s.categories);

  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vendorName, setVendorName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Helper mapper utility to link AI flags safely to your local budgeting buckets
  const mapCategoryToWorkspace = (suggestion: string): string => {
    const clean = (suggestion || "").toLowerCase();
    
    // Look for utility match
    if (clean.includes("util") || clean.includes("power") || clean.includes("bill")) {
      const match = categories.find(c => {
        const name = c.name.toLowerCase();
        return name.includes("util") || name.includes("power") || name.includes("bill") || name.includes("elect") || name.includes("general");
      });
      if (match) return match.id;
    }
    
    // Look for feeding/groceries match
    if (clean.includes("food") || clean.includes("shop") || clean.includes("feed")) {
      const match = categories.find(c => {
        const name = c.name.toLowerCase();
        return name.includes("feed") || name.includes("food") || name.includes("grocer") || name.includes("shop");
      });
      if (match) return match.id;
    }
    
    // Safely default back to basic tracking, strictly avoiding protected family tokens
    const generalMatch = categories.find(c => {
      const name = c.name.toLowerCase();
      return name.includes("general") || name.includes("transport") || c.is_basic;
    });
    if (generalMatch) return generalMatch.id;
    
    return categories[0]?.id || "";
  };

  // Replace your existing file/image processing trigger with this explicit function
  const handleDirectReceiptOCR = async (file: File) => {
    // 1. Instantly clear form states to prevent stale caching leakage
    setVendorName("INGESTING_IMAGE_DATA...");
    setAmount("");
    setMemo("Analyzing receipt tokens...");
    setCategoryId("");
    setErrorMsg(null);
    setIsParsing(true);

    try {
      // 2. Fetch the Vite-exposed key directly from the browser context
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is missing from your configuration context.");
      }

      // 3. Convert image file to pure Base64 inline tracking fragments
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Cleanly strip the data URL prefix headers
          const pureBase64 = result.split(',')[1];
          resolve(pureBase64);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      // 4. Initialize Gemini directly in the client layout thread
      const genAI = new GoogleGenAI(apiKey);
      // Ensure it targeting stable v1 paths for gemini-1.5-flash
      const model = genAI.getGenerativeModel(
        {
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: "application/json" // Force strict machine-readable strings
          }
        },
        { apiVersion: 'v1' }
      );

      const systemPrompt = `You are an expert financial OCR engine for Kiny Personal Finance OS.
Analyze the uploaded transaction screenshot, debit alert, or invoice.
Extract the transaction date, the exact currency amount as a float, the vendor or beneficiary merchant, and the narration note.
Return ONLY a valid JSON object matching this structural schema exactly, without code blocks or markdown:
{
  "vendor": "string name",
  "amount": number,
  "date": "YYYY-MM-DD",
  "memo": "string notes",
  "category_suggestion": "utilities or food or shopping"
}`;

      // 5. Fire direct API call to Google's edge switches
      const result = await model.generateContent([
        systemPrompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: file.type || "image/jpeg"
          }
        }
      ]);

      const response = await result.response;
      const rawText = response.text();
      
      // 6. Safe JSON Extraction
      const cleanJSON = JSON.parse(rawText.trim());

      // 7. Auto-fill the form with genuine transaction properties
      setVendorName(cleanJSON.vendor || "Unknown Vendor");
      setAmount(cleanJSON.amount ? cleanJSON.amount.toString() : "0.00");
      setTransactionDate(cleanJSON.date || new Date().toISOString().split('T')[0]);
      setMemo(cleanJSON.memo || "Parsed via Kiny AI OCR Engine");
      setCategoryId(mapCategoryToWorkspace(cleanJSON.category_suggestion));

    } catch (err: any) {
      console.error("❌ Kiny Engine Parser Misfire:", err);
      
      // CRITICAL DEBUGGER: Print the exact error on the UI
      const precisionMessage = err.message || JSON.stringify(err);
      setErrorMsg(`ERROR: ${precisionMessage}`);
      
      // Reset inputs on true crash so user isn't stuck with "INGESTING..." strings
      setVendorName("MANUAL_ENTRY_REQUIRED");
      setAmount("");
      setMemo(`Failed: ${precisionMessage.substring(0, 60)}...`);
      
      const basicCat = categories.find(c => c.is_basic) || categories[0];
      if (basicCat) {
        setCategoryId(basicCat.id);
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleImageFile = (file: File) => {
    const validExtensions = ['jpg', 'jpeg', 'png'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !validExtensions.includes(fileExt)) {
      setErrorMsg('Invalid format. Strictly limited to .jpg, .jpeg, and .png.');
      return;
    }
    handleDirectReceiptOCR(file);
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
    const { amount: parsedAmount, vendor: parsedVendor, date: parsedDate } = parseBankAlert(val);
    if (parsedAmount) setAmount(parsedAmount);
    if (parsedVendor) setVendorName(parsedVendor);
    if (parsedDate) setTransactionDate(parsedDate);

    // Auto-detect category from pasted text or parsed vendor name
    const lowerText = val.toLowerCase();
    const matchedCat = categories.find(c => 
      lowerText.includes(c.name.toLowerCase()) || 
      (parsedVendor && parsedVendor.toLowerCase().includes(c.name.toLowerCase()))
    );
    if (matchedCat) {
      setCategoryId(matchedCat.id);
    }
  };


  useEffect(() => {
    if (open) {
      if (expense) {
        setTransactionDate(expense.date);
        setVendorName(expense.vendor);
        setCategoryId(expense.category_id || '');
        setAmount(expense.amount.toString());
        setMemo(expense.note || '');
      } else {
        setTransactionDate(new Date().toISOString().split('T')[0]);
        setVendorName('');
        setCategoryId(categories[0]?.id || '');
        setAmount('');
        setMemo('');
      }
      setIsParsing(false);
      setErrorMsg(null);
    }
  }, [open, expense, categories]);

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
                className="mt-3 p-4 flex flex-col items-center justify-center cursor-pointer border-4 border-black bg-[#F4F4F0] dark:bg-zinc-800 text-black dark:text-white shadow-[4px_4px_0px_0px_#000000] rounded-[var(--border-radius)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  onClick={(e) => e.stopPropagation()}
                  accept=".jpg,.jpeg,.png" 
                  className="hidden" 
                />
                {isParsing ? (
                  <div className="flex flex-col items-center justify-center space-y-2 py-2">
                    <div className="w-6 h-6 border-4 border-black dark:border-white border-t-transparent animate-spin rounded-full"></div>
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
          )}

          {/* Vendor Name */}
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

          {/* Category Select */}
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
                  {c.name.toUpperCase()} ({c.slice.toUpperCase()})
                </option>
              ))}
            </select>
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
              value={transactionDate}
              onChange={e => setTransactionDate(e.target.value)}
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
