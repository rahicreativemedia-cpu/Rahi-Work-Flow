import React from 'react';
import { Client, Employee, Deliverable, Task, User } from '@/lib/types';
import { formatCurrency, calculateClientDeliverableStats, TODAY_STRING } from '@/lib/utils';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import {
  Kanban,
  CheckSquare,
  Users,
  Briefcase,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  Plus,
  ShieldCheck,
  Clock,
  Layers,
  Send,
  UploadCloud,
} from 'lucide-react';

interface ManagerDashboardProps {
  clients: Client[];
  employees: Employee[];
  deliverables: Deliverable[];
  tasks: Task[];
  currentUser: User;
  onNavigateTab: (tab: string) => void;
  onSelectDeliverable: (deliverable: Deliverable) => void;
  onSelectTask: (task: Task) => void;
  onCreateTask: () => void;
  onCreateClient: () => void;
  onCreateDeliverable: () => void;
}

export function ManagerDashboard({
  clients,
  employees,
  deliverables,
  tasks,
  currentUser,
  onNavigateTab,
  onSelectDeliverable,
  onSelectTask,
  onCreateTask,
  onCreateClient,
  onCreateDeliverable,
}: ManagerDashboardProps) {
  const today = TODAY_STRING;

  const activeDeliverables = deliverables.filter((d) => d.status !== 'cancelled');
  const completedDeliverables = activeDeliverables.filter(
    (d) =>
      d.stage === 'publishing_or_delivery' &&
      (d.status === 'published' || d.status === 'delivered')
  );

  const pendingInternalReview = tasks.filter((t) => t.status === 'in_review');
  const pendingClientApproval = deliverables.filter(
    (d) => d.status === 'client_review'
  );
  const revisionRequested = deliverables.filter(
    (d) => d.status === 'revision_requested'
  );
  const overdueTasks = tasks.filter((t) => t.deadline < today && t.status !== 'completed');

  return (
    <div className="space-y-6">
      {/* Manager Operations Welcome Banner */}
      <div className="bg-black text-white p-6 rounded-2xl shadow-sm border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white text-black font-black">
              MANAGER OPERATIONS PORTAL
            </span>
            <span className="text-xs text-neutral-300 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              100% Equal Operational Permissions to Admin
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
            Creative Operations Command • {currentUser.name}
          </h2>
          <p className="text-xs text-neutral-300 mt-1 max-w-xl leading-relaxed">
            Manage the 10-stage creative pipeline, assign tasks to any employee, approve internal submissions, dispatch client approval requests, and monitor monthly commitments.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={onCreateTask}
            className="px-3.5 py-2 bg-white text-black hover:bg-neutral-100 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Task</span>
          </button>
          <button
            onClick={onCreateDeliverable}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Deliverable</span>
          </button>
          <button
            onClick={() => onNavigateTab('pipeline')}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Production Pipeline</span>
          </button>
        </div>
      </div>

      {/* Operations Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          label="Internal Reviews"
          value={pendingInternalReview.length}
          subtext="Submissions waiting"
          icon={UploadCloud}
          color="amber"
          highlight={pendingInternalReview.length > 0}
          onClick={() => onNavigateTab('projects_tasks')}
        />
        <StatCard
          label="Client Approvals"
          value={pendingClientApproval.length}
          subtext="Awaiting response"
          icon={FileCheck2}
          color="purple"
          onClick={() => onNavigateTab('approvals')}
        />
        <StatCard
          label="Revisions Active"
          value={revisionRequested.length}
          subtext="Client requested changes"
          icon={AlertTriangle}
          color="rose"
          highlight={revisionRequested.length > 0}
          onClick={() => onNavigateTab('approvals')}
        />
        <StatCard
          label="Completed Output"
          value={completedDeliverables.length}
          subtext="Verified published"
          icon={CheckSquare}
          color="emerald"
          onClick={() => onNavigateTab('deliverable_tracker')}
        />
        <StatCard
          label="Team Utilization"
          value={`${employees.length} Creatives`}
          subtext="Active workloads"
          icon={Users}
          color="indigo"
          onClick={() => onNavigateTab('employees')}
        />
        <StatCard
          label="Overdue Tasks"
          value={overdueTasks.length}
          subtext="Requires reassignment"
          icon={Clock}
          color="rose"
          highlight={overdueTasks.length > 0}
          onClick={() => onNavigateTab('projects_tasks')}
        />
      </div>

      {/* Middle Operations Layout: Internal Review Desk & Creative Workload Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Internal Submissions Waiting for Manager/Admin Sign-off (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Internal Review Queue (Quality Benchmark)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review cuts submitted by editors/writers before dispatching to clients for approval.
              </p>
            </div>
            <Badge variant="slate">{pendingInternalReview.length} in queue</Badge>
          </div>

          <div className="space-y-3">
            {pendingInternalReview.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-300 rounded-lg">
                No creative work currently waiting for internal manager review.
              </div>
            ) : (
              pendingInternalReview.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="p-4 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 cursor-pointer transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded border border-neutral-300">
                        {task.clientName}
                      </span>
                      <span className="text-xs font-bold text-neutral-900">{task.title}</span>
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      Submitted by <strong className="text-neutral-700">{task.assignedEmployeeName}</strong> •{' '}
                      {task.submissions.length} submission(s)
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTask(task);
                    }}
                    className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs shrink-0"
                  >
                    Inspect & Review
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Workload Balance (1 Col) */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                Creative Workloads
              </h3>
              <button
                onClick={() => onNavigateTab('employees')}
                className="text-xs font-semibold text-neutral-900 hover:underline"
              >
                All Team →
              </button>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              Real-time task distribution to prevent creative bottlenecks.
            </p>

            <div className="space-y-3.5">
              {employees.slice(0, 4).map((emp) => {
                const util = Math.min(
                  100,
                  Math.round((emp.currentActiveTasks / emp.maxConcurrentTasks) * 100)
                );
                return (
                  <div key={emp.id} className="text-xs">
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span className="text-neutral-800 truncate">{emp.name}</span>
                      <span className="text-neutral-500 text-[11px]">
                        {emp.currentActiveTasks}/{emp.maxConcurrentTasks} tasks
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-black"
                        style={{ width: `${util}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={onCreateTask}
            className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            Assign Work to Team
          </button>
        </div>
      </div>
    </div>
  );
}
