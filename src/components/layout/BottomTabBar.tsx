// src/components/layout/BottomTabBar.tsx
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CreditCard, Receipt, TrendingUp, User } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { to: '/',         icon: Home,        label: 'HOME'     },
  { to: '/budgets',  icon: CreditCard,  label: 'BUDGETS'  },
  { to: '/expenses', icon: Receipt,     label: 'EXPENSES' },
  { to: '/income',   icon: TrendingUp,  label: 'INCOME'   },
  { to: '/profile',  icon: User,        label: 'PROFILE'  },
];

export function BottomTabBar() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--color-ink)] border-t-2 border-[var(--color-ink)] safe-area-inset-bottom animate-slide-up"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[var(--color-primary)] rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                className={isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-ink-muted)]'
                }
              />
              <span
                style={{ fontFamily: 'var(--font-mono)' }}
                className={`text-[8px] font-bold tracking-widest uppercase ${
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-ink-muted)]'
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
