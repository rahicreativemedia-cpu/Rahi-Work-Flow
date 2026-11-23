import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  className,
  id,
  required,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-neutral-800">
          {label} {required && <span className="text-black font-bold">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-neutral-400 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          required={required}
          className={cn(
            'w-full text-xs p-2.5 bg-neutral-50/70 hover:bg-neutral-100/50 focus:bg-white border rounded-lg text-black placeholder:text-neutral-400 transition-all duration-150 focus:outline-hidden focus:ring-2 disabled:bg-neutral-100 disabled:cursor-not-allowed',
            error
              ? 'border-rose-800 focus:ring-rose-500/20 focus:border-rose-900'
              : 'border-stone-200 focus:ring-rose-500/10 focus:border-rose-800',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-neutral-400 pointer-events-none flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-[11px] text-black font-semibold">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
}
