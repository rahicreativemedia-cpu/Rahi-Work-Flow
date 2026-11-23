import React from 'react';
import { Search } from 'lucide-react';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  filters?: {
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onChange: (val: string) => void;
  }[];
  actionButton?: React.ReactNode;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  placeholder = 'Search...',
  filters,
  actionButton,
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-neutral-200 shadow-xs mb-5">
      <div className="flex-1 relative flex items-center">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-black placeholder:text-neutral-400"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {filters?.map((filter, idx) => (
          <select
            key={idx}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 hover:bg-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black cursor-pointer"
          >
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {filter.label ? `${filter.label}: ${opt.label}` : opt.label}
              </option>
            ))}
          </select>
        ))}

        {actionButton}
      </div>
    </div>
  );
}
