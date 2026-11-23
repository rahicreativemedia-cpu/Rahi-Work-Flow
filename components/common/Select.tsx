import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  helperText?: string;
  error?: string;
}

export function Select({
  label,
  options,
  children,
  helperText,
  error,
  className,
  id,
  required,
  ...props
}: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-neutral-800">
          {label} {required && <span className="text-black font-bold">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          id={selectId}
          required={required}
          className={cn(
            'w-full text-xs p-2.5 pr-8 bg-neutral-50/70 hover:bg-neutral-100/50 focus:bg-white border rounded-lg text-black transition-all duration-150 focus:outline-hidden focus:ring-2 appearance-none cursor-pointer disabled:bg-neutral-100 disabled:cursor-not-allowed',
            error
              ? 'border-rose-800 focus:ring-rose-500/20 focus:border-rose-900'
              : 'border-stone-200 focus:ring-rose-500/10 focus:border-rose-800',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 pointer-events-none" />
      </div>
      {error ? (
        <p className="text-[11px] text-black font-semibold">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
}
