import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    positive?: boolean;
  };
  highlight?: boolean;
  color?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple';
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  highlight = false,
  color = 'blue',
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border p-5 shadow-xs transition-all duration-200',
        highlight
          ? 'border-rose-800 ring-2 ring-rose-500/10 bg-rose-50/10'
          : 'border-stone-200/90 hover:border-rose-200 hover:shadow-sm',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className="p-2 rounded-lg bg-rose-50 text-rose-950 border border-rose-100">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h4 className="text-2xl font-black text-stone-900 tracking-tight">{value}</h4>
        {trend && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-900 border border-rose-200">
            {trend.value}
          </span>
        )}
      </div>

      {subtext && <p className="text-xs text-stone-400 mt-1">{subtext}</p>}
    </div>
  );
}
