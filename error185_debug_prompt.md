## TASK: Full Codebase Audit — Eliminate All React Error #185 Infinite Re-render Risks

### Context
React Error #185 is caused by state mutations (useState setters, Zustand store setters, or `useAppStore.setState`) running directly inside a component's render body — outside of `useEffect`, event handlers, or async functions. Every render triggers the setter, which triggers another render, creating an infinite loop until React crashes.

The Budget page has already been fixed. You must now audit every remaining page and component in the project for the same pattern.

---

### Files to Audit

Check every file in these directories:

```
src/pages/
src/components/auth/
src/components/onboarding/
src/components/dashboard/
src/components/expenses/
src/components/budgets/
src/components/income/
src/components/profile/
src/components/shared/
src/components/layout/
src/components/pwa/
src/store/index.ts
```

---

### What to Look For in Every File

**Pattern 1 — useState setter in render body:**
```typescript
// 🛑 ILLEGAL — runs on every render, causes infinite loop
const [total, setTotal] = useState(0);
setTotal(computedValue); // ← outside useEffect, outside handler
```

**Pattern 2 — Zustand setter in render body:**
```typescript
// 🛑 ILLEGAL
const setAppState = useAppStore(s => s.setAppState);
setAppState('READY'); // ← outside useEffect, outside handler
```

**Pattern 3 — useAppStore.setState in render body:**
```typescript
// 🛑 ILLEGAL
useAppStore.setState({ theme: 'dark' }); // ← outside useEffect
```

**Pattern 4 — Async store action called in render body:**
```typescript
// 🛑 ILLEGAL
const fetchCategories = useAppStore(s => s.fetchCategories);
fetchCategories(); // ← outside useEffect, causes fetch loop
```

**Pattern 5 — Missing dependency array on useEffect:**
```typescript
// 🛑 DANGEROUS — runs on every render
useEffect(() => {
  fetchExpenses();
}); // ← missing [] dependency array
```

**Pattern 6 — Object or array created inline as useEffect dependency:**
```typescript
// 🛑 DANGEROUS — new object reference on every render triggers infinite loop
useEffect(() => {
  doSomething();
}, [{ id: user.id }]); // ← inline object, new reference every render
```

---

### The Fix Rules to Apply

**Rule 1:** Pure math calculations must NEVER use useState. Convert to plain constants:
```typescript
// ✅ CORRECT
const total = items.reduce((s, i) => s + i.amount, 0);
```

**Rule 2:** Any store fetch or state setter that runs on mount must be inside useEffect with a correct dependency array:
```typescript
// ✅ CORRECT
useEffect(() => {
  fetchCategories();
}, []); // empty array = runs once on mount only
```

**Rule 3:** useEffect dependencies must be primitive values, not inline objects or arrays:
```typescript
// ✅ CORRECT
const userId = useAppStore(s => s.auth.user?.id);
useEffect(() => {
  if (userId) fetchProfile();
}, [userId]); // primitive string, stable reference
```

**Rule 4:** Event handlers and async functions are safe — setters inside them do not cause loops:
```typescript
// ✅ SAFE — inside a handler, not render body
const handleSubmit = async () => {
  setLoading(true);
  await saveExpense();
  setLoading(false);
};
```

**Rule 5:** Any component that reads from the store and conditionally renders must check loading state first:
```typescript
// ✅ CORRECT — loading gate before any computation
const appState = useAppStore(s => s.appState);
if (appState === 'LOADING') return <LoadingScreen />;
```

---

### Audit Report Format

For every file you check, output one line:

```
✅ CLEAN   — src/pages/Dashboard.tsx
🛑 ISSUE   — src/pages/Income.tsx — useState setter on line 42 running in render body
🛑 ISSUE   — src/components/auth/LoginForm.tsx — fetchProfile() called outside useEffect on line 18
```

---

### Fix Every Issue Found

After reporting, fix every flagged issue immediately using the rules above.

**Priority order for fixes:**
1. Auth pages first (`LoginForm.tsx`, `SignUpForm.tsx`, `AuthGate.tsx`)
2. Onboarding (`OnboardingOverlay.tsx`)
3. Dashboard (`DashboardPage.tsx` and all dashboard child components)
4. Expenses, Income, Profile pages
5. Shared components and layout

---

### Final Verification

After all fixes are applied run:

```bash
tsc --noEmit
```

Then:

```bash
npm run build
```

Both must pass with zero errors.

Then manually verify these specific user flows do not trigger Error #185:

| Flow | Check |
|---|---|
| Fresh app load (logged out) | LoginForm mounts cleanly |
| Sign up — all 4 steps | No crash on any step transition |
| Sign in — complete user | Dashboard loads, no loop |
| Sign in — incomplete user | OnboardingOverlay shows, no loop |
| Navigate to Budget page | Renders cleanly, no white screen |
| Navigate to Expenses page | Table renders cleanly |
| Navigate to Income page | List renders cleanly |
| Navigate to Profile page | Profile data renders cleanly |
| Sign out and sign back in | Clean cycle, no stale state |

Report the result of every flow as PASS or FAIL.

Do not mark this task complete until:
- [ ] `tsc --noEmit` passes with zero errors
- [ ] `npm run build` passes with zero errors  
- [ ] All 9 user flows above report PASS
- [ ] Zero instances of the illegal patterns above remain in any file
