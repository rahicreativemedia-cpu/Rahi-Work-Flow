import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan' | 'indigo';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'slate', size = 'sm', className }: BadgeProps) {
  const variantStyles = {
    slate: 'bg-stone-100 text-stone-700 border-stone-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/60',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/60 font-semibold',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/60 font-semibold',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/60',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200/60',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs font-medium px-3 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
