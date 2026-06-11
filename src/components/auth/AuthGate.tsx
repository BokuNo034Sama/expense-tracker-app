import { useAppStore } from '../../store';
import { LoginForm } from './LoginForm';
import { OnboardingOverlay } from '../onboarding/OnboardingOverlay';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const status  = useAppStore(s => s.auth.status);
  const profile = useAppStore(s => s.profile);

  if (status === 'loading' || (status === 'authenticated' && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
        <div 
          style={{ border: 'var(--border-default)', fontFamily: 'var(--font-display)' }} 
          className="bg-[var(--color-surface)] text-[var(--color-ink)] px-8 py-6 rounded-[var(--border-radius)] shadow-[var(--shadow-card)] font-bold text-center uppercase tracking-widest animate-pulse"
        >
          LOADING_KINY_OS...
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') return <LoginForm />;

  if (status === 'authenticated' && profile && !profile.has_completed_onboarding) {
    return <OnboardingOverlay />;
  }

  return <>{children}</>;
}
