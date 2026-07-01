# Kiny — Feature & Data Sync Fix Pack
**Product:** Kiny Personal Finance OS  
**Type:** Feature Build + Data Display Fix  
**Agent Target:** Claude Code / AI Coding Agent  
**Priority:** P0 (data display) + P1 (feature builds)  
**Last Updated:** July 2026  
**Status:** Ready for Execution

---

## CONTEXT BRIEF

Three issues to resolve in this pack. Execute in order — Issue 3 depends on data state corrected in previous fix packs being correctly applied. Issues 1 and 2 are independent feature builds.

**Do NOT touch:**
- Auth flow, Google OAuth, DB trigger
- `src/lib/advice.ts`
- Any page not mentioned in the file map below
- Streak logic, rollover logic, export logic

**You ARE building/fixing:**
- Individual expense deletion (receipt delete)
- Customer support / feedback email via Resend
- Budget bar zero calculation disconnect
- Dashboard Receipt_log showing 5 instead of 11 receipts

---

## FILE MAP

```
backend/
  server.js              ← Issue 1 (delete endpoint), Issue 2 (support email endpoint)

src/
  store/
    types.ts             ← Issue 1 (deleteExpense action type)
    index.ts             ← Issue 1 (deleteExpense store action)
  components/
    expenses/
      ExpenseTable.tsx   ← Issue 1 (delete button UI)
      ExpenseForm.tsx    ← Issue 1 (delete button if rendered here)
    layout/
      Sidebar.tsx        ← Issue 2 (support link in nav)
    support/
      SupportModal.tsx   ← Issue 2 (NEW FILE — feedback modal)
    dashboard/
      TransactionList.tsx  ← Issue 3 (receipt log null-safe fix)
      RecentExpenses.tsx   ← Issue 3 (if this is the receipt log component)
  pages/
    Budgets.tsx          ← Issue 3 (budget bar calculation fix)

.env.local               ← Issue 2 (VITE_RESEND_API_KEY not needed — key stays backend only)
```

---

# ISSUE 1 — INDIVIDUAL RECEIPT DELETION

---

## [STEP 01] Add `deleteExpense` to `src/store/types.ts`

**Target:** `src/store/types.ts`

Find the `AppStore` interface. If `deleteExpense` is already typed but returns `void` instead of `Promise<void>`, update it. If it's missing, add it:

```typescript
deleteExpense: (id: string) => Promise<void>;
```

### QA
- [ ] `tsc --noEmit` passes after this change

---

## [STEP 02] Implement `deleteExpense` in `src/store/index.ts`

**Target:** `src/store/index.ts`

Find the `deleteExpense` action in the store. It likely currently calls Supabase directly or does nothing. Replace it with a call to the backend endpoint:

```typescript
deleteExpense: async (id: string) => {
  const session = get().auth.session;
  if (!session?.access_token) throw new Error('Not authenticated');

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/expenses/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete expense.');
  }

  // Remove from local store immediately — no need to refetch
  set(s => ({ expenses: s.expenses.filter(e => e.id !== id) }));
},
```

### QA
- [ ] `tsc --noEmit` passes after this change

---

## [STEP 03] Add `DELETE /api/expenses/:id` to `backend/server.js`

**Target:** `backend/server.js`

Add this endpoint. Place it near the other expense-related routes:

```javascript
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const userId    = req.user?.id;
    const expenseId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!expenseId) {
      return res.status(400).json({ error: 'Missing expense ID.' });
    }

    // Verify the expense belongs to this user before deleting
    const { data: existing, error: fetchError } = await supabase
      .from('expenses')
      .select('id, user_id')
      .eq('id', expenseId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Expense not found or does not belong to this user.' });
    }

    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId); // double-scoped for safety

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    return res.status(200).json({ message: 'Expense deleted successfully.', id: expenseId });

  } catch (err) {
    console.error('[KINY] Delete expense error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});
```

### QA
- [ ] `DELETE /api/expenses/:id` with a valid owned expense ID → returns `200`
- [ ] `DELETE /api/expenses/:id` with an expense belonging to a different user → returns `404`
- [ ] `DELETE /api/expenses/:id` with no auth header → returns `401`

---

## [STEP 04] Add Delete Button to Expense List UI

**Target:** `src/components/expenses/ExpenseTable.tsx` (or wherever individual expense rows are rendered — check both `ExpenseTable.tsx` and `RecentExpenses.tsx`)

Find the row render for each expense entry. Add a delete button with a confirmation step:

```tsx
const [deletingId, setDeletingId] = useState<string | null>(null);
const deleteExpense = useAppStore(s => s.deleteExpense);

const handleDelete = async (id: string) => {
  if (!window.confirm('Delete this receipt? This cannot be undone.')) return;
  setDeletingId(id);
  try {
    await deleteExpense(id);
  } catch (err: any) {
    alert(`Failed to delete: ${err.message}`);
  } finally {
    setDeletingId(null);
  }
};
```

