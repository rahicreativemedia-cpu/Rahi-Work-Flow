import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CalendarEventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type?: 'task' | 'deliverable' | 'deadline';
  priority?: string;
}

interface PlanexCalendarProps {
  events?: CalendarEventItem[];
  onAddEvent?: () => void;
  onSelectDate?: (dateStr: string) => void;
  className?: string;
}

export function PlanexCalendar({
  events = [],
  onAddEvent,
  onSelectDate,
  className,
}: PlanexCalendarProps) {
  // Current displayed month & year
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar calculations
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid cells
  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  // Group events by date string YYYY-MM-DD
  const eventDateSet = new Set(events.map((e) => e.date));

  const handleDateClick = (day: number) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const fullDate = `${year}-${monthStr}-${dayStr}`;
    setSelectedDate(fullDate);
    if (onSelectDate) {
      onSelectDate(fullDate);
    }
  };

  return (
    <div className={cn('liquid-glass rounded-3xl p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-stone-900 tracking-tight">Calendar</h3>
          <p className="text-xs text-stone-400 mt-0.5">View tasks and project deadlines</p>
        </div>
        {onAddEvent && (
          <button
            onClick={onAddEvent}
            className="px-3.5 py-1.5 bg-[#171717] hover:bg-[#ED1C24] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.12)] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>
        )}
      </div>

      {/* Month & Year Navigation */}
      <div className="flex items-center justify-between py-2 px-1 mb-2">
        <span className="text-sm font-semibold text-stone-900 tracking-tight">
          {monthNames[month]} {year}
        </span>
        <div className="flex items-center gap-1 text-stone-500">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-white/80 rounded-full transition-colors text-stone-600"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-white/80 rounded-full transition-colors text-stone-600"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day of week labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-[11px] font-medium text-stone-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Dates Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-9" />;
          }

          const monthStr = String(month + 1).padStart(2, '0');
          const dayStr = String(day).padStart(2, '0');
          const dateStr = `${year}-${monthStr}-${dayStr}`;
          const isSelected = selectedDate === dateStr;
          const hasEvent = eventDateSet.has(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => handleDateClick(day)}
              className={cn(
                'h-9 rounded-xl flex flex-col items-center justify-center relative text-xs transition-all',
                isSelected
                  ? 'bg-white/95 font-bold text-[#171717] shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)] border border-white ring-2 ring-[#ED1C24]/15'
                  : 'text-stone-700 hover:bg-white/60 hover:backdrop-blur-xs font-medium'
              )}
            >
              <span>{dayStr}</span>
              {hasEvent && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ED1C24] absolute bottom-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
