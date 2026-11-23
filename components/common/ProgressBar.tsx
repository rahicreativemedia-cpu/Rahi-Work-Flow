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

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full space-y-1', className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-bold text-rose-950">{clamped}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-stone-200/70 rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-rose-900 to-rose-700"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
