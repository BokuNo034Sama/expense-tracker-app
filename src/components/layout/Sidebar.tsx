import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { LayoutDashboard, Receipt, PieChart, LogOut, Sun, Moon, ArrowDownToLine, MessageCircle } from 'lucide-react';
import { SupportModal } from '../support/SupportModal';

interface SidebarLinkProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  orderClass: string;
  onClick?: () => void;
  badge?: React.ReactNode;
}

function SidebarLink({ to, icon: Icon, label, isActive, orderClass, onClick, badge }: SidebarLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`p-2.5 md:p-3 border-2 border-transparent rounded-[var(--border-radius)] transition-all duration-150 relative group ${orderClass}
        ${isActive ? 'bg-[var(--color-brand-primary)] text-[#000000] border-[var(--color-border)] shadow-[var(--shadow-btn-active)]' : 'text-[var(--color-ink-muted)] hover:text-white hover:bg-[var(--color-ink)]/10'}
      `}
    >
      <Icon className="h-5 w-5" />
      {badge}
      <span style={{ fontFamily: 'var(--font-mono)' }} className="hidden md:group-hover:block absolute left-16 top-1/2 -translate-y-1/2 bg-black border border-white text-white px-2 py-1 rounded text-[10px] uppercase font-bold whitespace-nowrap pointer-events-none z-50 shadow-md">
        {label}
      </span>
    </Link>
  );
}

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
  const [supportOpen, setSupportOpen] = useState(false);
  
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
      className="hidden md:flex fixed z-40 border-[var(--color-ink)] transition-colors duration-200 select-none text-white
                 md:top-0 md:bottom-auto md:left-0 md:w-[72px] md:h-screen md:flex-col md:justify-between md:py-6 md:border-r-2 md:border-t-0"
    >
      {/* 1. Dashboard Link */}
      <SidebarLink
        to="/"
        icon={LayoutDashboard}
        label="DASHBOARD"
        isActive={location.pathname === '/'}
        orderClass="order-1 md:order-2"
      />

      {/* 2. Expenses Link */}
      <SidebarLink
        to="/expenses"
        icon={Receipt}
        label="EXPENSES"
        isActive={location.pathname === '/expenses'}
        orderClass="order-2 md:order-3"
      />

      {/* 3. Budgets Link */}
      <SidebarLink
        to="/budgets"
        icon={PieChart}
        label="BUDGETS"
        isActive={location.pathname === '/budgets'}
        orderClass="order-3 md:order-4"
        onClick={() => dismissBudgetNudge()}
        badge={!hasSeenBudgetNudge && categories.length === 0 && (
          <span className="absolute top-1 right-2 h-2.5 w-2.5 rounded-full border-2 border-black bg-[var(--color-primary)] animate-pulse" />
        )}
      />

      {/* 4. Support & Feedback Button */}
      <button
        onClick={() => setSupportOpen(true)}
        className="p-2.5 md:p-3 text-[var(--color-ink-muted)] hover:text-white hover:bg-[var(--color-ink)]/10 rounded-[var(--border-radius)] transition-all duration-150 relative group order-4 md:order-5"
        title="Support & Feedback"
      >
        <MessageCircle className="h-5 w-5" />
        <span style={{ fontFamily: 'var(--font-mono)' }} className="hidden md:group-hover:block absolute left-16 top-1/2 -translate-y-1/2 bg-black border border-white text-white px-2 py-1 rounded text-[10px] uppercase font-bold whitespace-nowrap pointer-events-none z-50 shadow-md">
          SUPPORT
        </span>
      </button>

      {/* 5. Theme Toggle Button */}
      <button
        onClick={handleThemeToggle}
        className="p-2.5 md:p-3 text-[var(--color-ink-muted)] hover:text-white hover:bg-[var(--color-ink)]/10 rounded-[var(--border-radius)] transition-all duration-150 order-5 md:order-6"
      >
        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>

      {/* 6. Avatar (Dashboard links / Profile link) */}
      <Link 
        to="/profile" 
        className={`p-1 md:p-0 border-2 border-transparent rounded-full transition-all duration-150 order-6 md:order-1
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

      {/* 7. Sign Out Button (Hidden on Mobile) */}
      <button
        onClick={() => signOut().catch(console.error)}
        className="hidden md:block p-3 text-[var(--color-ink-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-ink)]/10 rounded-[var(--border-radius)] transition-all duration-150 order-8 md:order-8"
      >
        <LogOut className="h-5 w-5" />
      </button>

      {/* 8. PWA Install Button */}
      {!isInstalled && deferredPrompt && (
        <button
          onClick={handleInstallPWA}
          className="p-2.5 md:p-3 border-2 border-[var(--color-border)] bg-[var(--color-brand-primary)] text-[#000000] rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-btn-active)] transition-all duration-150 relative group order-7 md:order-7"
        >
          <ArrowDownToLine className="h-5 w-5" />
          <span style={{ fontFamily: 'var(--font-mono)' }} className="hidden md:group-hover:block absolute left-16 top-1/2 -translate-y-1/2 bg-black border border-white text-white px-2 py-1 rounded text-[10px] uppercase font-bold whitespace-nowrap pointer-events-none z-50 shadow-md">
            GET_APP_🚀
          </span>
        </button>
      )}

      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </aside>
  );
}
