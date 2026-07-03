import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';
import { OfflineBanner } from '../pwa/OfflineBanner';
import { UpdatePrompt } from '../pwa/UpdatePrompt';
import { PWAInstallPrompt } from '../PWAInstallPrompt';
import { CreatorAppreciationBanner } from '../dashboard/CreatorAppreciationBanner';
import { SyncIndicator } from '../shared/SyncIndicator';
import { useAppStore, useCurrentStreak } from '../../store';
 
interface LayoutProps {
  children: React.ReactNode;
  onAddExpense?: () => void;
}
 
export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const streak = useCurrentStreak();
  const profile = useAppStore(s => s.profile);

  const getFinancialCycleTitle = (anchorDay: number | null): string => {
    // Non-salary users (business/student) have no anchor day
    // Fall back to standard calendar month display
    if (!anchorDay) {
      return new Date().toLocaleString('en-US', {
        month: 'short',
        year: 'numeric'
      }).toUpperCase();
    }

    const today = new Date();
    const currentDay = today.getDate();

    let targetMonth = today.getMonth(); // 0-indexed
    let targetYear  = today.getFullYear();

    // If today is on or past the anchor day, active cycle belongs to next month
    if (currentDay >= anchorDay) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear  += 1;
      }
    }

    const financialDate = new Date(targetYear, targetMonth, 1);
    return financialDate.toLocaleString('en-US', {
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  };

  const headerMonthTitle = getFinancialCycleTitle(profile?.anchor_day ?? null);
 
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden px-4 md:px-8 bg-[var(--color-bg)] text-[var(--color-ink)] transition-colors duration-200 antialiased">
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Main page content container */}
      <main className="pl-0 md:pl-[72px] pb-24 md:pb-8 mx-auto max-w-6xl py-8 space-y-6">
        {/* Main Content Viewport Header */}
        {!isDashboard && (
          <div className="flex justify-between items-center border-b border-[var(--color-ink)] border-opacity-10 pb-4 gap-2 flex-wrap">
            <div style={{ fontFamily: 'var(--font-mono)' }} className="text-xs font-bold text-[var(--color-ink-muted)] uppercase shrink-0">
              {headerMonthTitle}
            </div>
            <div className="flex items-center gap-3">
              {streak > 0 && (
                <div 
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="px-3 py-1.5 bg-[var(--color-danger)] text-white font-extrabold text-xs uppercase border-2 border-[var(--color-border)] shadow-[var(--shadow-btn-active)] rounded-[var(--border-radius)] whitespace-nowrap shrink-0"
                >
                  🔥 {streak}_DAY_STREAK
                </div>
              )}
              <SyncIndicator />
            </div>
          </div>
        )}

        <OfflineBanner />
        <CreatorAppreciationBanner />
        {children}
        <UpdatePrompt />
        <PWAInstallPrompt />
      </main>
      <BottomTabBar />
    </div>
  );
}
