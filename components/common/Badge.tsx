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
    slate: 'bg-stone-100 text-stone-800 border-stone-200',
    blue: 'bg-rose-950 text-rose-100 border-rose-800',
    emerald: 'bg-stone-900 text-white border-stone-800',
    amber: 'bg-rose-50 text-rose-900 border-rose-200 font-semibold',
    rose: 'bg-rose-100 text-rose-950 border-rose-300 font-semibold',
    purple: 'bg-rose-950 text-rose-100 border-rose-800',
    cyan: 'bg-stone-100 text-stone-800 border-stone-200',
    indigo: 'bg-rose-950 text-rose-100 border-rose-800',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
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
