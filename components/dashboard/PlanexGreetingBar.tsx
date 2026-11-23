import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanexGreetingBarProps {
  userName: string;
  subtitle?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  className?: string;
}

export function PlanexGreetingBar({
  userName,
  subtitle = "Here's a quick overview of your workspace today.",
  primaryActionLabel = 'Create Project',
  onPrimaryAction,
  className,
}: PlanexGreetingBarProps) {
  const [timeframe, setTimeframe] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');

  return (
    <div
      className={cn(
        'flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-1',
        className
      )}
    >
      {/* Welcome Heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
          <span>Welcome back, {userName}</span>
          <span className="text-2xl">👋</span>
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-1 font-normal">
          {subtitle}
        </p>
      </div>

      {/* Right Controls: Today Pill + Capsule + Primary Button */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Today Pill */}
        <div className="flex items-center gap-1.5 px-3.5 py-2 liquid-glass-pill rounded-full text-xs font-semibold text-stone-700 cursor-pointer">
          <CalendarIcon className="w-3.5 h-3.5 text-stone-400" />
          <span>Today</span>
          <ChevronDown className="w-3 h-3 text-stone-400 ml-0.5" />
        </div>

        {/* Timeframe Capsule: Daily | Weekly | Monthly */}
        <div className="flex items-center p-1 liquid-glass-subtle rounded-full">
          {(['Daily', 'Weekly', 'Monthly'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setTimeframe(tab)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                timeframe === tab
                  ? 'bg-white/95 text-stone-900 shadow-xs border border-white/90 font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Primary Action Button: Refined Pill */}
        {onPrimaryAction && (
          <button
            onClick={onPrimaryAction}
            className="px-4 py-2 bg-[#171717] hover:bg-[#ED1C24] text-white rounded-full text-xs font-bold shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{primaryActionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
