import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-xs border border-blue-600 hover:border-blue-700 focus:ring-blue-500/30',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 hover:border-slate-300 focus:ring-slate-400/30',
    outline:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-2xs focus:ring-blue-500/20',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs border border-rose-600 hover:border-rose-700 focus:ring-rose-500/30',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent focus:ring-slate-400/20',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1.5 font-medium',
    md: 'text-xs px-3.5 py-2 rounded-lg gap-2 font-semibold',
    lg: 'text-sm px-4 py-2.5 rounded-lg gap-2.5 font-semibold',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none focus:outline-hidden focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
