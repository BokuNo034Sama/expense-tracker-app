# Kiny — Data Loss & Infinite Rollover Bug Fix Pack
**Product:** Kiny Personal Finance OS  
**Type:** Critical Data Integrity Fix PRD  
**Agent Target:** Claude Code / AI Coding Agent  
**Priority:** P0 — Active Data Loss in Production  
**Last Updated:** June 2026  
**Status:** Ready for Execution

---

## CONTEXT BRIEF

Users are losing all expense/income/streak data on every page refresh. Root cause is a cascading failure chain, not a single bug. Fix in the exact order below — each step depends on the previous one being correct, and fixing them out of order can mask symptoms while leaving the underlying data-loss trigger active.

**Do NOT touch:**
- UI layout, design tokens, animations
- `src/lib/advice.ts`
- Auth flow, Google OAuth, signup trigger (`handle_new_user`) — already fixed and verified working
- Any working page visual layer

**You ARE fixing:**
- The root coercion crash that silently breaks `last_logged_date` writes
- The client-side auto-rollover logic firing on every stale-date read
- Unsafe bulk DELETE endpoints with no parameter guards
- `income_type` default value mismatch (`'FIXED'` vs CHECK constraint)
- `enabled_slices` defaulting to `null`, breaking budget calculations
- Category re-seeding silently orphaning past expenses via `ON DELETE SET NULL`

---

## ROOT CAUSE CHAIN (Read This Before Starting)

```
1. /api/profile PATCH crashes on .single() coercion
        ↓
2. last_logged_date never updates, stays null/stale
        ↓
3. On every page refresh, client reads stale last_logged_date
        ↓
4. Client concludes the financial cycle has "ended"
        ↓
5. Client triggers automatic rollover (archiveCurrentMonth)
        ↓
6. Rollover issues bulk DELETE on /api/expenses and /api/incomes
        ↓
7. Rollover also wipes and re-seeds categories table (new UUIDs)
        ↓
8. Old expenses' category_id is set to NULL (ON DELETE SET NULL)
        ↓
9. Expense tab filters require valid category_id → receipts vanish
        ↓
10. Budget tab reads enabled_slices = null → calculations short-circuit
        ↓
11. anchor_day defaults to 1 → cron job fires bulk delete on the 1st
       of every month for any user who never set a custom anchor day
```

Every fix below targets one link in this chain. Skipping a step leaves the chain partially intact.

---

## BUG REGISTER

| ID | Bug | Severity |
|---|---|---|
| DATA-00 | Existing users still hold broken defaults (`anchor_day=1`, orphaned expenses) not covered by forward-looking fixes | P0 |
| DATA-01 | `/api/profile` PATCH still vulnerable to coercion crash under edge cases | P0 |
| DATA-02 | Client-side auto-rollover fires destructively on stale date read | P0 |
| DATA-03 | `/api/expenses` and `/api/incomes` DELETE endpoints have no parameter guards | P0 |
| DATA-04 | `income_type` DB default is `'FIXED'`, violates CHECK constraint | P1 |
| DATA-05 | `enabled_slices` defaults to `null`, breaks budget tab rendering | P0 |
| DATA-06 | Category re-seeding generates new UUIDs, orphaning existing expenses | P0 |
| DATA-07 | `/api/budget/cron-rollover` has no safety guard for `anchor_day = 1` default | P0 |
| DATA-08 | Streak/wrap calculation has no protection against mid-calculation data wipe | P1 |

---

## FILE MAP

```
backend/
  server.js                    ← DATA-01, DATA-03, DATA-04, DATA-06, DATA-07

src/
  store/
    index.ts                   ← DATA-02, DATA-08
  pages/
    Budgets.tsx (or similar)   ← DATA-05

Supabase SQL Editor             ← DATA-04, DATA-05, DATA-06 (schema fixes)
```

---

# PHASE 1 — DATABASE SCHEMA REPAIR

---

