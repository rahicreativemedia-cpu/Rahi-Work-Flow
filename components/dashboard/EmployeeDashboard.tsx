import React from 'react';
import { Task, Deliverable, User } from '@/lib/types';
import { TODAY_STRING, formatDate } from '@/lib/utils';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Award,
  Layers,
} from 'lucide-react';
import { PlanexGreetingBar } from './PlanexGreetingBar';
import { PlanexKpiRow, KpiItem } from './PlanexKpiRow';
import { PlanexCalendar, CalendarEventItem } from './PlanexCalendar';
import { cn } from '@/lib/utils';

interface EmployeeDashboardProps {
  tasks: Task[];
  deliverables: Deliverable[];
  currentUser: User;
  onSelectTask: (task: Task) => void;
  onSubmitWork: (task: Task) => void;
  onNavigateTab: (tab: string) => void;
}

export function EmployeeDashboard({
  tasks,
  deliverables,
  currentUser,
  onSelectTask,
  onSubmitWork,
  onNavigateTab,
}: EmployeeDashboardProps) {
  const today = TODAY_STRING;

  // Strictly filter to tasks assigned to this employee (no client financial data or unassigned tasks)
  const myTasks = tasks.filter(
    (t) =>
      t.assignedEmployeeId === currentUser.employeeId ||
      t.assignedEmployeeId === currentUser.id ||
      t.assignedEmployeeName.toLowerCase() === currentUser.name.toLowerCase()
  );

  const activeTasks = myTasks.filter((t) => t.status !== 'completed');
  const completedTasks = myTasks.filter((t) => t.status === 'completed');
  const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress');
  const revisionTasks = myTasks.filter((t) => t.status === 'revision');
  const overdueTasks = activeTasks.filter((t) => t.deadline && t.deadline < today);

  // 4 Employee KPI Cards (No financial information exposed)
  const kpiItems: KpiItem[] = [
    {
      id: 'assigned_tasks',
      label: 'My Active Tasks',
      value: activeTasks.length,
      icon: CheckSquare,
      onClick: () => onNavigateTab('my_tasks'),
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      value: inProgressTasks.length,
      icon: Layers,
      onClick: () => onNavigateTab('my_tasks'),
    },
    {
      id: 'revisions',
      label: 'Revision Requests',
      value: revisionTasks.length,
      icon: AlertTriangle,
      onClick: () => onNavigateTab('feedback_revisions'),
    },
    {
      id: 'completed_tasks',
      label: 'Completed Tasks',
      value: completedTasks.length,
      icon: CheckCircle2,
      onClick: () => onNavigateTab('my_tasks'),
    },
  ];

  // Calendar Events from employee's assigned tasks
  const calendarEvents: CalendarEventItem[] = myTasks
    .filter((t) => t.deadline)
    .map((t) => ({
      id: t.id,
      title: t.title,
      date: t.deadline.split('T')[0],
      type: 'task' as const,
      priority: t.priority,
    }));

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'medium':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      default:
        return 'bg-stone-50 text-stone-600 border-stone-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return { label: 'In Progress', cls: 'bg-blue-50 text-blue-700 border-blue-200/60' };
      case 'completed':
        return { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' };
      case 'in_review':
        return { label: 'In Review', cls: 'bg-amber-50 text-amber-700 border-amber-200/60' };
      case 'revision':
        return { label: 'Needs Revision', cls: 'bg-rose-50 text-rose-700 border-rose-200/60' };
      default:
        return { label: 'To Do', cls: 'bg-stone-50 text-stone-700 border-stone-200' };
    }
  };

  // Urgent or next pending task for featured display
  const featuredTask =
    myTasks.find((t) => t.status === 'revision' || t.status === 'in_progress') ||
    myTasks[0];

  return (
    <div className="space-y-6">
      {/* 1. Top Greeting Bar */}
      <PlanexGreetingBar
        userName={currentUser.name.split(' ')[0] || currentUser.name}
        subtitle="Here is a quick overview of your assigned creative tasks and deadlines."
        primaryActionLabel="Submit Work"
        onPrimaryAction={() => {
          if (activeTasks.length > 0) {
            onSubmitWork(activeTasks[0]);
          } else {
            onNavigateTab('submit_work');
          }
        }}
      />

      {/* 2. KPI Cards Row */}
      <PlanexKpiRow items={kpiItems} />

      {/* 3. Main 2-Column Split matching Planex Reference */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column (~64% width on desktop) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* My Assigned Tasks Table */}
          <div className="liquid-glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-stone-900 tracking-tight">My Tasks</h3>
                <p className="text-xs text-stone-400 mt-0.5">Assigned creative workflow deliverables</p>
              </div>
              <button
                onClick={() => onNavigateTab('submit_work')}
                className="px-4 py-2 bg-[#171717] hover:bg-[#ED1C24] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Submit Work</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/50 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Task Name</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Priority</th>
                    <th className="pb-3 px-4">Deadline</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/40 text-xs">
                  {myTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-stone-400">
                        <CheckCircle2 className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                        <p className="font-medium text-stone-600">All caught up!</p>
                        <p className="text-xs text-stone-400 mt-0.5">No tasks currently assigned to you.</p>
                      </td>
                    </tr>
                  ) : (
                    myTasks.map((t) => {
                      const status = getStatusBadge(t.status);
                      const priorityCls = getPriorityStyle(t.priority);

                      return (
                        <tr
                          key={t.id}
                          className="group hover:bg-white/60 transition-colors cursor-pointer"
                          onClick={() => onSelectTask(t)}
                        >
                          <td className="py-4 pr-4">
                            <div>
                              <span className="font-bold text-stone-900 group-hover:text-black transition-colors block">
                                {t.title}
                              </span>
                              <span className="text-[11px] text-stone-400 block mt-0.5">
                                {t.projectTitle || 'Creative Task'}
                              </span>
                            </div>
                          </td>
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
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={cn(
                                'px-2.5 py-0.5 rounded-full text-[11px] font-medium border inline-block',
                                priorityCls
                              )}
                            >
                              {t.priority.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap text-stone-600 font-medium">
                            <span className="inline-flex items-center gap-1.5 text-[11px]">
                              <Calendar className="w-3.5 h-3.5 text-stone-400" />
                              {t.deadline ? formatDate(t.deadline) : 'Flexible'}
                            </span>
                          </td>
                          <td className="py-4 pl-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              {t.status !== 'completed' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSubmitWork(t);
                                  }}
                                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-full text-[11px] font-semibold transition-colors"
                                >
                                  Submit
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectTask(t);
                                }}
                                className="text-[11px] font-bold text-stone-600 hover:text-stone-900 inline-flex items-center gap-0.5 group-hover:underline"
                              >
                                <span>Details</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revision Requests Callout or Task Board */}
          {revisionTasks.length > 0 && (
            <div className="bg-rose-50/60 rounded-3xl border border-rose-200/80 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  Action Required: Revision Requested ({revisionTasks.length})
                </h4>
              </div>
              <p className="text-xs text-rose-800 mb-3">
                Manager or client requested changes on your submission. Review the notes and submit a new revision.
              </p>
              <div className="space-y-2">
                {revisionTasks.map((rt) => (
                  <div
                    key={rt.id}
                    onClick={() => onSelectTask(rt)}
                    className="p-3 bg-white rounded-xl border border-rose-200 flex items-center justify-between gap-3 cursor-pointer hover:shadow-xs transition-shadow"
                  >
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">{rt.title}</span>
                      <span className="text-[11px] text-rose-600 font-medium">Click to view revision feedback</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSubmitWork(rt);
                      }}
                      className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-semibold shrink-0"
                    >
                      Re-submit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (~36% width on desktop) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Calendar Card */}
          <PlanexCalendar
            events={calendarEvents}
            onSelectDate={(d) => {}}
          />

          {/* Performance & Status Summary Card */}
          <div className="liquid-glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-stone-900 tracking-tight">Performance</h3>
                <p className="text-xs text-stone-400 mt-0.5">Deliverable milestones and turnaround</p>
              </div>
              <div className="p-1.5 liquid-glass-subtle rounded-full text-emerald-700">
                <Award className="w-4 h-4" />
              </div>
            </div>

            {/* Featured Task */}
            {featuredTask ? (
              <div
                onClick={() => onSelectTask(featuredTask)}
                className="p-4 rounded-2xl liquid-glass-subtle hover:border-white transition-all cursor-pointer mb-6"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 line-clamp-1">{featuredTask.title}</h4>
                    <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                      {featuredTask.projectTitle || 'Assigned deliverable'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0',
                      getStatusBadge(featuredTask.status).cls
                    )}
                  >
                    {getStatusBadge(featuredTask.status).label}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                  <span>Due Date</span>
                  <span className="font-semibold text-stone-800">
                    {featuredTask.deadline ? formatDate(featuredTask.deadline) : 'Flexible'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-stone-50 border border-dashed border-stone-200 text-center mb-6">
                <p className="text-xs text-stone-500">No active tasks</p>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 text-center">
              <div>
                <span className="text-xl font-bold text-stone-900">
                  {String(myTasks.length).padStart(2, '0')}
                </span>
                <p className="text-[11px] text-stone-400 font-medium mt-0.5">Assigned</p>
              </div>
              <div>
                <span className="text-xl font-bold text-stone-900">
                  {String(completedTasks.length).padStart(2, '0')}
                </span>
                <p className="text-[11px] text-stone-400 font-medium mt-0.5">Completed</p>
              </div>
              <div>
                <span className="text-xl font-bold text-stone-900">
                  {String(revisionTasks.length).padStart(2, '0')}
                </span>
                <p className="text-[11px] text-stone-400 font-medium mt-0.5">Revisions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
