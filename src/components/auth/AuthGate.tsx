import { useAppStore } from '../../store';
import { LoginForm } from './LoginForm';
import { OnboardingOverlay } from '../onboarding/OnboardingOverlay';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const status  = useAppStore(s => s.auth.status);
  const profile = useAppStore(s => s.profile);

  if (status === 'unauthenticated') return <LoginForm />;

  if (status === 'authenticated' && profile && !profile.has_completed_onboarding) {
    return <OnboardingOverlay />;
  }

  return <>{children}</>;
}
