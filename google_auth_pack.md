# Kiny — Google OAuth Integration & Magic Link Removal
**Type:** Feature Build Pack  
**Agent Target:** Claude Code / AI Coding Agent  
**Priority:** P1 — Auth UX Upgrade  
**Last Updated:** June 2026  
**Status:** Ready for Execution

---

## CONTEXT BRIEF

You are upgrading the Kiny authentication system:
1. **Remove** Magic Link authentication completely
2. **Add** Google OAuth (Sign in with Google) via Supabase
3. **Preserve** all existing email/password login and signup flows
4. **Preserve** the 4-step onboarding wizard and `AuthGate` state machine

The `AuthGate` already handles `has_completed_onboarding: false` — Google users will automatically be intercepted and dropped into the onboarding wizard after their first Google login. No changes needed to `AuthGate.tsx`.

**Do NOT touch:**
- `AuthGate.tsx` — already handles the onboarding gate correctly
- `OnboardingOverlay.tsx` — unchanged
- `store/index.ts` auth state machine — unchanged except removing `signInMagicLink`
- Any page components (Dashboard, Budget, Expenses, etc.)
- `backend/server.js` signup route — Google OAuth bypasses Express entirely

---

## FILE MAP

```
src/
  store/
    types.ts          ← Remove signInMagicLink from AppStore interface
    index.ts          ← Remove signInMagicLink action
  components/
    auth/
      LoginForm.tsx   ← Main changes: remove magic link UI, add Google button
  lib/
    supabaseClient.ts ← Already configured — no changes needed
.env.local            ← Add VITE_APP_URL
```

---

# PHASE 1 — ENVIRONMENT VARIABLE

## [STEP 01] Add Redirect URL to Environment Variables

**Target:** `.env.local` (project root)

Add this line:

```bash
VITE_APP_URL=http://localhost:5173
```

For Vercel production, add `VITE_APP_URL` as an environment variable in the Vercel dashboard with value:
```
https://expense-tracker-app-mu-five.vercel.app
```

**QA:**
- [ ] `.env.local` contains `VITE_APP_URL`
- [ ] Vercel environment variables panel has `VITE_APP_URL` set to production URL

---

# PHASE 2 — STORE CLEANUP

## [STEP 02] Remove Magic Link from `src/store/types.ts`

**Target:** `src/store/types.ts`

Find and **delete** this line from the `AppStore` interface:

```typescript
signInMagicLink: (email: string) => Promise<void>;
```

**QA:**
- [ ] `signInMagicLink` no longer appears anywhere in `types.ts`
- [ ] `tsc --noEmit` passes after this change

---

## [STEP 03] Remove Magic Link from `src/store/index.ts`

**Target:** `src/store/index.ts`

Find the `signInMagicLink` action in the store and **delete the entire function**:

```typescript
// DELETE this entire block:
signInMagicLink: async (email) => {
  set(s => ({ errors: { ...s.errors, auth: null } }));
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) set(s => ({ errors: { ...s.errors, auth: error.message } }));
},
```

**QA:**
- [ ] `signInMagicLink` no longer appears anywhere in `index.ts`
- [ ] `tsc --noEmit` passes after this change

---

# PHASE 3 — LOGIN FORM UPGRADE

## [STEP 04] Rewrite `src/components/auth/LoginForm.tsx`

**Target:** `src/components/auth/LoginForm.tsx`

### Task A — Remove magic link state and imports

Find and **delete** these items at the top of the component:

```typescript
// DELETE any of these if they exist:
const signInMagicLink = useAppStore(s => s.signInMagicLink);
const [magicLinkSent, setMagicLinkSent] = useState(false);
const [magicEmail, setMagicEmail] = useState('');
const [showMagicLink, setShowMagicLink] = useState(false);
```

### Task B — Add Google OAuth handler

Add this function inside the component, alongside the existing `handleSignIn` and `handleSignUp` functions:

