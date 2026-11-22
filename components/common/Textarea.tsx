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
        <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        className={cn(
          'w-full text-xs p-2.5 bg-slate-50/70 hover:bg-slate-100/50 focus:bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-hidden focus:ring-2 disabled:bg-slate-100 disabled:cursor-not-allowed leading-relaxed',
          error
            ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
            : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500',
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-[11px] text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}
