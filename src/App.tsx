import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAppStore } from './store';
import { AuthGate } from './components/auth/AuthGate';
import { Layout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Budgets from "./pages/Budgets";
import ProfilePage from "./pages/ProfilePage";
import { ExpenseForm } from "./components/expenses/ExpenseForm";

export default function App() {
  const initAuth = useAppStore(s => s.initAuth);
  const authStatus = useAppStore(s => s.auth.status);
  const setDeferredPrompt = useAppStore(s => s.setDeferredPrompt);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  useEffect(() => {
    initAuth();

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

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
