import React from 'react';
import * as Icons from 'lucide-react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = 'FolderOpen', title, message, action }: EmptyStateProps) {
  const renderIcon = () => {
    const LucideIcon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[icon] || Icons.FolderOpen;
    return <LucideIcon className="h-10 w-10 text-[var(--color-ink-muted)] mb-3" />;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 border-[var(--border-default)] border-dashed rounded-[var(--border-radius)] bg-[var(--color-surface)] text-center my-4">
      {renderIcon()}
      <h3 
        style={{ fontFamily: 'var(--font-display)' }}
        className="text-sm font-extrabold uppercase text-[var(--color-ink)] tracking-wider mb-1"
      >
        {title}
      </h3>
      <p 
        style={{ fontFamily: 'var(--font-mono)' }}
        className="text-xs text-[var(--color-ink-muted)] leading-relaxed max-w-[280px] mb-4 uppercase"
      >
        {message}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
