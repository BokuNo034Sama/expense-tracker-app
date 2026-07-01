# Kiny — Frontend Refactor & Mobile Architecture Sprint
**Product:** Kiny Personal Finance OS  
**Type:** Frontend Refactor — Code Quality + Mobile UX Overhaul  
**Agent Target:** Claude Code / AI Coding Agent  
**Priority:** P1 — Architecture & UX  
**Last Updated:** July 2026  
**Status:** Ready for Execution

---

## CONTEXT BRIEF

This is a pure frontend refactoring sprint. Zero backend changes. Zero database changes. Zero auth changes. The goal is a modular, mobile-first, design-system-compliant frontend that scales without fragmentation.

**Tech stack reminders (critical — do not get these wrong):**
- OCR parser uses **OpenAI `gpt-4o-mini`** via raw `fetch` to `https://api.openai.com/v1/chat/completions` — NOT Gemini, NOT Vertex AI
- Animations use **Framer Motion** — NOT CSS `max-h` transitions
- All forms use **shadcn/ui Drawer** — NOT Dialog
- State is **Zustand** — derived/computed values use `useMemo` in custom hooks, NEVER stored as Zustand state

**Do NOT touch:**
- `backend/server.js` or any backend file
- `src/store/index.ts` store actions (only add selector hooks in separate files)
- `src/lib/advice.ts`
- `src/lib/supabaseClient.ts`
- Auth flow, onboarding logic, DB trigger
- Any previously fixed rollover/delete guard logic

**Preserve desktop layout exactly.** Every mobile change is strictly scoped to viewports below `md` (768px). The sidebar, table layout, and grid structure on desktop must be pixel-identical to before.

---

## FILE MAP

```
src/
  utils/
    parser.ts                     ← PHASE 1 (NEW FILE)
  hooks/
    useReceiptParser.ts           ← PHASE 2 (NEW FILE)
    useSliceSummary.ts            ← PHASE 3 (NEW FILE)
    useDashboardMetrics.ts        ← PHASE 3 (NEW FILE)
  components/
    layout/
      Sidebar.tsx                 ← PHASE 0, PHASE 7
      BottomTabBar.tsx            ← PHASE 6 (NEW FILE)
      Layout.tsx                  ← PHASE 6 (updated)
    dashboard/
      RecentExpenses.tsx          ← PHASE 0, PHASE 4, PHASE 7, PHASE 9
      RecentExpenseCard.tsx       ← PHASE 7 (NEW FILE)
      BudgetProgress.tsx          ← PHASE 0, PHASE 4, PHASE 7
      BudgetProgressBar.tsx       ← PHASE 7 (NEW FILE)
      SummaryCard.tsx             ← PHASE 3, PHASE 9
    expenses/
      ExpenseForm.tsx             ← PHASE 1, PHASE 2
      ExpenseTable.tsx            ← PHASE 0, PHASE 5, PHASE 7
      ExpenseTableRow.tsx         ← PHASE 7 (NEW FILE)
      ExpenseFilters.tsx          ← PHASE 7 (NEW FILE)
    budgets/
      SliceBreakdownPanel.tsx     ← PHASE 8 (NEW FILE)
    profile/
      PaydayAnchorSelect.tsx      ← PHASE 10
  pages/
    Budgets.tsx                   ← PHASE 3, PHASE 8
```

---

# PHASE 0 — CSS VARIABLE TOKENIZATION

**Risk: Zero. This is find-and-replace only.**

## [REFACTOR-STEP 00] Strip Hardcoded Colors — All Flagged Files

**Target files:**
- `src/components/layout/Sidebar.tsx`
- `src/components/dashboard/RecentExpenses.tsx`
- `src/components/expenses/ExpenseTable.tsx`

### Replacement Map

Search every file for these patterns and replace with the semantic token:

| Find (delete this) | Replace with |
|---|---|
| `dark:bg-zinc-800` | `bg-[var(--color-surface)]` |
| `dark:bg-zinc-900` | `bg-[var(--color-surface)]` |
| `dark:border-white` | `border-[var(--border-default)]` |
| `border-black` | `border-[var(--color-ink)]` |
| `text-gray-400` | `text-[var(--color-ink-muted)]` |
| `text-gray-500` | `text-[var(--color-ink-muted)]` |
| `hover:bg-neutral-900` | `hover:bg-[var(--color-ink)]/10` |
| `hover:bg-white/10` | `hover:bg-[var(--color-ink)]/5` |
| `bg-lime-400` | `bg-[var(--color-primary)]` |
| `text-lime-400` | `text-[var(--color-primary)]` |

