import React, { useState } from 'react';
import {
  Client,
  Deliverable,
  User,
  WORKFLOW_STAGE_METADATA,
} from '@/lib/types';
import { calculateClientDeliverableStats, formatDateTime } from '@/lib/utils';
import { hasFullAdminAccess } from '@/lib/permissions';
import { Badge } from '../common/Badge';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Ban,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Info,
} from 'lucide-react';

interface DeliverableTrackerProps {
  clients: Client[];
  deliverables: Deliverable[];
  currentUser: User;
  onSelectDeliverable: (deliverable: Deliverable) => void;
  onNewDeliverable?: () => void;
}

export function DeliverableTracker({
  clients,
  deliverables,
  currentUser,
  onSelectDeliverable,
  onNewDeliverable,
}: DeliverableTrackerProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    currentUser.role === 'client' && currentUser.clientId
      ? currentUser.clientId
      : 'all'
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter clients available based on user permissions
  const visibleClients =
    currentUser.role === 'client' && currentUser.clientId
      ? clients.filter((c) => c.id === currentUser.clientId)
      : clients;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Monthly Deliverable Tracker
            </h2>
            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              Contract Targets vs Actuals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking individual deliverable records against agreed client commitments.
          </p>
        </div>

        {/* Filter selectors */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {currentUser.role !== 'client' && (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Clients ({clients.length})</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="2026-11">November 2026 (Current)</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-12">December 2026</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Only Completed / Delivered</option>
            <option value="in_progress">Only In Progress</option>
            <option value="cancelled">Only Cancelled (Preserved)</option>
          </select>
        </div>
      </div>

      {/* Critical Verification Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Milestone Counting Rule:</strong> A deliverable counts toward the client’s monthly commitment <em>only</em> when it reaches Stage 10 (Publishing / Final Delivery) and is marked as published or delivered. Script approval is tracked separately and does not count as completed video delivery. Cancelled deliverables remain preserved in the audit history.
        </div>
      </div>

      {/* Client Commitment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleClients
          .filter((c) => selectedClientId === 'all' || c.id === selectedClientId)
          .map((client) => {
            const stats = calculateClientDeliverableStats(client, deliverables, selectedMonth);

            return (
              <div
                key={client.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Client Commitment
                    </span>
                    <Badge variant={client.status === 'active' ? 'emerald' : 'slate'}>
                      {client.servicePackage}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{client.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{client.company}</p>

                  {/* Monthly Commitment Metrics Breakdown */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">Monthly Commitment:</span>
                      <strong className="font-bold text-slate-900">
                        {stats.totalCommitment} deliverables
                      </strong>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>• Target Reels: {client.monthlyCommitment.reels}</span>
                      <span>• Long Videos: {client.monthlyCommitment.longVideos}</span>
                      <span>• Graphics: {client.monthlyCommitment.graphics}</span>
                    </div>

                    {client.monthlyCommitment.customTargetNote && (
                      <p className="text-[10px] text-slate-500 italic mt-1 border-t border-slate-200/50 pt-1">
                        Note: {client.monthlyCommitment.customTargetNote}
                      </p>
                    )}
                  </div>

                  {/* 3 Metric Counters: Completed, In Progress, Remaining */}
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="text-xs text-emerald-700 font-medium">Completed</div>
                      <div className="text-xl font-black text-emerald-900 mt-0.5">
                        {stats.completed}
                      </div>
                    </div>
                    <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-700 font-medium">In Progress</div>
                      <div className="text-xl font-black text-blue-900 mt-0.5">
                        {stats.inProgress}
                      </div>
                    </div>
                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="text-xs text-amber-700 font-medium">Remaining</div>
                      <div className="text-xl font-black text-amber-900 mt-0.5">
                        {stats.remaining}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                      <span>Monthly Delivery Progress</span>
                      <span>{stats.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${stats.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {stats.cancelled > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-slate-400" />
                    <span>{stats.cancelled} cancelled deliverable(s) preserved in history</span>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Individual Deliverables Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Individual Deliverable Records ({selectedMonth})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every deliverable is an individual auditable record tracking production stage, versioning, and client delivery.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
            {
              deliverables.filter((d) => {
                if (selectedClientId !== 'all' && d.clientId !== selectedClientId) return false;
                if (d.targetMonth !== selectedMonth) return false;
                if (statusFilter === 'completed' && !d.isCountedTowardsCommitment) return false;
                if (statusFilter === 'in_progress' && (d.isCountedTowardsCommitment || d.status === 'cancelled')) return false;
                if (statusFilter === 'cancelled' && d.status !== 'cancelled') return false;
                return true;
              }).length
            }{' '}
            Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Deliverable Title</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Current Stage (1-10)</th>
                <th className="py-3 px-4">Assigned Creative</th>
                <th className="py-3 px-4">Status & Commitment Count</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {deliverables
                .filter((d) => {
                  if (selectedClientId !== 'all' && d.clientId !== selectedClientId) return false;
                  if (d.targetMonth !== selectedMonth) return false;
                  if (statusFilter === 'completed' && !d.isCountedTowardsCommitment) return false;
                  if (statusFilter === 'in_progress' && (d.isCountedTowardsCommitment || d.status === 'cancelled')) return false;
                  if (statusFilter === 'cancelled' && d.status !== 'cancelled') return false;
                  return true;
                })
                .map((d) => {
                  const stageMeta = WORKFLOW_STAGE_METADATA[d.stage];
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => onSelectDeliverable(d)}
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[220px] group-hover:text-blue-600">
                            {d.title}
                          </span>
                          <span className="text-[10px] font-normal text-slate-400">
                            v{d.currentVersion}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{d.clientName}</td>
                      <td className="py-3.5 px-4 capitalize">{d.type}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                          <span className="w-4 h-4 rounded-full bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center">
                            {stageMeta?.step || 1}
                          </span>
                          <span className="truncate max-w-[130px]">{stageMeta?.label || d.stage}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{d.assignedEmployeeName}</td>
                      <td className="py-3.5 px-4">
                        {d.status === 'cancelled' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            <Ban className="w-3 h-3" /> Cancelled (Preserved)
                          </span>
                        ) : d.isCountedTowardsCommitment ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" /> Counted: Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3" /> In Progress (Not Counted Yet)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDeliverable(d);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
