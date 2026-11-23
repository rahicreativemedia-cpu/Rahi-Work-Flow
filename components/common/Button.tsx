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
      'bg-black hover:bg-neutral-800 text-white shadow-xs border border-black focus:ring-stone-900/20 font-semibold',
    secondary:
      'bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-200/80 focus:ring-stone-400/20 font-semibold',
    outline:
      'bg-white hover:bg-stone-50 text-stone-900 border border-[#E2DDD8] shadow-2xs focus:ring-stone-400/20 font-semibold',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 focus:ring-rose-500/20 font-semibold',
    ghost:
      'bg-transparent hover:bg-stone-100 text-stone-700 hover:text-stone-900 border border-transparent focus:ring-stone-400/10 font-medium',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-full gap-1.5',
    md: 'text-xs px-4 py-2 rounded-full gap-2',
    lg: 'text-sm px-5 py-2.5 rounded-full gap-2.5',
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
