import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export function Textarea({
  label,
  helperText,
  error,
  className,
  id,
  required,
  rows = 3,
  ...props
}: TextareaProps) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold text-neutral-800">
          {label} {required && <span className="text-black font-bold">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        className={cn(
          'w-full text-xs p-2.5 bg-neutral-50/70 hover:bg-neutral-100/50 focus:bg-white border rounded-lg text-black placeholder:text-neutral-400 transition-all duration-150 focus:outline-hidden focus:ring-2 disabled:bg-neutral-100 disabled:cursor-not-allowed leading-relaxed',
          error
            ? 'border-neutral-900 focus:ring-black/10 focus:border-black'
            : 'border-neutral-300 focus:ring-black/10 focus:border-black',
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-[11px] text-black font-semibold">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
}
