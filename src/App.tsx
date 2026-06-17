import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAppStore } from './store';
import type { BeforeInstallPromptEvent } from './store/types';
import { AuthGate } from './components/auth/AuthGate';
import { Layout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Budgets from "./pages/Budgets";
import ProfilePage from "./pages/ProfilePage";
import { ExpenseForm } from "./components/expenses/ExpenseForm";
import { initializeKinyPushSubscription } from './utils/pushSubscription';

export default function App() {
  const initAuth = useAppStore(s => s.initAuth);
  const authStatus = useAppStore(s => s.auth.status);
  const setDeferredPrompt = useAppStore(s => s.setDeferredPrompt);
  const refreshSession = useAppStore(s => s.refreshSession);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  useEffect(() => {
    initAuth();
    initializeKinyPushSubscription().catch(err => {
      console.error('[KINY] Main lifecycle push setup failed:', err);
    });

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleFocus = () => {
      refreshSession().catch(console.error);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSession().catch(console.error);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [initAuth, setDeferredPrompt, refreshSession]);

  if (authStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)]">
        <span 
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-sm font-bold animate-pulse animate-duration-1000"
        >
          INITIALISING_KINY...
        </span>
      </div>
    );
  }

  return (
    <AuthGate>
      <BrowserRouter>
        <Layout onAddExpense={() => setIsAddExpenseOpen(true)}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
          <ExpenseForm open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen} />
        </Layout>
      </BrowserRouter>
    </AuthGate>
  );
}
