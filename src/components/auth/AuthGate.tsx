import React, { useEffect } from 'react';
import { useAppStore } from '../../store';
import { LoginForm } from './LoginForm';
import { OnboardingOverlay } from '../onboarding/OnboardingOverlay';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const authStatus = useAppStore(s => s.auth.status);
  const appState   = useAppStore(s => s.appState);
  const updateProfile = useAppStore(s => s.updateProfile);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const handlePaymentSuccess = async () => {
        try {
          await updateProfile({ has_supported_creator: true });
          alert("CONTRIBUTION_RECEIVED — Thank you for fueling independent software development! 🚀");
          const url = new URL(window.location.href);
          url.searchParams.delete('payment');
          window.history.replaceState({}, document.title, url.pathname + url.search);
        } catch (err) {
          console.error('[KINY] Failed to update creator support status:', err);
        }
      };
      handlePaymentSuccess();
    }
  }, [updateProfile]);

  // State 1: LOADING — app is initializing, show nothing
  if (authStatus === 'loading' || appState === 'LOADING') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <span
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-sm text-[var(--color-ink-muted)] animate-pulse uppercase tracking-widest"
        >
          INITIALISING_KINY...
        </span>
      </div>
    );
  }

  // State 2: UNAUTHENTICATED — show login form
  if (authStatus === 'unauthenticated' || appState === 'UNAUTHENTICATED') {
    return <LoginForm />;
  }

  // State 3: ONBOARDING_INCOMPLETE — user exists but setup not done
  if (appState === 'ONBOARDING_INCOMPLETE') {
    return <OnboardingOverlay />;
  }

  // State 4: READY — everything loaded, render the app
  return <>{children}</>;
}
