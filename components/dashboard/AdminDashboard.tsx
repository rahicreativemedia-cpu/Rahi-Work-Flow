import React from 'react';
import { Client, Employee, Deliverable, Task, User } from '@/lib/types';
import { formatCurrency, calculateClientDeliverableStats, TODAY_STRING } from '@/lib/utils';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  Kanban,
} from 'lucide-react';

interface AdminDashboardProps {
  clients: Client[];
  employees: Employee[];
  deliverables: Deliverable[];
  tasks: Task[];
  currentUser: User;
  onNavigateTab: (tab: string) => void;
  onSelectDeliverable: (deliverable: Deliverable) => void;
  onSelectTask: (task: Task) => void;
  onCreateClient: () => void;
  onCreateTask: () => void;
}

export function AdminDashboard({
  clients,
  employees,
  deliverables,
  tasks,
  currentUser,
  onNavigateTab,
  onSelectDeliverable,
  onSelectTask,
  onCreateClient,
  onCreateTask,
}: AdminDashboardProps) {
  const today = TODAY_STRING;

  const activeClients = clients.filter((c) => c.status === 'active');
  const activeDeliverables = deliverables.filter((d) => d.status !== 'cancelled');
  const completedDeliverables = activeDeliverables.filter(
    (d) =>
      d.stage === 'publishing_or_delivery' &&
      (d.status === 'published' || d.status === 'delivered')
  );
  const pendingDeliverables = activeDeliverables.filter(
    (d) =>
      !(
        d.stage === 'publishing_or_delivery' &&
        (d.status === 'published' || d.status === 'delivered')
      )
  );

  const pendingApprovals = deliverables.filter(
    (d) => d.status === 'client_review' || d.stage === 'client_video_approval' || d.stage === 'client_script_approval'
  );

  const overdueTasks = tasks.filter((t) => t.deadline < today && t.status !== 'completed');

  const totalMRR = activeClients.reduce((acc, c) => acc + c.monthlyRetainer, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-600 text-white">
              ADMIN EXECUTIVE PORTAL
            </span>
            <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Shared Full Admin Rights with Manager
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
            Welcome back, {currentUser.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Company-wide creative agency command center. Monitor clients, team productivity, creative pipeline stages, and monthly deliverable milestones.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={onCreateClient}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>
          <button
            onClick={onCreateTask}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Task</span>
          </button>
          <button
            onClick={() => onNavigateTab('pipeline')}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>View 10-Stage Pipeline</span>
          </button>
        </div>
      </div>

      {/* Dashboard Metrics (Prompt Section 4 Requirement) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          label="Active Clients"
          value={activeClients.length}
          subtext={`${clients.length} total registered`}
          icon={Briefcase}
          color="blue"
          onClick={() => onNavigateTab('clients')}
        />
        <StatCard
          label="Creative Team"
          value={employees.length}
          subtext="Active members"
          icon={Users}
          color="indigo"
          onClick={() => onNavigateTab('employees')}
        />
        <StatCard
          label="Deliverables Done"
          value={completedDeliverables.length}
          subtext={`${pendingDeliverables.length} in production`}
          icon={CheckCircle2}
          color="emerald"
          onClick={() => onNavigateTab('deliverable_tracker')}
        />
        <StatCard
          label="Pending Approvals"
          value={pendingApprovals.length}
          subtext="Awaiting client"
          icon={FileCheck2}
          color="purple"
          highlight={pendingApprovals.length > 0}
          onClick={() => onNavigateTab('approvals')}
        />
        <StatCard
          label="Overdue Tasks"
          value={overdueTasks.length}
          subtext="Needs attention"
          icon={AlertTriangle}
          color="rose"
          highlight={overdueTasks.length > 0}
          onClick={() => onNavigateTab('projects_tasks')}
        />
        <StatCard
          label="Agency Retainers"
          value={formatCurrency(totalMRR)}
          subtext="Monthly contracted"
          icon={DollarSign}
          color="emerald"
          onClick={() => onNavigateTab('reports')}
        />
      </div>

      {/* Middle Grid: Client Commitments & Pending Approvals Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Commitments Overview (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Monthly Deliverable Commitments (November 2026)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target commitments vs verified published deliveries per client.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('deliverable_tracker')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Full Tracker</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-4">
            {clients.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl space-y-2">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="font-semibold text-slate-600">No Clients Added Yet</div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Your agency workspace is clean and ready. Click &quot;Add Client&quot; above to create your first client contract.
                </p>
                <button
                  onClick={onCreateClient}
                  className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Client</span>
                </button>
              </div>
            ) : (
              clients.map((client) => {
                const stats = calculateClientDeliverableStats(client, deliverables, '2026-11');
                return (
                  <div key={client.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{client.name}</span>
                        <span className="text-[11px] text-slate-500 ml-2">
                          Target: {stats.totalCommitment} assets ({client.monthlyCommitment.reels} Reels)
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {stats.completed} Completed • {stats.inProgress} In Progress • {stats.remaining} Remaining
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${stats.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pending Client Approvals Queue (1 Col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Pending Client Approvals
              </h3>
              <Badge variant="purple">{pendingApprovals.length}</Badge>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Items currently waiting for client script sign-off or video review.
            </p>

            <div className="space-y-2.5">
              {pendingApprovals.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                  No items pending client sign-off
                </div>
              ) : (
                pendingApprovals.map((del) => (
                  <div
                    key={del.id}
                    onClick={() => onSelectDeliverable(del)}
                    className="p-3 bg-purple-50/50 hover:bg-purple-50 border border-purple-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-700 uppercase">
                        {del.clientName}
                      </span>
                      <span className="text-[10px] text-slate-400">v{del.currentVersion}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900 mt-1 line-clamp-1">
                      {del.title}
                    </div>
                    <div className="mt-1 text-[11px] text-purple-800 font-medium capitalize">
                      {del.stage === 'client_script_approval' ? 'Script Approval' : 'Video Approval'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('approvals')}
            className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            Manage All Approvals
          </button>
        </div>
      </div>

      {/* Overdue Tasks Alert Row */}
      {overdueTasks.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                Attention: {overdueTasks.length} Overdue Tasks Detected
              </h4>
            </div>
            <button
              onClick={() => onNavigateTab('projects_tasks')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900"
            >
              Reassign Tasks →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
            {overdueTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="p-2.5 bg-white rounded-lg border border-rose-200 cursor-pointer hover:border-rose-300 text-xs"
              >
                <div className="font-bold text-slate-900 truncate">{task.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Assigned to <strong className="text-slate-700">{task.assignedEmployeeName}</strong> • Due {task.deadline}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
