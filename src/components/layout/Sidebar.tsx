import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { LayoutDashboard, Receipt, PieChart, User, LogOut, Sun, Moon } from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  const profile = useAppStore(s => s.profile);
  const signOut = useAppStore(s => s.signOut);
  const theme = useAppStore(s => s.theme);
  const setTheme = useAppStore(s => s.setTheme);

  const initials = profile?.avatar_initials || 'U';

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'DASHBOARD' },
    { path: '/expenses', icon: Receipt, label: 'EXPENSES' },
    { path: '/budgets', icon: PieChart, label: 'BUDGETS' },
    { path: '/profile', icon: User, label: 'PROFILE' },
  ];

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light').catch(console.error);
  };

  return (
    <aside 
      style={{ width: 'var(--sidebar-width)', backgroundColor: 'var(--sidebar-bg)' }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col justify-between items-center py-6 border-r-2 border-[var(--color-ink)] transition-colors duration-200 select-none text-white"
    >
      {/* Top: Avatar */}
      <div className="flex flex-col items-center gap-6">
        <Link to="/profile" title="View Profile">
          <div 
            style={{ fontFamily: 'var(--font-display)' }}
            className="w-10 h-10 bg-[var(--color-primary)] text-black border-2 border-black rounded-full flex items-center justify-center font-extrabold text-sm shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-btn-active)] transition-all duration-150 uppercase"
          >
            {initials}
          </div>
        </Link>
        
        {/* Navigation List */}
        <nav className="flex flex-col gap-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`
                  p-3 border-2 border-transparent rounded-[var(--border-radius)] 
                  transition-all duration-150 relative group
                  ${isActive 
                    ? 'bg-[var(--color-primary)] text-black border-black shadow-[var(--shadow-btn-active)]' 
                    : 'text-gray-400 hover:text-white hover:bg-neutral-900'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                
                {/* Floating labels */}
                <span 
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="absolute left-16 top-1/2 -translate-y-1/2 bg-black border border-white text-white px-2 py-1 rounded text-[10px] uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-50 shadow-md"
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Theme Toggle & Sign Out */}
      <div className="flex flex-col items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          title="Toggle Theme"
          className="p-3 text-gray-400 hover:text-white hover:bg-neutral-900 rounded-[var(--border-radius)] transition-all duration-150"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Sign Out */}
        <button
          onClick={() => signOut().catch(console.error)}
          title="Sign Out"
          className="p-3 text-gray-400 hover:text-[var(--color-danger)] hover:bg-neutral-900 rounded-[var(--border-radius)] transition-all duration-150"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
