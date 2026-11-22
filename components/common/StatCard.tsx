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
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border p-5 shadow-xs transition-all duration-200',
        highlight
          ? 'border-blue-300 ring-2 ring-blue-500/10'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className={cn('p-2 rounded-lg', colorMap[color])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h4>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              trend.positive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  );
}
