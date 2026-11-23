import React from 'react';
import { Task, Deliverable, User } from '@/lib/types';
import { getPriorityBadge, getTaskStatusBadge, TODAY_STRING } from '@/lib/utils';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  UploadCloud,
  FileCheck2,
  Paperclip,
  MessageSquare,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

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

  // Strictly filter to tasks assigned to this employee
  const myTasks = tasks.filter(
    (t) =>
      t.assignedEmployeeId === currentUser.employeeId ||
      t.assignedEmployeeId === currentUser.id ||
      t.assignedEmployeeName.toLowerCase() === currentUser.name.toLowerCase()
  );

  const activeTasks = myTasks.filter((t) => t.status !== 'completed');
  const completedTasks = myTasks.filter((t) => t.status === 'completed');
  const inReviewTasks = myTasks.filter((t) => t.status === 'in_review');
  const revisionTasks = myTasks.filter((t) => t.status === 'revision');
  const overdueTasks = activeTasks.filter((t) => t.deadline < today);

  return (
    <div className="space-y-6">
      {/* Employee Greeting Header */}
      <div className="bg-gradient-to-r from-[#170C12] via-[#24101B] to-[#140810] text-white p-6 rounded-2xl shadow-lg border border-[#3D1A2C] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-950 text-rose-100 border border-rose-800/80">
              EMPLOYEE CREATIVE WORKSPACE
            </span>
            <span className="text-xs text-rose-200/70 font-medium">
              {currentUser.department || 'Creative Team'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white">
            Welcome, {currentUser.name}
          </h2>
          <p className="text-xs text-rose-100/70 mt-1 max-w-xl leading-relaxed">
            Your personalized creative desk. View assigned briefs, track deadlines, submit cuts, and review manager & client feedback.
          </p>
        </div>

        <div className="p-3 bg-[#1F101A] rounded-xl border border-[#3D1A2C] text-xs text-rose-200 flex items-center gap-3">
          <Shield className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-[11px] leading-tight">
            Protected Role: Restricted to your assigned briefs & files.
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Active Tasks"
          value={activeTasks.length}
          subtext="Assigned to you"
          icon={CheckSquare}
          color="blue"
        />
        <StatCard
          label="In Quality Review"
          value={inReviewTasks.length}
          subtext="Waiting for review"
          icon={Clock}
          color="amber"
        />
        <StatCard
          label="Revision Requests"
          value={revisionTasks.length}
          subtext="Action needed"
          icon={AlertTriangle}
          color="rose"
          highlight={revisionTasks.length > 0}
        />
        <StatCard
          label="Completed"
          value={completedTasks.length}
          subtext="Delivered successfully"
          icon={FileCheck2}
          color="emerald"
        />
      </div>

      {/* Active Work Queue */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
              My Active Creative Tasks
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Review brief requirements and submit your output exports.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 rounded-lg text-neutral-600">
            {activeTasks.length} Pending Tasks
          </span>
        </div>

        {activeTasks.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs border border-dashed rounded-lg">
            No active tasks pending. Great work!
          </div>
        ) : (
          <div className="space-y-3">
            {activeTasks.map((task) => {
              const priorityBadge = getPriorityBadge(task.priority);
              const statusBadge = getTaskStatusBadge(task.status);
              const isOverdue = task.deadline < today;

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="p-4 bg-neutral-50 hover:bg-neutral-100/80 rounded-xl border border-neutral-200 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded border border-neutral-300 uppercase">
                        {task.clientName}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge.bg}`}>
                        {priorityBadge.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-neutral-900 group-hover:text-neutral-600 transition-colors">
                      {task.title}
                    </h4>

                    <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                      {task.description}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-[11px] text-neutral-400">
                      <span className={isOverdue ? 'text-black font-bold underline' : 'text-neutral-600'}>
                        Due: {task.deadline} {isOverdue && '(OVERDUE)'}
                      </span>
                      {task.referenceFiles.length > 0 && (
                        <span className="flex items-center gap-1 text-neutral-500">
                          <Paperclip className="w-3 h-3" /> {task.referenceFiles.length} briefs
                        </span>
                      )}
                      {task.comments.length > 0 && (
                        <span className="flex items-center gap-1 text-neutral-500">
                          <MessageSquare className="w-3 h-3" /> {task.comments.length} comments
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSubmitWork(task);
                      }}
                      className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Submit Work</span>
                    </button>
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