## [FIX-STEP 00] Existing User Backfill & Data Reconciliation

**Target:** Supabase Dashboard → SQL Editor  
**Fixes:** DATA-00  
**Depends on:** Nothing — run this FIRST, before any other step

### Context

All other fixes in this pack are forward-looking — they stop new bad data from being written and stop the bug from recurring. They do **not** repair existing users who are already sitting on broken defaults or who already lost category links. This step exists to close that gap before anything else runs.

### Task A — Check for Point-in-Time Recovery availability BEFORE doing anything destructive

Go to Supabase Dashboard → Database → Backups. Confirm whether Point-in-Time Recovery (PITR) is available on your project tier. If it is, and you have known timestamps for when the rollover bug fired, consider restoring affected users' data from a backup snapshot **before** proceeding with the reconciliation queries below. If PITR is unavailable or backups don't cover the affected window, proceed directly to Task B — the data is not recoverable through SQL alone, only the symptoms can be mitigated.

### Task B — Reset `anchor_day` for existing users still on the broken default

```sql
-- Existing users sitting on the old broken default (anchor_day = 1) are still
-- exposed to the cron rollover bug until this is fixed. Reset them to NULL —
-- a safe "not yet configured" state — rather than leaving them at the dangerous default.
UPDATE public.profiles
SET anchor_day = NULL
WHERE anchor_day = 1
  AND income_type = 'salary';
```

### Task C — Reconcile orphaned expenses (category_id wiped to NULL)

```sql
-- Step 1: Create an "Uncategorized" fallback category for any user
-- who has orphaned expenses, if they don't already have one.
INSERT INTO public.categories (user_id, name, icon, slice, budget_limit, is_basic, is_priority, is_subscription)
SELECT DISTINCT e.user_id, 'Uncategorized', 'HelpCircle', 'Family', 0, false, false, false
FROM public.expenses e
WHERE e.category_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.user_id = e.user_id AND c.name = 'Uncategorized'
  );

-- Step 2: Re-link orphaned expenses to the new Uncategorized category
-- so past receipts reappear in the Expense tab instead of vanishing.
UPDATE public.expenses e
SET category_id = c.id
FROM public.categories c
WHERE e.category_id IS NULL
  AND c.user_id = e.user_id
  AND c.name = 'Uncategorized';
```

**Important:** This does NOT restore the original category a transaction belonged to — that mapping is permanently lost once the original category UUID was deleted. This only ensures the expense is visible again instead of silently disappearing from the Expense tab.

### Task D — Verify the backfill

```sql
-- Confirm no salary user is still sitting on the dangerous anchor_day = 1 default
SELECT COUNT(*) FROM public.profiles WHERE anchor_day = 1 AND income_type = 'salary';
-- Expected result: 0

-- Confirm no expense rows are still orphaned
SELECT COUNT(*) FROM public.expenses WHERE category_id IS NULL;
-- Expected result: 0 (or very close to 0, if some are legitimately uncategorized by user choice)
```

### QA Checklist
- [ ] Checked Supabase Backups/PITR availability before running destructive reconciliation
- [ ] No `salary` profile remains at the dangerous `anchor_day = 1` default
- [ ] Every previously orphaned expense now has a valid `category_id` pointing to an "Uncategorized" category
- [ ] Spot-check 2–3 affected user accounts in the live app — confirm past receipts are now visible in the Expense tab

---

## [FIX-STEP 01] Fix Default Values in Supabase

**Target:** Supabase Dashboard → SQL Editor  
**Fixes:** DATA-04, DATA-05  
**Depends on:** Nothing — run this first

### Task

