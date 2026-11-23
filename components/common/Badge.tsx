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
    slate: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    blue: 'bg-black text-white border-black',
    emerald: 'bg-neutral-900 text-white border-neutral-800',
    amber: 'bg-neutral-100 text-neutral-900 border-neutral-300 font-semibold',
    rose: 'bg-neutral-200 text-neutral-900 border-neutral-400 font-medium',
    purple: 'bg-neutral-800 text-white border-neutral-700',
    cyan: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    indigo: 'bg-black text-white border-black',
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
