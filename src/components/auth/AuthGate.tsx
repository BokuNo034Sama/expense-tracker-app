import React, { useEffect } from 'react';
import { useAppStore } from '../../store';
import { LoginForm } from './LoginForm';
import { OnboardingOverlay } from '../onboarding/OnboardingOverlay';
import { IncomeMigrationModal } from '../modals/IncomeMigrationModal';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const status  = useAppStore(s => s.auth.status);
  const profile = useAppStore(s => s.profile);
  const isRevalidating = useAppStore(s => s.isRevalidating);
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

  if (status === 'loading' || (status === 'authenticated' && !profile) || isRevalidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
        <div 
          style={{ fontFamily: 'var(--font-display)' }} 
          className="bg-[var(--color-surface)] text-[var(--color-text-main)] px-8 py-6 border-2 border-[var(--color-border)] rounded-[var(--border-radius)] shadow-[var(--shadow-neubrutalist)] font-bold text-center uppercase tracking-widest animate-pulse"
        >
          LOADING_KINY_OS...
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') return <LoginForm />;

  if (status === 'authenticated' && profile) {
    if (!profile.has_completed_onboarding) {
      return <OnboardingOverlay />;
    }
    const needsCycleMigration = !!(profile && !profile.income_type);
    if (needsCycleMigration) {
      return <IncomeMigrationModal />;
    }
  }

  return <>{children}</>;
}
