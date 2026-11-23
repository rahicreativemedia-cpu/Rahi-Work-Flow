import React from 'react';
import { Filter } from 'lucide-react';
import { Project, Deliverable } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PlanexProjectSummaryProps {
  projects: Project[];
  deliverables?: Deliverable[];
  onFilterClick?: () => void;
  onSelectProject?: (project: Project) => void;
  className?: string;
}

export function PlanexProjectSummary({
  projects = [],
  deliverables = [],
  onFilterClick,
  onSelectProject,
  className,
}: PlanexProjectSummaryProps) {
  // Stats
  const totalProjects = projects.length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const blockedProjects = projects.filter(
    (p) => p.status === 'on_hold' || p.status === 'cancelled'
  ).length;

  // Featured project (pick first active or in_review or in_progress project)
  const featured =
    projects.find((p) => p.status === 'in_progress' || p.status === 'review') ||
    projects[0];

  // Calculate progress for featured project if available
  const featuredProgress = featured ? (featured.progress ?? 65) : 0;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'in_progress':
        return { label: 'In Progress', bg: 'bg-blue-50 text-blue-700 border-blue-100' };
      case 'completed':
        return { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'review':
        return { label: 'In Review', bg: 'bg-amber-50 text-amber-700 border-amber-100' };
      case 'on_hold':
      case 'cancelled':
        return { label: 'At Risk', bg: 'bg-rose-50 text-rose-700 border-rose-100' };
      default:
        return { label: 'Active', bg: 'bg-stone-100 text-stone-700 border-stone-200' };
    }
  };

  const statusBadge = getStatusBadge(featured?.status);

  return (
    <div className={cn('liquid-glass rounded-3xl p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-stone-900 tracking-tight">Projects</h3>
          <p className="text-xs text-stone-400 mt-0.5">Manage and track all your projects</p>
        </div>
        <button
          onClick={onFilterClick}
          className="px-3 py-1.5 liquid-glass-pill text-stone-700 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Filter className="w-3.5 h-3.5 text-stone-500" />
          <span>Filter</span>
        </button>
      </div>

      {/* Featured Project Card */}
      {featured ? (
        <div
          onClick={() => onSelectProject && onSelectProject(featured)}
          className="p-4 rounded-2xl liquid-glass-subtle hover:border-white transition-all cursor-pointer mb-6"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="text-sm font-bold text-stone-900 line-clamp-1">{featured.title}</h4>
              <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                {featured.description || `${featured.clientName} project`}
              </p>
            </div>
            <span
              className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0',
                statusBadge.bg
              )}
            >
              {statusBadge.label}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-stone-500 font-medium">Progress</span>
              <span className="text-stone-900 font-bold">{featuredProgress}%</span>
            </div>
            <div className="w-full h-2 bg-stone-200/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-stone-900 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Math.max(featuredProgress, 0), 100)}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl liquid-glass-subtle border border-dashed border-stone-300/60 text-center mb-6">
          <p className="text-xs text-stone-500">No active projects to showcase</p>
        </div>
      )}

      {/* Bottom Summary Stats: Total | Completed | Blocked */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200/50 text-center">
        <div>
          <span className="text-xl font-bold text-stone-900">
            {String(totalProjects).padStart(2, '0')}
          </span>
          <p className="text-[11px] text-stone-400 font-medium mt-0.5">Total</p>
        </div>
        <div>
          <span className="text-xl font-bold text-stone-900">
            {String(completedProjects).padStart(2, '0')}
          </span>
          <p className="text-[11px] text-stone-400 font-medium mt-0.5">Completed</p>
        </div>
        <div>
          <span className="text-xl font-bold text-stone-900">
            {String(blockedProjects).padStart(2, '0')}
          </span>
          <p className="text-[11px] text-stone-400 font-medium mt-0.5">Blocked</p>
        </div>
      </div>
    </div>
  );
}
