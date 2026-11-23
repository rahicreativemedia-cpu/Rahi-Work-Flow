import React, { useState } from 'react';
import { Task, User, TaskStatus, Priority } from '@/lib/types';
import { getPriorityBadge, getTaskStatusBadge, TODAY_STRING } from '@/lib/utils';
import { hasFullAdminAccess } from '@/lib/permissions';
import { SearchFilterBar } from '../common/SearchFilterBar';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Plus,
  Paperclip,
  MessageSquare,
  UploadCloud,
  ChevronRight,
} from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  currentUser: User;
  onSelectTask: (task: Task) => void;
  onCreateTask?: () => void;
  onSubmitWork?: (task: Task) => void;
}

export function TaskList({
  tasks,
  currentUser,
  onSelectTask,
  onCreateTask,
  onSubmitWork,
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const canAdmin = hasFullAdminAccess(currentUser);
  const isEmployee = currentUser.role === 'employee';

  const filteredTasks = tasks.filter((t) => {
    // If employee, backend and frontend ensure only assigned tasks
    if (isEmployee) {
      const match =
        t.assignedEmployeeId === currentUser.employeeId ||
        t.assignedEmployeeId === currentUser.id ||
        t.assignedEmployeeName.toLowerCase() === currentUser.name.toLowerCase();
      if (!match) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchClient = t.clientName.toLowerCase().includes(q);
      const matchEmp = t.assignedEmployeeName.toLowerCase().includes(q);
      if (!matchTitle && !matchClient && !matchEmp) return false;
    }

    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Bar with Filter & Action */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search tasks by title, client, or assignee..."
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'All Statuses', value: 'all' },
              { label: 'To Do', value: 'todo' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Internal Review', value: 'in_review' },
              { label: 'Revision', value: 'revision' },
              { label: 'Completed', value: 'completed' },
            ],
            onChange: setStatusFilter,
          },
          {
            label: 'Priority',
            value: priorityFilter,
            options: [
              { label: 'All Priorities', value: 'all' },
              { label: 'Urgent', value: 'urgent' },
              { label: 'High', value: 'high' },
              { label: 'Medium', value: 'medium' },
              { label: 'Low', value: 'low' },
            ],
            onChange: setPriorityFilter,
          },
        ]}
        actionButton={
          canAdmin && onCreateTask ? (
            <button
              onClick={onCreateTask}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-rose-900 to-rose-950 hover:brightness-110 text-white rounded-lg text-xs font-semibold shadow-xs transition-all border border-rose-800 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          ) : null
        }
      />

      {/* Task List Table / Cards */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              {isEmployee ? 'My Assigned Creative Tasks' : 'All Agency Operational Tasks'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {isEmployee
                ? 'Only work assigned to you is visible in your portal.'
                : 'Shared company-wide task list accessible by both Admin and Manager.'}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 rounded-lg text-neutral-700">
            {filteredTasks.length} Tasks
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            No tasks match your active filter.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredTasks.map((task) => {
              const priorityBadge = getPriorityBadge(task.priority);
              const statusBadge = getTaskStatusBadge(task.status);
              const today = TODAY_STRING;
              const isOverdue = task.deadline < today && task.status !== 'completed';

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="p-4 sm:p-5 hover:bg-neutral-50/70 transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">
                        {task.clientName}
                      </span>
                      <span className="text-xs text-neutral-400">•</span>
                      <span className="text-xs text-neutral-500 font-medium truncate max-w-[200px]">
                        {task.projectTitle}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge.bg}`}
                      >
                        {priorityBadge.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-neutral-900 group-hover:text-neutral-600 transition-colors">
                      {task.title}
                    </h4>

                    <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                      {task.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-neutral-400">
                      <span>
                        Assignee: <strong className="text-neutral-700">{task.assignedEmployeeName}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className={isOverdue ? 'text-black font-bold underline' : 'text-neutral-600'}>
                          Due {task.deadline} {isOverdue && '(OVERDUE)'}
                        </span>
                      </span>
                      {task.referenceFiles.length > 0 && (
                        <span className="flex items-center gap-1 text-neutral-500">
                          <Paperclip className="w-3 h-3" /> {task.referenceFiles.length} file(s)
                        </span>
                      )}
                      {task.submissions.length > 0 && (
                        <span className="flex items-center gap-1 text-neutral-800 font-medium">
                          v{task.submissions.length} submitted
                        </span>
                      )}
                      {task.comments.length > 0 && (
                        <span className="flex items-center gap-1 text-neutral-500">
                          <MessageSquare className="w-3 h-3" /> {task.comments.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Employee Quick Submit Work Action */}
                    {isEmployee && task.status !== 'completed' && onSubmitWork && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSubmitWork(task);
                        }}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-black rounded-lg text-xs font-semibold flex items-center gap-1 border border-neutral-300"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Submit Work</span>
                      </button>
                    )}

                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