```typescript
const handleGoogleSignIn = async () => {
  setLoading(true);
  setLocalError(null);
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${import.meta.env.VITE_APP_URL ?? window.location.origin}/`,
      },
    });
    if (error) throw error;
    // Note: on success, Supabase redirects the browser away from this page.
    // setLoading(false) is NOT needed on the success path.
  } catch (err: any) {
    setLocalError(err.message || 'Failed to initialize Google Sign-In.');
    setLoading(false);
  }
};
```

Also add this import at the top of the file if not already present:

```typescript
import { supabase } from '../../lib/supabaseClient';
```

### Task C — Replace magic link JSX with Google button

Find the magic link button block in the JSX (look for `SEND_MAGIC_LINK`, `signInMagicLink`, or the magic link toggle section) and **replace the entire block** with:

```tsx
{/* Divider */}
<div className="relative flex py-3 items-center">
  <div className="flex-grow border-t-2 border-[var(--color-ink)] opacity-10"></div>
  <span
    style={{ fontFamily: 'var(--font-mono)' }}
    className="flex-shrink mx-4 text-[10px] font-bold text-[var(--color-ink-muted)] uppercase tracking-widest"
  >
    OR
  </span>
  <div className="flex-grow border-t-2 border-[var(--color-ink)] opacity-10"></div>
</div>

{/* Google Sign-In Button */}
<button
  type="button"
  onClick={handleGoogleSignIn}
  disabled={loading}
  style={{ fontFamily: 'var(--font-mono)' }}
  className="w-full py-3.5 bg-white text-black border-2 border-black rounded-[var(--border-radius)] shadow-[2px_2px_0px_0px_#000000] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_#000000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none font-bold text-xs uppercase tracking-widest transition-all duration-100 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {/* Inline Google G SVG — no external image dependency */}
  <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
  CONTINUE_WITH_GOOGLE
</button>
```

### Task D — Remove magic link state from tab/mode switcher

If `LoginForm` has a mode switcher that includes a magic link tab or option (look for `'magic'`, `'magiclink'`, `'otp'` in any `useState` tab variable), remove that option from the switcher. Keep only `'login'` and `'signup'` tabs.

---

# PHASE 4 — VERIFICATION

## [STEP 05] Final Checks

Run in order:

```bash
tsc --noEmit
```
Must pass with zero errors.

```bash
npm run build
```
Must pass with zero errors.

---

## QA CHECKLIST

### Code Checks
- [ ] `signInMagicLink` does not appear in `types.ts`, `index.ts`, or `LoginForm.tsx`
- [ ] `handleGoogleSignIn` uses `import.meta.env.VITE_APP_URL` — no hardcoded URLs
- [ ] Google button uses inline SVG — no `img` tag pointing to external URL
- [ ] `tsc --noEmit` passes
- [ ] `npm run build` passes

### Manual Flow Checks

| Flow | Expected Result |
|---|---|
| Click `CONTINUE_WITH_GOOGLE` | Browser redirects to Google consent screen |
| Complete Google sign-in (new user) | Redirects back to app → `AuthGate` shows `OnboardingOverlay` |
| Complete Google sign-in (existing user, onboarding done) | Redirects back to app → Dashboard loads |
| Email/password login | Still works unchanged |
| Email/password signup | Still works unchanged |
| Magic link button | No longer visible anywhere in the app |
| Local dev (`localhost:5173`) | Google redirect returns to localhost correctly |
| Production (Vercel) | Google redirect returns to Vercel URL correctly |

---

## CONSTRAINTS

| Rule | Detail |
|---|---|
| No hardcoded URLs | Always use `import.meta.env.VITE_APP_URL` for redirectTo |
| No external image URLs | Use inline SVG for Google logo |
| AuthGate unchanged | Google users flow through existing `ONBOARDING_INCOMPLETE` gate |
| Email/password unchanged | Do not modify existing signIn or signUp handlers |
| No new DB triggers | Existing `handle_new_user()` trigger already handles Google users |