### QA
- [ ] Search entire `src/` for `dark:bg-zinc` — zero results
- [ ] Search for `dark:border-white` — zero results
- [ ] Search for `text-gray-` — zero results
- [ ] Search for `hover:bg-neutral-` — zero results
- [ ] `tsc --noEmit` passes

---

# PHASE 1 — PARSER EXTRACTION

## [REFACTOR-STEP 01] Create `src/utils/parser.ts`

**Target:** NEW FILE `src/utils/parser.ts`  
**Source:** Extract from `src/components/expenses/ExpenseForm.tsx`

Create this file with the following exported pure functions:

```typescript
// src/utils/parser.ts

export interface ParsedBankAlert {
  amount: string;
  vendor: string;
  date: string;
}

/**
 * Parses Nigerian bank SMS alert strings to extract transaction data.
 * Pure function — no side effects, no state dependencies.
 */
export function parseBankAlertString(text: string): ParsedBankAlert {
  let parsedAmount = '';
  let parsedVendor = '';
  let parsedDate   = '';

  const amountRegexes = [
    /(?:amt|amount|debit|credit|spent|paid|value)[:\s]*(?:ngn|ng|₦|\$)?\s*([\d,]+\.\d{2})/i,
    /(?:ngn|ng|₦|\$)\s*([\d,]+\.\d{2})/i,
    /(?:amt|amount|debit|credit|spent|paid|value)[:\s]*(?:ngn|ng|₦|\$)?\s*([\d,]+)/i,
    /([\d,]+\.\d{2})/,
  ];

  for (const regex of amountRegexes) {
    const match = text.match(regex);
    if (match?.[1]) {
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
    /purchase\s+(?:at|on)\s+([A-Za-z0-9\s._-]{3,20})/i,
  ];

  for (const regex of vendorRegexes) {
    const match = text.match(regex);
    if (match?.[1]) {
      const candidate = match[1].trim();
      if (candidate.length >= 2) {
        parsedVendor = candidate;
        break;
      }
    }
  }

  const dateMatch = text.match(/(\d{4}-\d{2}-\d{2}(?:\s+[\d:]+(?:\s*[APap][Mm])?)?)/);
  if (dateMatch?.[1]) {
    parsedDate = dateMatch[1].split(' ')[0].trim();
  }

  return { amount: parsedAmount, vendor: parsedVendor, date: parsedDate };
}

/**
 * Maps a vendor/category suggestion string to the closest matching
 * category ID in the user's active category list.
 */
export function mapCategoryToWorkspace(
  suggestion: string,
  categories: Array<{ id: string; name: string; is_basic: boolean }>
): string {
  const clean = (suggestion || '').toLowerCase();

  if (clean.includes('util') || clean.includes('power') || clean.includes('bill')) {
    const match = categories.find(c => {
      const name = c.name.toLowerCase();
      return name.includes('util') || name.includes('power') || name.includes('bill') || name.includes('elect');
    });
    if (match) return match.id;
  }

  if (clean.includes('food') || clean.includes('shop') || clean.includes('feed')) {
    const match = categories.find(c => {
      const name = c.name.toLowerCase();
      return name.includes('feed') || name.includes('food') || name.includes('grocer') || name.includes('shop');
    });
    if (match) return match.id;
  }

  if (clean.includes('transport') || clean.includes('fuel') || clean.includes('uber') || clean.includes('bolt')) {
    const match = categories.find(c => c.name.toLowerCase().includes('transport'));
    if (match) return match.id;
  }

  const basicFallback = categories.find(c => c.is_basic) || categories[0];
  return basicFallback?.id || '';
}
```

### Task — Update `ExpenseForm.tsx`

1. Add import at top of `ExpenseForm.tsx`:
```typescript
import { parseBankAlertString, mapCategoryToWorkspace } from '../../utils/parser';
```

2. Delete the `parseBankAlert` function body from `ExpenseForm.tsx` — it is now in `parser.ts`
3. Delete the `mapCategoryToWorkspace` function body from `ExpenseForm.tsx`
4. Update all calls to use the imported functions, passing `categories` as the second argument to `mapCategoryToWorkspace`

