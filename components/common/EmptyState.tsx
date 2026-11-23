import React from 'react';
import { LucideIcon, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'p-10 text-center bg-white rounded-xl border border-dashed border-neutral-200 flex flex-col items-center justify-center space-y-3',
        className
      )}
    >
      <div className="p-3 bg-neutral-50 text-neutral-400 rounded-full border border-neutral-100">
        <Icon className="w-6 h-6" />
      </div>
      <div className="max-w-sm space-y-1">
        <h4 className="text-xs font-semibold text-neutral-800">{title}</h4>
        {description && <p className="text-[11px] text-neutral-400 leading-relaxed">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
