import React, { useState, useEffect } from 'react';
import {
  Client,
  Deliverable,
  User,
  WORKFLOW_STAGE_METADATA,
} from '@/lib/types';
import { calculateClientDeliverableStats, formatDateTime, TODAY_STRING } from '@/lib/utils';
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
  Plus,
  AlertCircle,
  Filter,
} from 'lucide-react';

interface DeliverableTrackerProps {
  clients: Client[];
  deliverables: Deliverable[];
  currentUser: User;
  onSelectDeliverable: (deliverable: Deliverable) => void;
  onNewDeliverable?: () => void;
  selectedClientId?: string;
  onClientFilterChange?: (clientId: string) => void;
}

export function DeliverableTracker({
  clients,
  deliverables,
  currentUser,
  onSelectDeliverable,
  onNewDeliverable,
  selectedClientId: propSelectedClientId,
  onClientFilterChange,
}: DeliverableTrackerProps) {
  const isClientRole = currentUser.role === 'client';
  const canAdmin = hasFullAdminAccess(currentUser);

  const [selectedClientId, setSelectedClientId] = useState<string>(
    isClientRole && currentUser.clientId
      ? currentUser.clientId
      : propSelectedClientId || 'all'
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sync prop changes
  useEffect(() => {
    if (propSelectedClientId && !isClientRole) {
      setSelectedClientId(propSelectedClientId);
    }
  }, [propSelectedClientId, isClientRole]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    if (onClientFilterChange) {
      onClientFilterChange(clientId);
    }
  };

  // Filter clients based on role and selection
  const visibleClients = isClientRole && currentUser.clientId
    ? clients.filter((c) => c.id === currentUser.clientId)
    : clients;

  const activeFilteredClients = visibleClients.filter(
    (c) => selectedClientId === 'all' || c.id === selectedClientId
  );

  // Agency Pacing Aggregation
  let totalAgencyTarget = 0;
  let totalAgencyCompleted = 0;
  let totalAgencyInProgress = 0;
  const laggingClients: { name: string; delta: number; target: number; completed: number }[] = [];

  visibleClients.forEach((client) => {
    const stats = calculateClientDeliverableStats(client, deliverables, selectedMonth);
    totalAgencyTarget += stats.totalCommitment;
    totalAgencyCompleted += stats.completed;
    totalAgencyInProgress += stats.inProgress;

    if (stats.pacing.pacingStatus === 'behind' || stats.pacing.pacingStatus === 'critical') {
      laggingClients.push({
        name: client.name,
        delta: stats.pacing.pacingDelta,
        target: stats.totalCommitment,
        completed: stats.completed,
      });
    }
  });

  const agencyCompletionPercentage =
    totalAgencyTarget > 0 ? Math.round((totalAgencyCompleted / totalAgencyTarget) * 100) : 0;

  // Month metadata
  const currentMonthStr = TODAY_STRING.substring(0, 7);
  const isCurrentActiveMonth = selectedMonth === currentMonthStr;
  const currentDayNum = parseInt(TODAY_STRING.substring(8, 10), 10);
  const daysInMonth = 30; // November
  const monthProgressionPct = isCurrentActiveMonth ? Math.round((currentDayNum / daysInMonth) * 100) : (selectedMonth < currentMonthStr ? 100 : 0);

  // Filter deliverable records
  const filteredDeliverables = deliverables.filter((d) => {
    if (isClientRole && currentUser.clientId && d.clientId !== currentUser.clientId) return false;
    if (selectedClientId !== 'all' && d.clientId !== selectedClientId) return false;
    if (d.targetMonth !== selectedMonth) return false;
    if (statusFilter === 'completed' && !d.isCountedTowardsCommitment) return false;
    if (statusFilter === 'in_progress' && (d.isCountedTowardsCommitment || d.status === 'cancelled')) return false;
    if (statusFilter === 'cancelled' && d.status !== 'cancelled') return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Monthly Deliverable Tracker
            </h2>
            <span className="text-[11px] font-semibold bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded border border-neutral-300">
              Contract Targets vs Actuals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking individual deliverable production stages against agreed client monthly commitments.
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {!isClientRole && (
            <select
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-black/10 focus:border-black"
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
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-black/10 focus:border-black"
          >
            <option value="2026-11">November 2026 (Active)</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-12">December 2026</option>
            <option value="2027-01">January 2027</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
          >
            <option value="all">All Records</option>
            <option value="completed">Only Completed / Delivered</option>
            <option value="in_progress">Only In Progress</option>
            <option value="cancelled">Only Cancelled (Preserved)</option>
          </select>

          {canAdmin && onNewDeliverable && (
            <button
              onClick={onNewDeliverable}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Deliverable</span>
            </button>
          )}
        </div>
      </div>

      {/* Agency-Wide Pacing Alert Banner (if lagging clients exist) */}
      {!isClientRole && isCurrentActiveMonth && laggingClients.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs shadow-xs">
          <AlertTriangle className="w-5 h-5 text-black shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-black flex items-center gap-2">
              <span>Production Pacing Warning</span>
              <span className="text-[10px] px-2 py-0.5 bg-neutral-200 rounded-full font-semibold">
                Day {currentDayNum} of {daysInMonth} ({monthProgressionPct}% Month Progression)
              </span>
            </div>
            <p className="text-neutral-700 leading-relaxed">
              <strong>{laggingClients.length} client(s)</strong> are trailing agreed deliverable pacing ({laggingClients.map(c => `${c.name}: ${c.completed}/${c.target} delivered (${c.delta})`).join(', ')}). Agency Admins & Managers are advised to expedite pending video reviews and reassign editorial tasks to prevent end-of-month delivery bottleneck.
            </p>
          </div>
        </div>
      )}

      {/* Strict Milestone Verification Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-black shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-black">Strict Milestone Counting Rule:</strong> A deliverable counts toward the client’s agreed monthly commitment <em>only</em> when it reaches <strong>Stage 10 (Publishing / Final Delivery)</strong> and is marked as <strong>published</strong> or <strong>delivered</strong>. Script approval, video editing, and internal reviews are strictly in-progress workflows and do not increment deliverable counts. Cancelled deliverables remain permanently preserved in the audit history and do not count towards quota.
        </div>
      </div>

      {/* Client Commitment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeFilteredClients.map((client) => {
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

                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-600">
                    <span>• Reels: <strong>{client.monthlyCommitment?.reels ?? 0}</strong></span>
                    <span>• Long Videos: <strong>{client.monthlyCommitment?.longVideos ?? 0}</strong></span>
                    <span>• Graphics: <strong>{client.monthlyCommitment?.graphics ?? 0}</strong></span>
                    <span>• Carousels: <strong>{client.monthlyCommitment?.carousels ?? 0}</strong></span>
                  </div>

                  {client.monthlyCommitment?.customTargetNote && (
                    <p className="text-[10px] text-slate-500 italic mt-1 border-t border-slate-200/50 pt-1">
                      Note: {client.monthlyCommitment.customTargetNote}
                    </p>
                  )}
                </div>

                {/* 4 Metric Counters: Completed, In Progress, Remaining, Cancelled */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="text-[11px] text-neutral-600 font-semibold">Completed</div>
                    <div className="text-xl font-black text-black mt-0.5">
                      {stats.completed}
                    </div>
                  </div>
                  <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="text-[11px] text-neutral-600 font-semibold">In Progress</div>
                    <div className="text-xl font-black text-black mt-0.5">
                      {stats.inProgress}
                    </div>
                  </div>
                  <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="text-[11px] text-neutral-600 font-semibold">Remaining</div>
                    <div className="text-xl font-black text-black mt-0.5">
                      {stats.remaining}
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Pacing Status */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Monthly Progress</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${stats.pacing.pacingBadgeClass}`}>
                        {stats.pacing.pacingLabel}
                      </span>
                      <span>{stats.completionPercentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-black h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {stats.cancelled > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{stats.cancelled} cancelled deliverable(s) preserved in audit history</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Individual Deliverables Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Individual Deliverable Records ({selectedMonth})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditable individual records tracking creative workflow stages, version histories, and client deliveries.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
            {filteredDeliverables.length} Deliverables
          </span>
        </div>

        {filteredDeliverables.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-900">No deliverable records found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No deliverables match your selected client, month, or status filters.
            </p>
            {canAdmin && onNewDeliverable && (
              <button
                onClick={onNewDeliverable}
                className="mt-4 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Deliverable</span>
              </button>
            )}
          </div>
        ) : (
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
                {filteredDeliverables.map((d) => {
                  const stageMeta = WORKFLOW_STAGE_METADATA[d.stage];
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => onSelectDeliverable(d)}
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[220px] group-hover:text-black group-hover:underline transition-colors">
                            {d.title}
                          </span>
                          <span className="text-[10px] font-normal text-slate-400">
                            v{d.currentVersion}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{d.clientName}</td>
                      <td className="py-3.5 px-4 capitalize">{d.type.replace('_', ' ')}</td>
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
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <Ban className="w-3 h-3 text-slate-500" /> Cancelled (Preserved)
                          </span>
                        ) : d.isCountedTowardsCommitment ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-900 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-black" /> Counted: Delivered (Quota +1)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 text-neutral-500" /> In Progress (Step {stageMeta?.step || 1}/10 - Not Counted)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDeliverable(d);
                          }}
                          className="text-xs text-neutral-900 hover:text-black underline font-semibold"
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
        )}
      </div>
    </div>
  );
}