Add this button inside the expense row JSX:

```tsx
<button
  onClick={() => handleDelete(expense.id)}
  disabled={deletingId === expense.id}
  style={{ fontFamily: 'var(--font-mono)' }}
  className="p-1.5 border-2 border-[var(--color-danger)] text-[var(--color-danger)] rounded-[var(--border-radius)] shadow-[2px_2px_0px_0px_var(--color-danger)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_var(--color-danger)] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
  title="Delete receipt"
>
  {deletingId === expense.id ? (
    <span className="text-[9px] font-bold">...</span>
  ) : (
    <Trash2 size={13} />
  )}
</button>
```

Import `Trash2` from `lucide-react` at the top of the file.

### QA
- [ ] Delete button visible on each receipt row
- [ ] Clicking prompts confirmation dialog
- [ ] Confirming removes the receipt from the list immediately without page refresh
- [ ] Declining does nothing
- [ ] Deleted receipt does not reappear on page refresh

---

# ISSUE 2 — CUSTOMER SUPPORT EMAIL

---

## [STEP 05] Add Resend API Key to Environment

**Target:** `backend/.env` (or wherever Cloud Run env vars are configured)

Add the following key. Get the value from your Resend dashboard:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
```

Also add this to your Cloud Run service environment variables:
- Go to Cloud Run → `kiny-backend` → Edit & Deploy New Revision → Variables & Secrets
- Add: `RESEND_API_KEY` = your Resend API key value

**Do NOT add this to any frontend `.env` file — it must stay backend-only.**

---

## [STEP 06] Install Resend in Backend

**Target:** `backend/` directory

```bash
npm install resend
```

---

## [STEP 07] Add `POST /api/support` Endpoint to `backend/server.js`

**Target:** `backend/server.js`

Add this import at the top of the file with other requires:

```javascript
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
```

Add this endpoint:

```javascript
app.post('/api/support', async (req, res) => {
  try {
    const userId   = req.user?.id;
    const userEmail = req.user?.email || 'Unknown user';
    const { message, category } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!message || message.trim().length < 5) {
      return res.status(400).json({ error: 'Message is too short. Please provide more detail.' });
    }
    if (message.trim().length > 2000) {
      return res.status(400).json({ error: 'Message exceeds 2000 character limit.' });
    }

    const { error } = await resend.emails.send({
      from:    'Kiny Support <onboarding@resend.dev>', // update to your verified Resend domain if you have one
      to:      ['034.desgn@gmail.com'],
      subject: `[KINY_SUPPORT] ${category || 'General'} — ${userEmail}`,
      html: `
        <div style="font-family: Consolas, monospace; padding: 24px; max-width: 600px;">
          <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">
            KINY_SUPPORT_TICKET
          </h2>
          <hr style="border: 1px solid #000; margin-bottom: 16px;" />
          <p><strong>USER_ID:</strong> ${userId}</p>
          <p><strong>EMAIL:</strong> ${userEmail}</p>
          <p><strong>CATEGORY:</strong> ${category || 'Not specified'}</p>
          <hr style="border: 1px solid #ccc; margin: 16px 0;" />
          <p><strong>MESSAGE:</strong></p>
          <div style="background: #f5f5f5; padding: 16px; border-left: 4px solid #000;">
            ${message.replace(/\n/g, '<br/>')}
          </div>
          <hr style="border: 1px solid #ccc; margin-top: 24px;" />
          <p style="font-size: 11px; color: #888;">Sent from Kiny Finance OS</p>
        </div>
      `,
    });

    if (error) {
      console.error('[KINY] Resend email error:', error);
      return res.status(500).json({ error: 'Failed to send support message. Please try again.' });
    }

    return res.status(200).json({ message: 'Support message sent successfully.' });

  } catch (err) {
    console.error('[KINY] Support endpoint error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});
```

### QA
- [ ] `POST /api/support` with valid auth + message → returns `200`, email arrives at `034.desgn@gmail.com`
- [ ] `POST /api/support` with no auth → returns `401`
- [ ] `POST /api/support` with message under 5 chars → returns `400`
- [ ] `POST /api/support` with message over 2000 chars → returns `400`

---

## [STEP 08] Create `src/components/support/SupportModal.tsx`

**Target:** `src/components/support/SupportModal.tsx` (NEW FILE)

```tsx
import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useAppStore } from '../../store';

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = ['Bug Report', 'Feature Request', 'Data Issue', 'General Feedback'];

export function SupportModal({ open, onClose }: SupportModalProps) {
  const session  = useAppStore(s => s.auth.session);
  const [message,  setMessage]  = useState('');
  const [category, setCategory] = useState('General Feedback');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!message.trim() || message.trim().length < 5) {
      setError('Please enter at least 5 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ message: message.trim(), category }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send.');
      }
      setSuccess(true);
      setMessage('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div
        style={{ fontFamily: 'var(--font-mono)' }}
        className="w-full max-w-md bg-[var(--color-surface)] border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] shadow-[6px_6px_0px_0px_var(--color-ink)] p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--color-ink)] pb-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest">SUPPORT_FEEDBACK</span>
          <button onClick={handleClose} className="hover:opacity-60 transition-opacity">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <p className="text-sm font-bold text-[var(--color-ink)] mb-2">MESSAGE_SENT ✓</p>
            <p className="text-[10px] text-[var(--color-ink-muted)] mb-4">
              We have received your feedback. Thank you.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-[var(--color-ink)] text-[var(--color-primary)] text-xs font-bold border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_var(--color-ink)] hover:opacity-80 transition-opacity rounded-[var(--border-radius)]"
            >
              CLOSE
            </button>
          </div>
        ) : (
          <>
            {/* Category Select */}
            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--color-surface)] border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] text-xs font-bold uppercase outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5">
                MESSAGE ({message.length}/2000)
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="Describe your issue or feedback..."
                className="w-full px-3 py-2.5 bg-[var(--color-surface)] border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] text-xs outline-none resize-none placeholder-[var(--color-ink-muted)]"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-[10px] text-[var(--color-danger)] font-bold mb-3 border-l-4 border-[var(--color-danger)] pl-2">
                ERROR: {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 bg-[var(--color-surface)] border-2 border-[var(--color-ink)] text-xs font-bold uppercase rounded-[var(--border-radius)] shadow-[2px_2px_0px_0px_var(--color-ink)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_var(--color-ink)] transition-all duration-100 disabled:opacity-50"
              >
                CANCEL
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !message.trim()}
                className="flex-1 py-2.5 bg-[var(--color-ink)] text-[var(--color-primary)] border-2 border-[var(--color-ink)] text-xs font-bold uppercase rounded-[var(--border-radius)] shadow-[2px_2px_0px_0px_var(--color-ink)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_var(--color-ink)] transition-all duration-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'SENDING...' : <><Send size={12} /> SEND</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## [STEP 09] Add Support Button to `src/components/layout/Sidebar.tsx`