```sql
-- 1. Fix income_type default — must be a value the CHECK constraint allows
ALTER TABLE public.profiles
  ALTER COLUMN income_type SET DEFAULT 'salary';

-- 2. Fix any existing rows still holding the invalid default
UPDATE public.profiles
SET income_type = 'salary'
WHERE income_type = 'FIXED' OR income_type IS NULL OR income_type NOT IN ('salary', 'business', 'student');

-- 3. Fix enabled_slices default — must never be null
ALTER TABLE public.profiles
  ALTER COLUMN enabled_slices SET DEFAULT 'Basic,Family,Wealth,Subscription,Chop_Life,Black_Tax,Side_Hustle';

-- 4. Backfill existing null enabled_slices rows
UPDATE public.profiles
SET enabled_slices = 'Basic,Family,Wealth,Subscription,Chop_Life,Black_Tax,Side_Hustle'
WHERE enabled_slices IS NULL;
```

### QA Checklist
- [ ] `SELECT DISTINCT income_type FROM profiles;` returns only `'salary'`, `'business'`, `'student'`
- [ ] `SELECT id, enabled_slices FROM profiles WHERE enabled_slices IS NULL;` returns 0 rows
- [ ] New signups (test with a fresh account) get `enabled_slices` populated automatically without manual fix

---

## [FIX-STEP 02] Update `handle_new_user()` Trigger to Match Correct Defaults

**Target:** Supabase SQL Editor  
**Fixes:** DATA-04, DATA-05  
**Depends on:** FIX-STEP 01

