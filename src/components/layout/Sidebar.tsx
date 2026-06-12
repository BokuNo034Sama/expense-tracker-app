import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { LayoutDashboard, Receipt, PieChart, LogOut, Sun, Moon, ArrowDownToLine } from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  const profile = useAppStore(s => s.profile);
  const signOut = useAppStore(s => s.signOut);
  const theme = useAppStore(s => s.theme);
  const setTheme = useAppStore(s => s.setTheme);
  const isInstalled = useAppStore(s => s.pwa.isInstalled);
  const deferredPrompt = useAppStore(s => s.pwa.deferredPrompt);
  const setPWAInstalled = useAppStore(s => s.setPWAInstalled);
  const setDeferredPrompt = useAppStore(s => s.setDeferredPrompt);
  
  const categories = useAppStore(s => s.categories);
  const hasSeenBudgetNudge = useAppStore(s => s.hasSeenBudgetNudge);
  const dismissBudgetNudge = useAppStore(s => s.dismissBudgetNudge);

  const initials = profile?.avatar_initials || 'U';

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light').catch(console.error);
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setPWAInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <aside 
      style={{ backgroundColor: 'var(--sidebar-bg)' }}
      className="fixed z-40 border-[var(--color-ink)] transition-colors duration-200 select-none text-white
                 bottom-0 inset-x-0 h-16 flex flex-row justify-around items-center px-2 border-t-2 border-r-0 w-full
                 md:top-0 md:bottom-auto md:left-0 md:w-[72px] md:h-screen md:flex-col md:justify-between md:py-6 md:border-r-2 md:border-t-0"
    >
      {/* 1. Dashboard Link */}
      <Link
        to="/"
        className={`p-2.5 md:p-3 border-2 border-transparent rounded-[var(--border-radius)] transition-all duration-150 relative group order-1 md:order-2
          ${location.pathname === '/' ? 'bg-[var(--color-brand-primary)] text-[#000000] border-[var(--color-border)] shadow-[var(--shadow-btn-active)]' : 'text-gray-400 hover:text-white hover:bg-neutral-900'}
        `}
      >
        <LayoutDashboard className="h-5 w-5" />
        <span style={{ fontFamily: 'var(--font-mono)' }} className="hidden md:group-hover:block absolute left-16 top-1/2 -translate-y-1/2 bg-black border border-white text-white px-2 py-1 rounded text-[10px] uppercase font-bold whitespace-nowrap pointer-events-none z-50 shadow-md">
          DASHBOARD
        </span>
      </Link>

      {/* 2. Expenses Link */}
      <Link
        to="/expenses"
        className={`p-2.5 md:p-3 border-2 border-transparent rounded-[var(--border-radius)] transition-all duration-150 relative group order-2 md:order-3
          ${location.pathname === '/expenses' ? 'bg-[var(--color-brand-primary)] text-[#000000] border-[var(--color-border)] shadow-[var(--shadow-btn-active)]' : 'text-gray-400 hover:text-white hover:bg-neutral-900'}
        `}
      >
        <Receipt className="h-5 w-5" />
        <span style={{ fontFamily: 'var(--font-mono)' }} className="hidden md:group-hover:block absolute left-16 top-1/2 -translate-y-1/2 bg-black border border-white text-white px-2 py-1 rounded text-[10px] uppercase font-bold whitespace-nowrap pointer-events-none z-50 shadow-md">
          EXPENSES
        </span>
      </Link>

      {/* 3. Budgets Link */}
      <Link
        to="/budgets"
        onClick={() => dismissBudgetNudge()}
        className={`p-2.5 md:p-3 border-2 border-transparent rounded-[var(--border-radius)] transition-all duration-150 relative group order-3 md:order-4
          ${location.pathname === '/budgets' ? 'bg-[var(--color-brand-primary)] text-[#000000] border-[var(--color-border)] shadow-[var(--shadow-btn-active)]' : 'text-gray-400 hover:text-white hover:bg-neutral-900'}
        `}
      >
        <PieChart className="h-5 w-5" />
        {!hasSeenBudgetNudge && categories.length === 0 && (
          <span className="absolute top-1 right-2 h-2.5 w-2.5 rounded-full border-2 border-black bg-[var(--color-primary)] animate-pulse" />
        )}
        <span style={{ fontFamily: 'var(--font-mono)' }} className="hidden md:group-hover:block absolute left-16 top-1/2 -translate-y-1/2 bg-black border border-white text-white px-2 py-1 rounded text-[10px] uppercase font-bold whitespace-nowrap pointer-events-none z-50 shadow-md">
          BUDGETS
        </span>
      </Link>

      {/* 4. Theme Toggle Button */}
      <button
        onClick={handleThemeToggle}
        className="p-2.5 md:p-3 text-gray-400 hover:text-white hover:bg-neutral-900 rounded-[var(--border-radius)] transition-all duration-150 order-4 md:order-5"
      >
        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>

      {/* 5. Avatar (Dashboard links / Profile link) */}
      <Link 
        to="/profile" 
        className={`p-1 md:p-0 border-2 border-transparent rounded-full transition-all duration-150 order-5 md:order-1
          ${location.pathname === '/profile' ? 'border-[var(--color-primary)]' : ''}
        `}
      >
        <div 
          style={{ fontFamily: 'var(--font-display)' }}
          className="w-9 h-9 md:w-10 md:h-10 bg-[var(--color-brand-primary)] text-[#000000] border-2 border-[var(--color-border)] rounded-full flex items-center justify-center font-extrabold text-xs md:text-sm shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-btn-active)] transition-all duration-150 uppercase"
        >
          {initials}
        </div>
      </Link>

      {/* 6. Sign Out Button (Hidden on Mobile) */}
      <button
        onClick={() => signOut().catch(console.error)}
        className="hidden md:block p-3 text-gray-400 hover:text-[var(--color-danger)] hover:bg-neutral-900 rounded-[var(--border-radius)] transition-all duration-150 order-7 md:order-7"
      >
        <LogOut className="h-5 w-5" />
      </button>

      {/* 7. PWA Install Button */}
      {!isInstalled && deferredPrompt && (
        <button
          onClick={handleInstallPWA}
          className="p-2.5 md:p-3 border-2 border-[var(--color-border)] bg-[var(--color-brand-primary)] text-[#000000] rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-btn-active)] transition-all duration-150 relative group order-6 md:order-6"
        >
          <ArrowDownToLine className="h-5 w-5" />
          <span style={{ fontFamily: 'var(--font-mono)' }} className="hidden md:group-hover:block absolute left-16 top-1/2 -translate-y-1/2 bg-black border border-white text-white px-2 py-1 rounded text-[10px] uppercase font-bold whitespace-nowrap pointer-events-none z-50 shadow-md">
            GET_APP_🚀
          </span>
        </button>
      )}
    </aside>
  );
}