**Target:** `src/components/layout/Sidebar.tsx`

Add a state variable and the modal to Sidebar:

```tsx
import { SupportModal } from '../support/SupportModal';
import { MessageCircle } from 'lucide-react';

// Inside the component:
const [supportOpen, setSupportOpen] = useState(false);
```

Add the button in the bottom utilities section of the sidebar (above ThemeToggle):

```tsx
<motion.button
  whileHover={{ scale: 1.1 }}
  onClick={() => setSupportOpen(true)}
  className="w-9 h-9 flex items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
  title="Support & Feedback"
>
  <MessageCircle size={20} />
</motion.button>

<SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
```

### QA
- [ ] Support icon visible in sidebar
- [ ] Clicking opens the modal
- [ ] Submitting a valid message → success state shows, email arrives at `034.desgn@gmail.com`
- [ ] Email contains user ID, email, category, and message body
- [ ] Modal closes cleanly with no state residue on reopen

---

# ISSUE 3 — BUDGET BAR ZERO + RECEIPT LOG COUNT MISMATCH

---

## [STEP 10] Fix Budget Bar Calculation in `src/pages/Budgets.tsx`

**Target:** `src/pages/Budgets.tsx`

The budget bars are reading zero because the `sliceSummary` calculation only counts expenses where `categories.find(c => c.id === exp.category_id)` returns a valid category. Expenses with `category_id` pointing to the "Uncategorized" category (slice: 'Family') do count, but only toward 'Family'. The real issue is that `budget_limit` totals are being summed from `categories` (correct) but the spending side may be falling through if any category lookup fails.

Replace the expense accumulator loop with this null-hardened version:

```typescript
// Step 1: Build slice summary from category limits
const sliceSummary = categories.reduce((acc, cat) => {
  const slice = cat.slice;
  if (!acc[slice]) acc[slice] = { totalLimit: 0, totalSpent: 0 };
  acc[slice].totalLimit += (Number(cat.budget_limit) || 0);
  return acc;
}, {} as Record<string, { totalLimit: number; totalSpent: number }>);

// Step 2: Accumulate spending per slice — null-safe
expenses.forEach(exp => {
  if (!exp || !exp.category_id) return; // skip truly uncategorized

  const cat = categories.find(c => c.id === exp.category_id);
  if (!cat?.slice) return; // skip if category not found or has no slice

  if (!sliceSummary[cat.slice]) {
    sliceSummary[cat.slice] = { totalLimit: 0, totalSpent: 0 };
  }
  sliceSummary[cat.slice].totalSpent += (Number(exp.amount) || 0);
});
```

