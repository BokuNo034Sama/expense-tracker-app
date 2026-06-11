import React from 'react';
import { Sidebar } from './Sidebar';
import { OfflineBanner } from '../pwa/OfflineBanner';
import { UpdatePrompt } from '../pwa/UpdatePrompt';
import { InstallPrompt } from '../pwa/InstallPrompt';
import { CreatorAppreciationBanner } from '../dashboard/CreatorAppreciationBanner';

interface LayoutProps {
  children: React.ReactNode;
  onAddExpense?: () => void;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden px-4 md:px-8 bg-[var(--color-bg)] text-[var(--color-ink)] transition-colors duration-200 antialiased">
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Main page content container */}
      <main className="pl-0 md:pl-[72px] pb-24 md:pb-8 mx-auto max-w-6xl py-8 space-y-6">
        <OfflineBanner />
        <CreatorAppreciationBanner />
        {children}
        <UpdatePrompt />
        <InstallPrompt />
      </main>
    </div>
  );
}
