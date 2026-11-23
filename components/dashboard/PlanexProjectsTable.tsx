import React from 'react';
import { Plus, Calendar, ChevronRight } from 'lucide-react';
import { Project, Deliverable } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

interface PlanexProjectsTableProps {
  projects: Project[];
  deliverables?: Deliverable[];
  onCreateProject?: () => void;
  onSelectProject?: (project: Project) => void;
  className?: string;
}

export function PlanexProjectsTable({
  projects = [],
  deliverables = [],
  onCreateProject,
  onSelectProject,
  className,
}: PlanexProjectsTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return { label: 'In Progress', cls: 'bg-blue-50 text-blue-700 border-blue-200/60' };
      case 'completed':
        return { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' };
      case 'review':
        return { label: 'In Review', cls: 'bg-amber-50 text-amber-700 border-amber-200/60' };
      case 'on_hold':
      case 'cancelled':
        return { label: 'At Risk', cls: 'bg-rose-50 text-rose-700 border-rose-200/60' };
      default:
        return { label: 'Active', cls: 'bg-stone-50 text-stone-700 border-stone-200' };
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return { label: 'High', cls: 'bg-rose-50 text-rose-600 border-rose-100' };
      case 'medium':
        return { label: 'Medium', cls: 'bg-amber-50 text-amber-600 border-amber-100' };
      default:
        return { label: 'Low', cls: 'bg-stone-50 text-stone-600 border-stone-200' };
    }
  };

  return (
    <div className={cn('liquid-glass rounded-3xl p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-stone-900 tracking-tight">Projects</h3>
          <p className="text-xs text-stone-400 mt-0.5">Your active projects overview</p>
        </div>
        {onCreateProject && (
          <button
            onClick={onCreateProject}
            className="px-4 py-2 bg-[#171717] hover:bg-[#ED1C24] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.12)] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200/50 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              <th className="pb-3 pr-4">Project Name</th>
              <th className="pb-3 px-4">Status</th>
              <th className="pb-3 px-4">Progress</th>
              <th className="pb-3 px-4">Priority</th>
              <th className="pb-3 px-4">Deadline</th>
              <th className="pb-3 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/40 text-xs">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-stone-400">
                  <p className="font-medium">No projects created yet.</p>
                  {onCreateProject && (
                    <button
                      onClick={onCreateProject}
                      className="mt-2 text-xs font-semibold text-[#ED1C24] hover:underline"
                    >
                      Create your first project
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              projects.map((proj) => {
                const status = getStatusBadge(proj.status);
                const priority = getPriorityBadge(proj.priority);
                const progressVal = proj.progress ?? (proj.status === 'completed' ? 100 : 50);

                return (
                  <tr
                    key={proj.id}
                    className="group hover:bg-white/60 transition-colors cursor-pointer"
                    onClick={() => onSelectProject && onSelectProject(proj)}
                  >
                    {/* Project Name */}
                    <td className="py-4 pr-4">
                      <div>
                        <span className="font-bold text-stone-900 group-hover:text-black transition-colors block">
                          {proj.title}
                        </span>
                        <span className="text-[11px] text-stone-400 block mt-0.5">
                          {proj.clientName || 'Agency Project'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[11px] font-semibold border inline-block',
                          status.cls
                        )}
                      >
                        {status.label}
                      </span>
                    </td>

                    {/* Progress Bar */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5 min-w-[130px]">
                        <div className="w-24 h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-stone-900 rounded-full transition-all duration-300"
                            style={{ width: `${progressVal}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-stone-700 w-8">
                          {progressVal}%
                        </span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[11px] font-medium border inline-block',
                          priority.cls
                        )}
                      >
                        {priority.label}
                      </span>
                    </td>

                    {/* Deadline */}
                    <td className="py-4 px-4 whitespace-nowrap text-stone-600 font-medium">
                      <span className="inline-flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {proj.targetEndDate ? formatDate(proj.targetEndDate) : 'Flexible'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 pl-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectProject) onSelectProject(proj);
                        }}
                        className="text-[11px] font-bold text-stone-600 hover:text-stone-900 inline-flex items-center gap-0.5 group-hover:underline"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