Also ensure the `enabled_slices` parsing uses the safe fallback:

```typescript
const enabledSlices: string[] = profile?.enabled_slices
  ? profile.enabled_slices.split(',').map((s: string) => s.trim()).filter(Boolean)
  : ['Basic', 'Family', 'Wealth', 'Subscription', 'Chop_Life', 'Black_Tax', 'Side_Hustle'];
```

Ensure the budget bar progress percentage has a zero guard:

```typescript
const progressPct = sliceSummary[slice]?.totalLimit > 0
  ? Math.min((sliceSummary[slice].totalSpent / sliceSummary[slice].totalLimit) * 100, 100)
  : 0;
```

### QA
- [ ] Budget page renders all slices (not just zero)
- [ ] Adding a new expense updates the corresponding slice progress bar
- [ ] No `NaN`, `Infinity`, or `undefined` values in any budget figure

---

## [STEP 11] Fix Dashboard Receipt Log — Null-Safe Category Display

**Target:** `src/components/dashboard/TransactionList.tsx` OR `src/components/dashboard/RecentExpenses.tsx` — whichever renders the receipt log with icons on the dashboard

Find the component that renders individual expense rows and uses a category lookup to get the icon/name. It likely has a pattern like:

```typescript
// 🛑 CURRENT — strict lookup, silently drops expenses with null category_id
const category = categories.find(c => c.id === expense.category_id);
if (!category) return null; // ← THIS IS DROPPING 6 RECEIPTS
```

Replace with a null-safe fallback:

```typescript
// ✅ FIXED — always renders, falls back gracefully
const category = categories.find(c => c.id === expense.category_id) ?? {
  name: 'Uncategorized',
  icon: 'HelpCircle',
  slice: 'Family',
};
```

Also ensure the component is not limiting results to only categorized items. Check if there is a `.filter(e => e.category_id !== null)` anywhere in this component and remove it:

```typescript
// DELETE this kind of filter if found:
// const filteredExpenses = expenses.filter(e => e.category_id !== null);

// REPLACE with:
const filteredExpenses = expenses; // show all, fallback handles uncategorized display
```

If the component currently limits to 5 most recent and you want it to show more, update the slice limit:

```typescript
// Show the 8 most recent (or match whatever the design spec calls for)
const recentExpenses = expenses.slice(0, 8);
```

### QA
- [ ] Dashboard receipt log shows all 11 receipts (or however many exist in the DB)
- [ ] Receipts without a valid category show as "Uncategorized" with a fallback icon
- [ ] Receipts are ordered by date descending (most recent first)

---

# PHASE — DEPLOY & VERIFY

## [STEP 12] Build and Deploy

```bash
# Frontend
tsc --noEmit
npm run build
# Deploy to Vercel (auto on push, or manually trigger)

# Backend — redeploy to Cloud Run
gcloud run deploy kiny-backend \
  --source . \
  --region us-central1 \
  --project kinyweb-cf64b
```

---

## FULL QA CHECKLIST

### Issue 1 — Delete Receipt
- [ ] Trash icon visible on every expense row
- [ ] Confirmation dialog appears on click
- [ ] Confirmed delete removes receipt from list instantly
- [ ] Deleted receipt does not reappear on refresh
- [ ] Deleting another user's receipt returns `404` (test via Postman/curl if possible)
- [ ] Duplicate expenses can now be cleaned up

### Issue 2 — Customer Support
- [ ] Support icon visible in Sidebar
- [ ] Modal opens with category selector and message field
- [ ] Submit sends email to `034.desgn@gmail.com`
- [ ] Email includes user email, category, and message
- [ ] Empty or short message rejected with clear error
- [ ] Success state shows after send, modal closes cleanly

### Issue 3 — Budget + Receipt Log
- [ ] Budget bars show non-zero values after adding expenses
- [ ] Progress bars update immediately when new expense is added
- [ ] Dashboard receipt log shows all receipts (target: 11)
- [ ] Receipts without category show as "Uncategorized" not invisible
- [ ] No white screen on Budget page

### Regression
- [ ] `tsc --noEmit` zero errors
- [ ] `npm run build` zero errors
- [ ] Expenses persist across page refresh
- [ ] Streak value persists across page refresh
- [ ] Auth flows (login, signup, Google) still work correctly

---

## DEFINITION OF DONE

- [ ] Individual expense delete works end-to-end with ownership guard
- [ ] Support email sends correctly to `034.desgn@gmail.com` via Resend
- [ ] Budget bars display real spending vs. limit data, not zero
- [ ] Dashboard receipt log shows all expenses including uncategorized
- [ ] Zero TypeScript errors
- [ ] Zero regressions on existing features
