import React, { useState } from 'react';
import { Client, Employee, Deliverable, Task } from '@/lib/types';
import { formatCurrency, calculateClientDeliverableStats, TODAY_STRING } from '@/lib/utils';
import { StatCard } from '../common/StatCard';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Briefcase,
} from 'lucide-react';

interface ReportsViewProps {
  clients: Client[];
  employees: Employee[];
  deliverables: Deliverable[];
  tasks: Task[];
}

export function ReportsView({ clients, employees, deliverables, tasks }: ReportsViewProps) {
  const [selectedTab, setSelectedTab] = useState<'clients' | 'employees' | 'financials' | 'workflow'>('clients');

  const today = TODAY_STRING;

  // Overall Financials
  const totalMRR = clients.reduce(
    (acc, c) => (c.status === 'active' ? acc + c.monthlyRetainer : acc),
    0
  );
  const annualRunRate = totalMRR * 12;

  // Deliverables stats
  const activeDeliverables = deliverables.filter((d) => d.status !== 'cancelled');
  const completedDeliverables = activeDeliverables.filter(
    (d) =>
      d.stage === 'publishing_or_delivery' &&
      (d.status === 'published' || d.status === 'delivered')
  );

  const overdueTasks = tasks.filter((t) => t.deadline < today && t.status !== 'completed');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Agency Analytics & Production Reports
          </h2>
          <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
            Shared Admin & Manager Access
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Comprehensive agency operational metrics, contract retainers, team productivity, and deliverable completion targets.
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Monthly Retainer"
          value={formatCurrency(totalMRR)}
          subtext={`Annualized ARR: ${formatCurrency(annualRunRate)}`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          label="Published Deliverables"
          value={completedDeliverables.length}
          subtext={`${activeDeliverables.length} total active in pipeline`}
          icon={CheckCircle2}
          color="blue"
        />
        <StatCard
          label="Active Retainer Clients"
          value={clients.filter((c) => c.status === 'active').length}
          subtext={`${clients.length} total registered brands`}
          icon={Briefcase}
          color="indigo"
        />
        <StatCard
          label="Overdue Tasks"
          value={overdueTasks.length}
          subtext="Action required by creative leads"
          icon={AlertTriangle}
          color="rose"
          highlight={overdueTasks.length > 0}
        />
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold text-slate-500">
        <button
          onClick={() => setSelectedTab('clients')}
          className={`pb-2.5 transition-colors border-b-2 ${
            selectedTab === 'clients'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Client Delivery & Commitments
        </button>
        <button
          onClick={() => setSelectedTab('employees')}
          className={`pb-2.5 transition-colors border-b-2 ${
            selectedTab === 'employees'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Employee Productivity & Workload
        </button>
        <button
          onClick={() => setSelectedTab('financials')}
          className={`pb-2.5 transition-colors border-b-2 ${
            selectedTab === 'financials'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Contract Retainers & Revenue
        </button>
      </div>

      {/* TAB 1: CLIENT DELIVERY REPORTS */}
      {selectedTab === 'clients' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Client-Wise Deliverable Completion Analysis
            </h3>
            <span className="text-xs text-slate-500 font-medium">November 2026 Target vs Actuals</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Client Brand</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Monthly Commitment</th>
                  <th className="py-3 px-4">Completed (Delivered)</th>
                  <th className="py-3 px-4">In Pipeline</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Completion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {clients.map((client) => {
                  const stats = calculateClientDeliverableStats(client, deliverables, '2026-11');
                  return (
                    <tr key={client.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{client.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{client.servicePackage}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {stats.totalCommitment} assets
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {stats.completed}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-700">
                        {stats.inProgress}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-700">
                        {stats.remaining}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full"
                              style={{ width: `${stats.completionPercentage}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-900">
                            {stats.completionPercentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EMPLOYEE PRODUCTIVITY */}
      {selectedTab === 'employees' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Creative Team Performance & Workload Utilization
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Team Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Active Tasks</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Utilization</th>
                  <th className="py-3 px-4">Completed Tasks</th>
                  <th className="py-3 px-4">Quality Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employees.map((emp) => {
                  const empTasks = tasks.filter((t) => t.assignedEmployeeId === emp.id);
                  const completed = empTasks.filter((t) => t.status === 'completed').length;
                  const active = empTasks.filter(
                    (t) => t.status !== 'completed' && t.status !== 'backlog'
                  ).length;
                  const util = Math.min(100, Math.round((active / emp.maxConcurrentTasks) * 100));

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{emp.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{emp.department}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{active}</td>
                      <td className="py-3.5 px-4 text-slate-500">{emp.maxConcurrentTasks} max</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold ${
                            util >= 80 ? 'text-rose-600' : 'text-blue-600'
                          }`}
                        >
                          {util}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{completed}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {emp.performanceScore}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIAL & CONTRACTS */}
      {selectedTab === 'financials' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Agency Client Contracts & Revenue Retainers
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Monthly Retainer</th>
                  <th className="py-3 px-4">Annualized Value</th>
                  <th className="py-3 px-4">Contract Start</th>
                  <th className="py-3 px-4">Contract End</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{client.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{client.servicePackage}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(client.monthlyRetainer, client.currency)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-emerald-700">
                      {formatCurrency(client.monthlyRetainer * 12, client.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{client.contractStartDate}</td>
                    <td className="py-3.5 px-4 text-slate-500">{client.contractEndDate}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                        {client.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
