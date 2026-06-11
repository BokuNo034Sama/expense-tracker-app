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
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] transition-colors duration-200 antialiased">
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Main page content container */}
      <main className="pl-[72px] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <OfflineBanner />
        <CreatorAppreciationBanner />
        {children}
        <UpdatePrompt />
        <InstallPrompt />
      </main>
    </div>
  );
}