### QA
- [ ] `parseBankAlert` and `mapCategoryToWorkspace` no longer defined in `ExpenseForm.tsx`
- [ ] Bank alert paste still autofills vendor and amount correctly
- [ ] `tsc --noEmit` passes

---

# PHASE 2 — RECEIPT PARSER HOOK

## [REFACTOR-STEP 02] Create `src/hooks/useReceiptParser.ts`

**Target:** NEW FILE `src/hooks/useReceiptParser.ts`

Extract the OpenAI OCR fetch logic from `ExpenseForm.tsx` into this hook:

```typescript
// src/hooks/useReceiptParser.ts
import { useState } from 'react';
import { mapCategoryToWorkspace } from '../utils/parser';
import { useAppStore } from '../store';

export interface ParsedReceipt {
  vendor:              string;
  amount:              string;
  date:                string;
  memo:                string;
  categoryId:          string;
}

export interface UseReceiptParserReturn {
  isParsing:     boolean;
  parseError:    string | null;
  parseReceipt:  (file: File) => Promise<ParsedReceipt | null>;
}

export function useReceiptParser(): UseReceiptParserReturn {
  const categories = useAppStore(s => s.categories);
  const [isParsing,  setIsParsing]  = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const parseReceipt = async (file: File): Promise<ParsedReceipt | null> => {
    setIsParsing(true);
    setParseError(null);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) throw new Error('VITE_OPENAI_API_KEY missing from environment.');

      let safeMimeType = file.type;
      if (!safeMimeType) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        safeMimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      }

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model:           'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role:    'system',
              content: `You are a financial parsing engine. Extract values and return ONLY this JSON shape:
{"vendor": string, "amount": number, "date": "YYYY-MM-DD", "memo": string, "category_suggestion": "utilities"|"food"|"shopping"|"transport"|"other"}`,
            },
            {
              role:    'user',
              content: [
                { type: 'text',      text: 'Extract transaction details from this image.' },
                { type: 'image_url', image_url: { url: `data:${safeMimeType};base64,${base64Data}` } },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI ${res.status}: ${errText}`);
      }

      const data      = await res.json();
      const cleanJSON = JSON.parse(data.choices[0].message.content);

      return {
        vendor:     cleanJSON.vendor    || 'Unknown Merchant',
        amount:     cleanJSON.amount    ? cleanJSON.amount.toString() : '',
        date:       cleanJSON.date      || new Date().toISOString().split('T')[0],
        memo:       cleanJSON.memo      || '',
        categoryId: mapCategoryToWorkspace(cleanJSON.category_suggestion || '', categories),
      };

    } catch (err: any) {
      console.error('[KINY] Receipt parse error:', err);
      setParseError(err.message || 'Failed to parse receipt image.');
      return null;
    } finally {
      setIsParsing(false);
    }
  };

  return { isParsing, parseError, parseReceipt };
}
```

### Task — Update `ExpenseForm.tsx`

1. Replace all local OCR-related state and the `handleDirectReceiptOCR` function with the hook:

```typescript
// Replace this in ExpenseForm.tsx:
const { isParsing, parseError: ocrError, parseReceipt } = useReceiptParser();

