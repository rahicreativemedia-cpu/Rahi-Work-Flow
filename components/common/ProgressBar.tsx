import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  showPercent?: boolean;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  progress,
  label,
  showPercent = true,
  color = 'blue',
  size = 'md',
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  const colorStyles = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-600',
    rose: 'bg-rose-600',
    indigo: 'bg-indigo-600',
    purple: 'bg-purple-600',
  };

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full space-y-1', className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-semibold text-slate-800">{clamped}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', colorStyles[color])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
