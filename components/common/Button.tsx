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
      'bg-black hover:bg-neutral-800 text-white shadow-xs border border-black focus:ring-black/20',
    secondary:
      'bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-200 focus:ring-black/10',
    outline:
      'bg-white hover:bg-neutral-50 text-black border border-neutral-300 shadow-2xs focus:ring-black/10',
    danger:
      'bg-neutral-900 hover:bg-black text-white border border-black focus:ring-black/20',
    ghost:
      'bg-transparent hover:bg-neutral-100 text-neutral-800 hover:text-black border border-transparent focus:ring-black/10',
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