const handleImageFile = async (file: File) => {
  const validExtensions = ['jpg', 'jpeg', 'png'];
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (!fileExt || !validExtensions.includes(fileExt)) {
    setErrorMsg('Invalid format. Accepted: .jpg, .jpeg, .png');
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
```

2. Remove: local `isParsing` useState, the old `handleDirectReceiptOCR` function, the old `apiKey` fetch block
3. Keep: `handleDragOver`, `handleDrop`, `handleFileChange`, `handlePasteChange` — these now call the simplified `handleImageFile`

### QA
- [ ] Receipt upload still works — fields populate from OCR
- [ ] Loading spinner still shows during parse
- [ ] Error state still renders if parse fails
- [ ] `ExpenseForm.tsx` is visibly shorter (target: under 300 lines)
- [ ] `tsc --noEmit` passes

---

# PHASE 3 — SELECTOR HOOKS

**Important:** These are `useMemo` hooks — NOT Zustand store state. Raw data stays in the store. Derived values live here.

## [REFACTOR-STEP 03A] Create `src/hooks/useSliceSummary.ts`

```typescript
// src/hooks/useSliceSummary.ts
import { useMemo } from 'react';
import { useAppStore } from '../store';

export interface SliceMetric {
  totalLimit: number;
  totalSpent: number;
  progressPct: number;
}

export function useSliceSummary() {
  const categories = useAppStore(s => s.categories);
  const expenses   = useAppStore(s => s.expenses);

  return useMemo(() => {
    const summary = categories.reduce((acc, cat) => {
      const slice = cat.slice;
      if (!acc[slice]) acc[slice] = { totalLimit: 0, totalSpent: 0, progressPct: 0 };
      acc[slice].totalLimit += (Number(cat.budget_limit) || 0);
      return acc;
    }, {} as Record<string, SliceMetric>);

    expenses.forEach(exp => {
      if (!exp?.category_id) return;
      const cat = categories.find(c => c.id === exp.category_id);
      if (cat?.slice && summary[cat.slice]) {
        summary[cat.slice].totalSpent += (Number(exp.amount) || 0);
      }
    });

    // Compute progress percentages
    Object.keys(summary).forEach(slice => {
      const { totalLimit, totalSpent } = summary[slice];
      summary[slice].progressPct = totalLimit > 0
        ? Math.min((totalSpent / totalLimit) * 100, 100)
        : 0;
    });

    return summary;
  }, [categories, expenses]);
}
```

## [REFACTOR-STEP 03B] Create `src/hooks/useDashboardMetrics.ts`

```typescript
// src/hooks/useDashboardMetrics.ts
import { useMemo } from 'react';
import { useAppStore } from '../store';

export function useDashboardMetrics() {
  const expenses   = useAppStore(s => s.expenses);
  const incomes    = useAppStore(s => s.incomes);
  const categories = useAppStore(s => s.categories);

  return useMemo(() => {
    const now = new Date();
    const thisMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalSpent = thisMonthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalIncome = incomes
      .filter(i => {
        const d = new Date(i.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const transactionCount = thisMonthExpenses.length;
    const remainingBalance = totalIncome - totalSpent;

    // Top category by spend
    const spendByCategory: Record<string, number> = {};
    thisMonthExpenses.forEach(e => {
      if (e.category_id) {
        spendByCategory[e.category_id] = (spendByCategory[e.category_id] || 0) + e.amount;
      }
    });
    const topCategoryId = Object.entries(spendByCategory)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    const topCategory = categories.find(c => c.id === topCategoryId)?.name || 'None';

    return { totalSpent, totalIncome, transactionCount, remainingBalance, topCategory };
  }, [expenses, incomes, categories]);
}
```

### Task — Update consuming components

Replace inline calculations in `SummaryCard.tsx` and `Budgets.tsx` with these hooks:

```typescript
// In SummaryCard.tsx — replace inline calculation with:
const { totalSpent, transactionCount, topCategory, remainingBalance } = useDashboardMetrics();

// In Budgets.tsx — replace sliceSummary reduce block with:
const sliceSummary = useSliceSummary();
```

### QA
- [ ] Dashboard summary cards show correct values
- [ ] Budget page slice totals still calculate correctly
- [ ] Adding an expense updates both dashboard and budget without page refresh
- [ ] `tsc --noEmit` passes

---

# PHASE 4 — MOBILE GRID UPGRADE

## [REFACTOR-STEP 04] Upgrade All Dashboard Grid Configurations

**Target files:**
- `src/components/dashboard/RecentExpenses.tsx`
- `src/components/dashboard/BudgetProgress.tsx`
- `src/pages/DashboardPage.tsx` (or wherever the main bento grid is defined)

Find every `grid-cols-2` in these files. Replace with:

```tsx
// BEFORE:
className="grid grid-cols-2 gap-4"

// AFTER:
className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
```

For tiles that should stay full-width even at `lg` (like WealthCard, SpendingChart):
```tsx
className="grid grid-cols-1 gap-4 sm:grid-cols-2"
```

### QA
- [ ] On 375px viewport: all tiles stack single column, no text clipping
- [ ] On 768px viewport: tiles display in 2 columns
- [ ] On 1280px viewport: tiles display in 3 columns where applicable
- [ ] No Naira values are clipped or overlapping on any viewport

---

# PHASE 5 — TABLE-TO-CARD MOBILE TRANSFORMATION

## [REFACTOR-STEP 05] Responsive ExpenseTable — Card on Mobile, Table on Desktop

**Target:** `src/components/expenses/ExpenseTable.tsx`

The `<table>` element must render on `md` and above. Below `md`, each row becomes a Neubrutalist bento card.

### Task A — Wrap existing table with responsive display

```tsx
{/* Desktop table — hidden on mobile */}
<div className="hidden md:block">
  <table className="w-full">
    {/* existing table markup unchanged */}
  </table>
</div>

{/* Mobile card list — hidden on desktop */}
<div className="block md:hidden space-y-3">
  {filteredExpenses.map(expense => (
    <MobileExpenseCard
      key={expense.id}
      expense={expense}
      category={categories.find(c => c.id === expense.category_id)}
      onEdit={() => handleEdit(expense)}
      onDelete={() => handleDelete(expense.id)}
    />
  ))}
</div>
```

### Task B — Create `MobileExpenseCard` inline in the same file (or as a sub-component)

```tsx
interface MobileExpenseCardProps {
  expense:  ExpenseRow;
  category: CategoryRow | undefined;
  onEdit:   () => void;
  onDelete: () => void;
}

function MobileExpenseCard({ expense, category, onEdit, onDelete }: MobileExpenseCardProps) {
  const catName  = category?.name  || 'Uncategorized';
  const catIcon  = category?.icon  || 'HelpCircle';
  const catSlice = category?.slice || 'Family';

  const formattedDate = new Date(expense.date).toLocaleDateString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <div
      style={{ fontFamily: 'var(--font-mono)' }}
      className="flex items-center gap-3 p-3 bg-[var(--color-surface)] border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] shadow-[3px_3px_0px_0px_var(--color-ink)]"
    >
      {/* Left Hub — Icon */}
      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[var(--color-primary)] border-2 border-[var(--color-ink)] rounded-lg">
        <span className="text-[var(--color-ink)] text-xs font-bold">
          {catName.slice(0, 2).toUpperCase()}
        </span>
      </div>

      {/* Centre — Merchant + Meta */}
      <div className="flex-1 min-w-0">
        <p className="text-[var(--color-ink)] font-bold text-sm truncate leading-tight">
          {expense.vendor}
        </p>
        <p className="text-[var(--color-ink-muted)] text-[10px] uppercase tracking-wide mt-0.5">
          {catSlice} · {formattedDate}
        </p>
      </div>

      {/* Right Hub — Amount + Actions */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span
          className="text-[var(--color-ink)] font-bold text-sm tabular-nums"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          ₦{Number(expense.amount).toLocaleString('en-NG')}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={onEdit}
            className="p-1 border border-[var(--color-ink)] rounded text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-primary)] transition-colors"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 border border-[var(--color-danger)] rounded text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

Import `Pencil` and `Trash2` from `lucide-react`.

### QA
- [ ] On mobile: table is not visible, cards render
- [ ] On desktop: cards are not visible, table renders
- [ ] Vendor names truncate cleanly with `truncate` class — no overflow
- [ ] Amount is right-aligned and never wraps
- [ ] Edit and delete work on mobile card same as desktop table

---

# PHASE 6 — MOBILE BOTTOM TAB BAR

## [REFACTOR-STEP 06A] Create `src/components/layout/BottomTabBar.tsx`

**Critical rule:** This component renders ONLY on mobile (below `md`). Desktop navigation remains unchanged via `Sidebar.tsx`.

```tsx
// src/components/layout/BottomTabBar.tsx
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CreditCard, Receipt, TrendingUp, User } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { to: '/',         icon: Home,        label: 'HOME'     },
  { to: '/budgets',  icon: CreditCard,  label: 'BUDGETS'  },
  { to: '/expenses', icon: Receipt,     label: 'EXPENSES' },
  { to: '/income',   icon: TrendingUp,  label: 'INCOME'   },
  { to: '/profile',  icon: User,        label: 'PROFILE'  },
];

export function BottomTabBar() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--color-ink)] border-t-2 border-[var(--color-ink)] safe-area-inset-bottom"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[var(--color-primary)] rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                className={isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-ink-muted)]'
                }
              />
              <span
                style={{ fontFamily: 'var(--font-mono)' }}
                className={`text-[8px] font-bold tracking-widest uppercase ${
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-ink-muted)]'
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
```

## [REFACTOR-STEP 06B] Update `src/components/layout/Layout.tsx`

Add `BottomTabBar` and bottom padding so content isn't hidden behind it on mobile:

```tsx
import { BottomTabBar } from './BottomTabBar';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* Main content — offset for sidebar on desktop, padded for bottom bar on mobile */}
      <main className="ml-0 md:ml-[72px] flex-1 min-h-screen bg-[var(--color-bg)] pb-16 md:pb-0">
        {children}
      </main>

      {/* Bottom tab bar — mobile only */}
      <BottomTabBar />
    </div>
  );
}
```

### QA
- [ ] On mobile: bottom tab bar renders, sidebar does NOT render
- [ ] On desktop: sidebar renders, bottom tab bar does NOT render
- [ ] Active route shows lime indicator on the active tab
- [ ] `layoutId` spring animation transitions smoothly between tabs
- [ ] Page content is NOT hidden behind the bottom bar (check bottom of each page on mobile)
- [ ] iOS safe area inset respected (no bar clipping on iPhone notch devices)

---

# PHASE 7 — SUB-COMPONENT EXTRACTION

## [REFACTOR-STEP 07A] Create `SidebarLink` in `Sidebar.tsx`

Extract the repeated nav link pattern into a sub-component at the top of `Sidebar.tsx`:

```tsx
interface SidebarLinkProps {
  to:       string;
  icon:     React.ComponentType<{ size?: number; className?: string }>;
  label:    string;
  isActive: boolean;
}

function SidebarLink({ to, icon: Icon, label, isActive }: SidebarLinkProps) {
  return (
    <NavLink to={to} title={label}>
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
          isActive
            ? 'bg-[var(--color-primary)]'
            : 'hover:bg-[var(--color-ink)]/10'
        }`}
      >
        <Icon
          size={20}
          className={isActive ? 'text-[var(--color-ink)]' : 'text-white'}
        />
      </motion.div>
    </NavLink>
  );
}
```

Replace all duplicated nav link JSX in `Sidebar.tsx` with `<SidebarLink />` instances.

## [REFACTOR-STEP 07B] Create `src/components/dashboard/BudgetProgressBar.tsx`

```tsx
// src/components/dashboard/BudgetProgressBar.tsx
interface BudgetProgressBarProps {
  label:       string;
  spent:       number;
  limit:       number;
  progressPct: number;
}

export function BudgetProgressBar({ label, spent, limit, progressPct }: BudgetProgressBarProps) {
  const barColor =
    progressPct >= 80 ? 'bg-[var(--color-danger)]' :
    progressPct >= 60 ? 'bg-[var(--color-warn)]'   :
    'bg-[var(--color-ink)]';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink)]"
        >
          {label}
        </span>
        <span
          style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
          className="text-[10px] text-[var(--color-ink-muted)]"
        >
          ₦{Number(spent).toLocaleString('en-NG')} / ₦{Number(limit).toLocaleString('en-NG')}
        </span>
      </div>
      <div className="h-2.5 w-full bg-[var(--color-ink)]/10 border border-[var(--color-ink)] rounded-none">
        <motion.div
          className={`h-full ${barColor} rounded-none`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  );
}
```

Update `BudgetProgress.tsx` to use `<BudgetProgressBar />` instead of inline progress bar JSX.

## [REFACTOR-STEP 07C] Create `src/components/dashboard/RecentExpenseCard.tsx`

Extract individual expense card rendering from `RecentExpenses.tsx`:

```tsx
// src/components/dashboard/RecentExpenseCard.tsx
interface RecentExpenseCardProps {
  expense:  ExpenseRow;
  category: CategoryRow | undefined;
}

export function RecentExpenseCard({ expense, category }: RecentExpenseCardProps) {
  const catName = category?.name || 'Uncategorized';

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--color-ink)]/10 last:border-0">
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-[var(--color-primary)] border-2 border-[var(--color-ink)] rounded">
        <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[9px] font-bold text-[var(--color-ink)]">
          {catName.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-semibold text-[var(--color-ink)] truncate">
          {expense.vendor}
        </p>
        <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-[var(--color-ink-muted)] uppercase">
          {catName}
        </p>
      </div>
      <span
        style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
        className="text-sm font-bold text-[var(--color-ink)] flex-shrink-0"
      >
        ₦{Number(expense.amount).toLocaleString('en-NG')}
      </span>
    </div>
  );
}
```

Update `RecentExpenses.tsx` to use `<RecentExpenseCard />`.

### QA
- [ ] `SidebarLink` used for all nav items in Sidebar — no duplicated wrapper classes
- [ ] `BudgetProgressBar` used in BudgetProgress.tsx — progress animation works
- [ ] `RecentExpenseCard` used in RecentExpenses.tsx
- [ ] `tsc --noEmit` passes

---

# PHASE 8 — SLICE BREAKDOWN PANEL

## [REFACTOR-STEP 08] Extract TRENDS Panel from `Budgets.tsx`

**Target:** `src/components/budgets/SliceBreakdownPanel.tsx` (NEW FILE)

Create the panel component:

```tsx
// src/components/budgets/SliceBreakdownPanel.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { BudgetProgressBar } from '../dashboard/BudgetProgressBar';
import { useSliceSummary } from '../../hooks/useSliceSummary';

interface SliceBreakdownPanelProps {
  isOpen: boolean;
}

export function SliceBreakdownPanel({ isOpen }: SliceBreakdownPanelProps) {
  const sliceSummary = useSliceSummary();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="overflow-hidden"
        >
          <div className="bg-[var(--color-surface)] border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] shadow-[var(--shadow-card)] p-4 space-y-4 mt-3">
            <span
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)]"
            >
              SLICE_BREAKDOWN
            </span>
            {Object.entries(sliceSummary).map(([slice, metrics]) => (
              <BudgetProgressBar
                key={slice}
                label={slice.replace('_', ' ')}
                spent={metrics.totalSpent}
                limit={metrics.totalLimit}
                progressPct={metrics.progressPct}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

Update `Budgets.tsx` — replace the inline TRENDS toggle block with:

```tsx
<SliceBreakdownPanel isOpen={showTrends} />
```

### QA
- [ ] TRENDS panel expands and collapses with spring animation — no layout pop
- [ ] Panel height adjusts to content automatically — never clips if content is tall
- [ ] All slice progress bars render correctly inside panel

---

# PHASE 9 — CLS FIX (TABULAR NUMBERS)

## [REFACTOR-STEP 09] Fix Cumulative Layout Shift on Metric Values

**Target files:**
- `src/components/dashboard/SummaryCard.tsx`
- Any component rendering masked vs unmasked Naira values (`₦••••••` ↔ `₦150,000`)

### Task A — Add `tabular-nums` to all monetary displays

Every element rendering a Naira value or masked metric must have:

```tsx
style={{ fontVariantNumeric: 'tabular-nums' }}
```

Or via Tailwind if you add it to the config:
```tsx
className="font-mono tabular-nums"
```

### Task B — Fix masked value width

The masked string (`₦••••••`) and the real value (`₦150,000`) must occupy the same width. Use a fixed min-width container:

```tsx
<span
  style={{ fontVariantNumeric: 'tabular-nums', minWidth: '7ch' }}
  className="font-mono font-bold text-[var(--color-ink)] inline-block text-right"
>
  {isMasked ? '₦••••••' : `₦${value.toLocaleString('en-NG')}`}
</span>
```

`7ch` = 7 character widths in monospace, enough for `₦999,999`. Adjust to `10ch` if values can exceed ₦999,999.

### QA
- [ ] Toggle masked/unmasked state on SummaryCard — no layout shift visible
- [ ] All Naira values use `tabular-nums` — no number width oscillation
- [ ] No skeleton or min-height hacks needed

---

# PHASE 10 — PAYDAY ANCHOR DRAWER UPGRADE

## [REFACTOR-STEP 10] Upgrade `PaydayAnchorSelect` to Bottom Drawer Sheet

**Target:** `src/components/profile/PaydayAnchorSelect.tsx`

Replace the HTML `<select>` for anchor day with a Framer Motion bottom drawer:

```tsx
// src/components/profile/PaydayAnchorSelect.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface PaydayAnchorSelectProps {
  value:    number | null;
  onChange: (day: number) => void;
}

const ANCHOR_DAYS = Array.from({ length: 7 }, (_, i) => 25 + i); // 25–31

export function PaydayAnchorSelect({ value, onChange }: PaydayAnchorSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{ fontFamily: 'var(--font-mono)' }}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] text-xs font-bold uppercase text-[var(--color-ink)]"
      >
        <span>{value ? `${value}${value === 1 ? 'ST' : value === 2 ? 'ND' : value === 3 ? 'RD' : 'TH'} OF MONTH` : 'SELECT PAYDAY'}</span>
        <ChevronDown size={14} />
      </button>

      {/* Bottom drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/50"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t-2 border-[var(--color-ink)] rounded-t-2xl p-6 safe-area-inset-bottom"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            >
              <div className="w-10 h-1 bg-[var(--color-ink)]/20 rounded-full mx-auto mb-6" />
              <p style={{ fontFamily: 'var(--font-mono)' }} className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] mb-4">
                SELECT_PAYDAY_ANCHOR
              </p>
              <div className="grid grid-cols-4 gap-3">
                {ANCHOR_DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => { onChange(day); setIsOpen(false); }}
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className={`py-4 text-sm font-bold border-2 border-[var(--color-ink)] rounded-[var(--border-radius)] transition-all ${
                      value === day
                        ? 'bg-[var(--color-primary)] text-[var(--color-ink)] shadow-[var(--shadow-btn)]'
                        : 'bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-primary)]/20'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
```

### QA
- [ ] Tapping the anchor day field opens the bottom drawer on mobile
- [ ] Selected day highlights in lime
- [ ] Tapping a day closes the drawer and updates the value
- [ ] Tapping the backdrop closes the drawer without selecting
- [ ] Works correctly on desktop too (renders as a wide-centered drawer)

---

# PHASE 11 — BUILD VERIFICATION

## [REFACTOR-STEP 11] Final Compile and Regression Check

```bash
tsc --noEmit
npm run build
```

Both must pass with zero errors.

---

## FULL QA CHECKLIST

### Code Quality
- [ ] `parseBankAlert` and `mapCategoryToWorkspace` no longer exist in `ExpenseForm.tsx`
- [ ] `ExpenseForm.tsx` is under 300 lines
- [ ] No inline slice/total calculations remain in `Budgets.tsx` or `SummaryCard.tsx`
- [ ] No `dark:bg-zinc-*` or `text-gray-*` remain in any file (search confirms)
- [ ] No `dark:border-white` or `hover:bg-neutral-*` remain (search confirms)

### Mobile Layout (test at 375px)
- [ ] All dashboard tiles stack single column — no clipping
- [ ] Expense list renders cards, not table rows
- [ ] Bottom tab bar visible and functional
- [ ] Sidebar NOT visible on mobile
- [ ] Content is NOT hidden behind bottom tab bar
- [ ] No Naira values clip or overlap on any viewport

### Desktop Layout (test at 1280px)
- [ ] Sidebar visible, bottom tab bar NOT visible
- [ ] Table layout renders for expense list
- [ ] 3-column bento grid where applicable

### Functional Regression
- [ ] Bank alert paste still autofills form correctly
- [ ] Receipt image upload still parses via OpenAI `gpt-4o-mini`
- [ ] Budget bars update when expense is added
- [ ] Streak persists across refresh
- [ ] Expenses persist across refresh
- [ ] Auth flow (login, signup, Google) unchanged
- [ ] Delete receipt works
- [ ] Support modal sends email

### Design System
- [ ] All monetary values use `tabular-nums` — no layout shift on mask toggle
- [ ] TRENDS panel expands/collapses with spring animation, no hard pop
- [ ] BudgetProgressBar animates width on mount
- [ ] Bottom tab bar active indicator slides with `layoutId` spring

---

## DEFINITION OF DONE

- [ ] `tsc --noEmit` zero errors
- [ ] `npm run build` zero errors
- [ ] `ExpenseForm.tsx` under 300 lines
- [ ] Zero hardcoded dark mode color classes in any component
- [ ] Mobile viewport (375px) shows single-column cards with no clipping
- [ ] Desktop viewport (1280px) unchanged from before this sprint
- [ ] Bottom tab bar renders on mobile, sidebar renders on desktop — never both
- [ ] All 11 functional regression checks pass
