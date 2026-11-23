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
      'bg-gradient-to-r from-rose-900 via-rose-950 to-rose-900 hover:brightness-110 text-white shadow-xs border border-rose-800/60 focus:ring-rose-500/20',
    secondary:
      'bg-rose-50/80 hover:bg-rose-100 text-rose-950 border border-rose-200/80 focus:ring-rose-500/10 font-semibold',
    outline:
      'bg-white hover:bg-rose-50/50 text-stone-900 border border-stone-200 shadow-2xs focus:ring-rose-500/10',
    danger:
      'bg-rose-950 hover:bg-black text-rose-100 border border-rose-900 focus:ring-rose-500/20',
    ghost:
      'bg-transparent hover:bg-rose-50/70 text-stone-700 hover:text-rose-950 border border-transparent focus:ring-rose-500/10',
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
