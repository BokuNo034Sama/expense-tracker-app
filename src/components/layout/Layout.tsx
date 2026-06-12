import React from 'react';
import { Sidebar } from './Sidebar';
import { OfflineBanner } from '../pwa/OfflineBanner';
import { UpdatePrompt } from '../pwa/UpdatePrompt';
import { InstallPrompt } from '../pwa/InstallPrompt';
import { CreatorAppreciationBanner } from '../dashboard/CreatorAppreciationBanner';
import { SyncIndicator } from '../shared/SyncIndicator';
import { useAppStore } from '../../store';
 
interface LayoutProps {
  children: React.ReactNode;
  onAddExpense?: () => void;
}
 
export function Layout({ children }: LayoutProps) {
  const profile = useAppStore(s => s.profile);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden px-4 md:px-8 bg-[var(--color-bg)] text-[var(--color-ink)] transition-colors duration-200 antialiased">
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Main page content container */}
      <main className="pl-0 md:pl-[72px] pb-24 md:pb-8 mx-auto max-w-6xl py-8 space-y-6">
        {/* Main Content Viewport Header */}
        <div className="flex justify-between items-center border-b border-[var(--color-ink)] border-opacity-10 pb-4 gap-2 flex-wrap">
          <div style={{ fontFamily: 'var(--font-mono)' }} className="text-xs font-bold text-[var(--color-ink-muted)] uppercase shrink-0">
            // KINY_OS_STANDBY
          </div>
          <div className="flex items-center gap-3">
            {profile && profile.current_streak !== undefined && profile.current_streak > 0 && (
              <div 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="px-3 py-1.5 bg-[var(--color-danger)] text-white font-extrabold text-xs uppercase border-2 border-[var(--color-border)] shadow-[var(--shadow-btn-active)] rounded-[var(--border-radius)] whitespace-nowrap shrink-0"
              >
                🔥 {profile.current_streak}_DAY_STREAK
              </div>
            )}
            <SyncIndicator />
          </div>
        </div>

        <OfflineBanner />
        <CreatorAppreciationBanner />
        {children}
        <UpdatePrompt />
        <InstallPrompt />
      </main>
    </div>
  );
}