### Task

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    income_type,
    anchor_day,
    fluid_window_days,
    has_completed_onboarding,
    current_streak,
    financial_streak,
    enabled_slices
  )
  VALUES (
    new.id,
    'salary',
    NULL,  -- DATA-07: never default to 1, leave null until user sets it explicitly
    30,
    false,
    0,
    0,
    'Basic,Family,Wealth,Subscription,Chop_Life,Black_Tax,Side_Hustle'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Note:** `anchor_day` is intentionally set to `NULL` here instead of `1` or `30`. This directly fixes DATA-07 at the source — if no anchor day exists, the cron rollover job (fixed in FIX-STEP 06) will never match `NULL` against `today`, so it physically cannot fire for users who haven't configured a payday yet.

### QA Checklist
- [ ] Sign up a new test user → confirm `anchor_day` is `NULL` in their profile row, not `1`
- [ ] Confirm `enabled_slices` is populated correctly on the new row

---

# PHASE 2 — BACKEND ENDPOINT HARDENING

---

## [FIX-STEP 03] Harden `/api/profile` PATCH Against Coercion Failures

**Target:** `backend/server.js`  
**Fixes:** DATA-01  
**Depends on:** FIX-STEP 01, FIX-STEP 02

### Task

Find the `/api/profile` PATCH handler. Replace the Supabase query pattern with this safe version:

```javascript
const { data, error } = await supabase
  .from('profiles')
  .update(profilePayload)
  .eq('id', userId)
  .select(); // No .single() — always returns an array

if (error) {
  console.error('[KINY] Profile PATCH error:', error.message);
  return res.status(500).json({ error: error.message });
}

if (!data || data.length === 0) {
  return res.status(404).json({ error: 'Profile not found for this user.' });
}

if (data.length > 1) {
  console.error('[KINY] CRITICAL: Multiple profile rows found for userId:', userId);
  return res.status(500).json({ error: 'Data integrity issue — multiple profile rows found.' });
}

const updatedProfile = data[0];

return res.status(200).json({ profile: updatedProfile });
```

### QA Checklist
- [ ] PATCH `/api/profile` with a valid session → returns `200` with a single profile object
- [ ] Manually test with a `userId` that has no matching profile row → returns `404`, not a 500 crash
- [ ] `last_logged_date` field updates correctly and persists after a page refresh

---

## [FIX-STEP 04] Add Mandatory Parameter Guards to Bulk DELETE Endpoints

**Target:** `backend/server.js`  
**Fixes:** DATA-03  
**Depends on:** Nothing — independent fix

### Task

Find every DELETE handler for `/api/expenses` and `/api/incomes`. Add this guard as the **first line** inside each handler, before any Supabase query runs:

```javascript
app.delete('/api/expenses', async (req, res) => {
  const userId    = req.user?.id;
  const startDate = req.query.start_date || req.body?.start_date;
  const endDate   = req.query.end_date   || req.body?.end_date;

  // CRITICAL GUARD — never allow an unscoped bulk delete
  if (!userId) {
    return res.status(401).json({ error: 'Aborting bulk delete: no authenticated user.' });
  }
  if (!startDate || !endDate) {
    return res.status(400).json({
      error: 'Aborting bulk delete query: Missing mandatory date range scope identifiers (start_date, end_date).'
    });
  }

  // ... existing delete logic continues here, scoped strictly to userId + date range
});
```

Apply the identical pattern to the `/api/incomes` DELETE handler.

**Rule:** No DELETE query may ever execute against `expenses` or `incomes` without both a valid `userId` AND an explicit date range. A delete with no date range is the exact failure mode that caused this incident.

### QA Checklist
- [ ] Call `DELETE /api/expenses` with no `start_date` → returns `400`, no rows deleted
- [ ] Call `DELETE /api/expenses` with no auth token → returns `401`, no rows deleted
- [ ] Call `DELETE /api/expenses` with valid `userId` + date range → deletes only rows in that exact range, scoped to that user

---

## [FIX-STEP 05] Fix Category Seeding to Never Orphan Existing Expenses

**Target:** `backend/server.js`  
**Fixes:** DATA-06  
**Depends on:** Nothing — independent fix

### Task

Find every place in `server.js` where categories are seeded or re-seeded (onboarding completion handler, rollover handler, or any "reset" function). Replace any logic that deletes and recreates categories with this guard:

```javascript
// NEVER delete existing categories during seeding.
// Only insert default categories if the user truly has zero categories.
const { data: existingCategories } = await supabase
  .from('categories')
  .select('id')
  .eq('user_id', userId);

if (!existingCategories || existingCategories.length === 0) {
  // Safe to seed — user genuinely has no categories yet
  await supabase.from('categories').insert(seededCategories.map(c => ({ ...c, user_id: userId })));
} else {
  console.log('[KINY] Skipping category seed — user already has', existingCategories.length, 'categories.');
}
```

**Search the entire file for any `DELETE FROM categories` or `.from('categories').delete()` call.** If one exists outside of an explicit user-initiated "Clear All Data" action (with confirmation), remove it entirely or flag it back for review before proceeding.

### QA Checklist
- [ ] Confirm no automatic process deletes a user's existing categories
- [ ] Add an expense, refresh the page, confirm the expense's `category_id` still points to a valid category
- [ ] Onboarding completion for an existing user (re-running setup) does NOT regenerate category UUIDs

---

## [FIX-STEP 06] Fix `/api/budget/cron-rollover` to Respect Null Anchor Days

**Target:** `backend/server.js`  
**Fixes:** DATA-07  
**Depends on:** FIX-STEP 02 (anchor_day now defaults to NULL, not 1)

### Task

Find the `/api/budget/cron-rollover` endpoint. Update the profile query to explicitly exclude null anchor days:

```javascript
app.post('/api/budget/cron-rollover', async (req, res) => {
  try {
    const today = new Date().getDate();

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, anchor_day, income_type')
      .eq('anchor_day', today)           // NULL will never equal `today`, this is now safe
      .not('anchor_day', 'is', null)     // explicit belt-and-braces guard
      .eq('income_type', 'salary');

    if (error) return res.status(500).json({ error: error.message });
    if (!profiles || profiles.length === 0) {
      return res.status(200).json({ message: 'No rollovers due today.' });
    }

    // ... existing rollover loop logic continues here unchanged
  } catch (err) {
    console.error('[KINY] Cron rollover error:', err);
    return res.status(500).json({ error: 'Internal server error during rollover.' });
  }
});
```

### QA Checklist
- [ ] Manually trigger the rollover endpoint → confirm users with `anchor_day = NULL` are excluded from results
- [ ] Confirm only users who explicitly set a payday anchor day are eligible for rollover
- [ ] No `DELETE` executes for any user without a confirmed, non-null anchor day match

---

# PHASE 3 — FRONTEND ROLLOVER LOGIC FIX

---

## [FIX-STEP 07] Disable or Gate Client-Side Auto-Rollover Trigger

**Target:** `src/store/index.ts`  
**Fixes:** DATA-02, DATA-08  
**Depends on:** FIX-STEP 03 (profile writes must be reliable first)

### Context

The client currently evaluates `last_logged_date` on every app load and silently triggers a destructive rollover (`archiveCurrentMonth`) if it deems the date stale. This must never run automatically as a side effect of a page load — rollover should only ever be triggered by the backend cron job, never the client.

### Task

Find any function in `store/index.ts` named something like `archiveCurrentMonth`, `checkRolloverStatus`, `evaluateCycleBoundary`, or similar — anything that calls `DELETE` on expenses/incomes based on a date comparison run during `initAuth` or component mount.

**Step A:** Locate where this check is called (likely inside `initAuth` or a `useEffect` on app load). Remove the automatic invocation entirely:

```typescript
// DELETE this kind of pattern if found inside initAuth or on-mount logic:
// if (isStaleCycle(profile.last_logged_date)) {
//   await archiveCurrentMonth();
// }
```

**Step B:** If a rollover function exists in the frontend at all, it must require explicit user confirmation before running, and must never run as a passive side effect:

```typescript
// Rollover must ONLY be triggered by:
// 1. The backend cron job (server-side, already fixed in FIX-STEP 06)
// 2. An explicit user action with a confirmation dialog — never silently on page load
```

If no legitimate client-triggered rollover use case exists, **delete the client-side rollover function entirely.** Rollover is a backend-only responsibility going forward.

### QA Checklist
- [ ] Refresh the app multiple times in a row → expenses, incomes, and streaks remain intact every time
- [ ] No `DELETE` network calls fire automatically on app load (confirm in DevTools → Network tab)
- [ ] Search the codebase for `archiveCurrentMonth` or equivalent — confirm it is either deleted or gated behind explicit user confirmation

---

## [FIX-STEP 08] Protect Streak Calculation from Race Conditions

**Target:** `src/store/index.ts`  
**Fixes:** DATA-08  
**Depends on:** FIX-STEP 07

### Task

Find the streak calculation logic (`updateLoggingStreak` or similar, from the earlier streak engine). Ensure it never runs before `expenses` data has fully loaded:

```typescript
const updateLoggingStreak = async (get: () => AppStore, expenses: ExpenseRow[]) => {
  const profile = get().profile;
  if (!profile) return;

  // Guard: do not calculate or reset streak if expenses haven't loaded yet
  const loadingState = get().loading;
  if (loadingState.expenses) {
    console.log('[KINY] Skipping streak calculation — expenses still loading.');
    return;
  }

  // ... existing streak calculation logic continues unchanged
};
```

### QA Checklist
- [ ] Streak value does not flash to `0` momentarily on page load before settling on the correct value
- [ ] A 10-day consecutive streak persists correctly across refresh and shows correctly in the wrap/summary view

---

# PHASE 4 — BUDGET TAB FIX

---

## [FIX-STEP 09] Fix Budget Tab to Read `enabled_slices` Safely

**Target:** `src/pages/Budgets.tsx` (or `BudgetPage.tsx`)  
**Fixes:** DATA-05  
**Depends on:** FIX-STEP 01

### Task

Find where the budget page reads `profile.enabled_slices` to determine which slices to render. Add a safe fallback so it never short-circuits on `null`:

```typescript
const profile = useAppStore(s => s.profile);

const enabledSlices = profile?.enabled_slices
  ? profile.enabled_slices.split(',').map(s => s.trim())
  : ['Basic', 'Family', 'Wealth', 'Subscription', 'Chop_Life', 'Black_Tax', 'Side_Hustle']; // safe fallback — never blank
```

Use `enabledSlices` (the array) everywhere the page previously read the raw `profile.enabled_slices` string directly.

### QA Checklist
- [ ] Budget tab renders all expected slices even for a profile where `enabled_slices` was previously null (test with one of the backfilled users from FIX-STEP 01)
- [ ] Adding a new expense updates the corresponding slice's progress bar immediately without requiring a refresh
- [ ] No slice silently fails to render due to a parsing issue

---

# PHASE 5 — FULL VERIFICATION

---

## [QA-STEP 01] Compile Checks

```bash
tsc --noEmit
npm run build
```
Both must pass with zero errors.

---

## [QA-STEP 02] Data Persistence Test — The Core Regression Check

1. Log in as a test user
2. Add 3 expenses across different categories
3. Increment the streak (log an expense today)
4. **Refresh the page**
5. Confirm all 3 expenses are still visible
6. Confirm the streak count is unchanged
7. Confirm the budget progress bars reflect the 3 expenses correctly

**Pass criteria:** Nothing disappears. This is the single most important test in this entire fix pack.

---

## [QA-STEP 03] Multi-Day Persistence Test

1. Log in as a test user with expenses from yesterday already in the database
2. Confirm yesterday's expenses are visible in the Expenses tab
3. Confirm they count toward the correct budget slice totals

---

## [QA-STEP 04] Category Stability Test

1. Note the exact category names and IDs for a test user (via Supabase Table Editor)
2. Complete or re-trigger onboarding for that same user
3. Confirm category IDs in the `categories` table are unchanged
4. Confirm existing expenses still show their correct category in the Expense tab (not blank/uncategorized)

---

## [QA-STEP 05] Cron Rollover Safety Test

1. In Supabase, manually set a test user's `anchor_day` to `NULL`
2. Manually trigger the `/api/budget/cron-rollover` endpoint
3. Confirm that user's expenses/incomes are NOT deleted
4. Set a different test user's `anchor_day` to today's actual date
5. Trigger the rollover endpoint again
6. Confirm only that specific user's data is archived and cleared, and a `monthly_snapshots` row is created for them

---

## [QA-STEP 06] Bulk Delete Endpoint Guard Test

1. Using a tool like Postman or `curl`, call `DELETE /api/expenses` with no `start_date` parameter
2. Confirm it returns `400`, not a successful deletion
3. Call it with no auth header
4. Confirm it returns `401`

---

## [QA-STEP 07] Regression — Full Page Sweep

| Page | Check |
|---|---|
| Dashboard | Loads correctly, no data missing |
| Expenses | All past receipts visible, correctly categorized |
| Budget | Slices render, progress bars update on new expense |
| Income | Entries persist across refresh |
| Profile | `income_type`, `enabled_slices` display correctly |
| Wrap / Streak Summary | Shows correct longest streak (e.g. 10 days) |

---

## DEFINITION OF DONE

- [ ] Existing users backfilled — no salary user remains at `anchor_day = 1`, orphaned expenses reconciled to "Uncategorized"
- [ ] `tsc --noEmit` and `npm run build` pass with zero errors
- [ ] Refreshing the page never deletes or hides existing expenses, incomes, or streaks
- [ ] No automatic client-side rollover trigger remains in the codebase
- [ ] All bulk DELETE endpoints reject requests missing `userId` or date range parameters
- [ ] `income_type` defaults to `'salary'` everywhere, never `'FIXED'`
- [ ] `enabled_slices` is never `null` for any profile, new or existing
- [ ] `anchor_day` defaults to `NULL`, never `1`, preventing unintended cron matches
- [ ] Category re-seeding never overwrites or orphans existing categories for users who already have them
- [ ] Cron rollover only fires for users with an explicit, non-null `anchor_day` match
- [ ] All 7 QA steps above pass
