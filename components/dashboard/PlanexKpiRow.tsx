import React from 'react';
import { FolderGit2, CheckCircle2, Clock, Users, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiItem {
  id: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  onClick?: () => void;
}

interface PlanexKpiRowProps {
  items?: KpiItem[];
  className?: string;
}

export function PlanexKpiRow({ items, className }: PlanexKpiRowProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            onClick={item.onClick}
            className={cn(
              'liquid-glass rounded-3xl p-5.5 flex flex-col justify-between group',
              item.onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
            )}
          >
            <div className="flex items-center gap-2.5 text-stone-400 mb-2.5">
              <div className="w-7 h-7 rounded-lg liquid-glass-subtle flex items-center justify-center text-stone-500 group-hover:text-[#ED1C24] transition-colors">
                <Icon className="w-4 h-4 stroke-[1.8]" />
              </div>
              <span className="text-2xl sm:text-[26px] font-extrabold text-[#171717] tracking-tight leading-none">
                {item.value}
              </span>
            </div>
            <p className="text-xs font-semibold text-stone-500 tracking-tight">
              {item.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
