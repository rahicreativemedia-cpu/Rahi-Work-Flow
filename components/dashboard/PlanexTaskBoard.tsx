import React from 'react';
import { Plus, Clock, CheckCircle2 } from 'lucide-react';
import { Task } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

interface PlanexTaskBoardProps {
  tasks: Task[];
  onCreateTask?: () => void;
  onSelectTask?: (task: Task) => void;
  className?: string;
}

export function PlanexTaskBoard({
  tasks = [],
  onCreateTask,
  onSelectTask,
  className,
}: PlanexTaskBoardProps) {
  // Columns matching Kanban view
  const backlogTasks = tasks.filter((t) => t.status === 'backlog' || t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const reviewTasks = tasks.filter(
    (t) => t.status === 'in_review' || t.status === 'under_review' || t.status === 'revision' || t.status === 'revision_required'
  );
  const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'approved');

  const columns = [
    { id: 'backlog', title: 'Backlog', tasks: backlogTasks },
    { id: 'in_progress', title: 'In Progress', tasks: inProgressTasks },
    { id: 'review', title: 'Under Review', tasks: reviewTasks },
    { id: 'completed', title: 'Completed', tasks: completedTasks },
  ];

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'medium':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  return (
    <div className={cn('liquid-glass rounded-3xl p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-stone-900 tracking-tight">Task Board</h3>
          <p className="text-xs text-stone-400 mt-0.5">Manage tasks across different stages</p>
        </div>
        {onCreateTask && (
          <button
            onClick={onCreateTask}
            className="px-4 py-2 bg-[#171717] hover:bg-[#ED1C24] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.12)] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className="liquid-glass-subtle rounded-2xl p-3 flex flex-col min-h-[220px] transition-all"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-800">{col.title}</span>
                <span className="text-[11px] font-semibold text-stone-500 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/80">
                  {col.tasks.length}
                </span>
              </div>
              {onCreateTask && (
                <button
                  onClick={onCreateTask}
                  className="p-1 hover:bg-white/80 rounded-md text-stone-400 hover:text-stone-700 transition-colors"
                  title={`Add to ${col.title}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Task Cards */}
            <div className="space-y-2.5 flex-1">
              {col.tasks.length === 0 ? (
                <div className="h-full flex items-center justify-center p-4 border border-dashed border-stone-300/60 rounded-xl text-center">
                  <p className="text-[11px] text-stone-400 font-medium">No tasks</p>
                </div>
              ) : (
                col.tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask && onSelectTask(task)}
                    className="p-3 bg-white/85 hover:bg-white backdrop-blur-sm rounded-xl border border-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,1)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                          getPriorityStyle(task.priority)
                        )}
                      >
                        {task.priority.toUpperCase()}
                      </span>
                      {task.status === 'completed' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-stone-900 group-hover:text-black line-clamp-2 leading-snug">
                      {task.title}
                    </h4>

                    {task.clientName && (
                      <p className="text-[10px] text-stone-400 font-medium mt-1 truncate">
                        {task.clientName}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-stone-100 text-[10px] text-stone-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {task.deadline ? formatDate(task.deadline) : 'No due date'}
                      </span>
                      <span className="truncate max-w-[80px] text-stone-400 font-normal">
                        {task.assignedEmployeeName || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
