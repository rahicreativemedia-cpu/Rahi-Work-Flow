import React from 'react';
import { Client, Deliverable, Project, User } from '@/lib/types';
import { calculateClientDeliverableStats, formatDate } from '@/lib/utils';
import {
  Award,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
  ChevronRight,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { PlanexGreetingBar } from './PlanexGreetingBar';
import { PlanexKpiRow, KpiItem } from './PlanexKpiRow';
import { PlanexCalendar, CalendarEventItem } from './PlanexCalendar';
import { cn } from '@/lib/utils';

interface ClientDashboardProps {
  client: Client;
  projects: Project[];
  deliverables: Deliverable[];
  currentUser: User;
  onNavigateTab: (tab: string) => void;
  onSelectDeliverable: (deliverable: Deliverable) => void;
}

export function ClientDashboard({
  client,
  projects,
  deliverables,
  currentUser,
  onNavigateTab,
  onSelectDeliverable,
}: ClientDashboardProps) {
  // Calculate delivery stats for this client
  const stats = calculateClientDeliverableStats(client, deliverables, '2026-11');

  // Deliverables pending client review
  const pendingApprovals = deliverables.filter(
    (d) =>
      d.clientId === client?.id &&
      (d.stage === 'client_script_approval' ||
        d.stage === 'client_video_approval' ||
        d.status === 'client_review')
  );

  // Active deliverables in production
  const inProduction = deliverables.filter(
    (d) =>
      d.clientId === client?.id &&
      d.status !== 'cancelled' &&
      d.status !== 'delivered' &&
      d.status !== 'published'
  );

  // 4 Client KPI Cards
  const kpiItems: KpiItem[] = [
    {
      id: 'monthly_target',
      label: 'Monthly Target',
      value: stats.totalCommitment,
      icon: Award,
      onClick: () => onNavigateTab('commitment_tracker'),
    },
    {
      id: 'published',
      label: 'Published / Delivered',
      value: stats.completed,
      icon: CheckCircle2,
      onClick: () => onNavigateTab('asset_library'),
    },
    {
      id: 'pending_approvals',
      label: 'Pending Approvals',
      value: pendingApprovals.length,
      icon: Clock,
      onClick: () => onNavigateTab('approvals'),
    },
    {
      id: 'in_production',
      label: 'In Production',
      value: inProduction.length,
      icon: Layers,
      onClick: () => onNavigateTab('commitment_tracker'),
    },
  ];

  // Calendar events
  const calendarEvents: CalendarEventItem[] = deliverables
    .filter((d) => d.scheduledPublishDate || d.deadline)
    .map((d) => ({
      id: d.id,
      title: d.title,
      date: (d.scheduledPublishDate || d.deadline).split('T')[0],
      type: 'deliverable' as const,
      priority: 'medium',
    }));

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'publishing_or_delivery':
      case 'scheduling':
        return { label: 'Delivered', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' };
      case 'client_video_approval':
      case 'client_script_approval':
        return { label: 'Awaiting Your Sign-off', cls: 'bg-amber-50 text-amber-700 border-amber-200/60' };
      case 'revisions':
        return { label: 'In Revision', cls: 'bg-rose-50 text-rose-700 border-rose-200/60' };
      default:
        return { label: 'In Production', cls: 'bg-blue-50 text-blue-700 border-blue-200/60' };
    }
  };

  const progressPercent = stats.completionPercentage || 0;

  return (
    <div className="space-y-6">
      {/* 1. Top Greeting Bar */}
      <PlanexGreetingBar
        userName={client?.name || currentUser.name.split(' ')[0] || 'Client'}
        subtitle="Review ongoing production, monthly deliverable milestones, and pending approvals."
        primaryActionLabel={
          pendingApprovals.length > 0
            ? `Review Approvals (${pendingApprovals.length})`
            : 'View Calendar'
        }
        onPrimaryAction={() => {
          if (pendingApprovals.length > 0) {
            onNavigateTab('approvals');
          } else {
            onNavigateTab('calendar');
          }
        }}
      />

      {/* 2. KPI Cards Row */}
      <PlanexKpiRow items={kpiItems} />

      {/* 3. Main 2-Column Split matching Planex Reference */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column (~64% width on desktop) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Deliverables Overview Table */}
          <div className="liquid-glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-stone-900 tracking-tight">
                  Monthly Deliverables
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Content pipeline tracking for {client?.name || 'your brand'}
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('commitment_tracker')}
                className="px-4 py-2 liquid-glass-pill text-stone-800 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <span>Full Tracker</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/50 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Deliverable</th>
                    <th className="pb-3 px-4">Format</th>
                    <th className="pb-3 px-4">Stage</th>
                    <th className="pb-3 px-4">Target Date</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/40 text-xs">
                  {deliverables.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-stone-400">
                        <CheckCircle2 className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                        <p className="font-medium text-stone-600">No deliverables scheduled</p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Your creative team will add planned deliverables shortly.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    deliverables.map((deliv) => {
                      const stageInfo = getStageBadge(deliv.stage);
                      const displayDate = deliv.scheduledPublishDate || deliv.deadline;

                      return (
                        <tr
                          key={deliv.id}
                          className="group hover:bg-stone-50/60 transition-colors cursor-pointer"
                          onClick={() => onSelectDeliverable(deliv)}
                        >
                          <td className="py-4 pr-4">
                            <div>
                              <span className="font-bold text-stone-900 group-hover:text-black transition-colors block">
                                {deliv.title}
                              </span>
                              <span className="text-[11px] text-stone-400 block mt-0.5">
                                #{deliv.id.slice(-6)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="text-[11px] font-medium text-stone-600 capitalize">
                              {deliv.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={cn(
                                'px-2.5 py-0.5 rounded-full text-[11px] font-semibold border inline-block',
                                stageInfo.cls
                              )}
                            >
                              {stageInfo.label}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap text-stone-600 font-medium">
                            <span className="inline-flex items-center gap-1.5 text-[11px]">
                              <Calendar className="w-3.5 h-3.5 text-stone-400" />
                              {displayDate ? formatDate(displayDate) : 'TBD'}
                            </span>
                          </td>
                          <td className="py-4 pl-4 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectDeliverable(deliv);
                              }}
                              className="text-[11px] font-bold text-stone-600 hover:text-stone-900 inline-flex items-center gap-0.5 group-hover:underline"
                            >
                              <span>Review</span>
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

          {/* Pending Approvals Card */}
          {pendingApprovals.length > 0 && (
            <div className="bg-amber-50/60 rounded-3xl border border-amber-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Sign-Off Requested ({pendingApprovals.length})
                  </h4>
                </div>
                <button
                  onClick={() => onNavigateTab('approvals')}
                  className="text-xs font-semibold text-amber-800 underline"
                >
                  Manage All Approvals
                </button>
              </div>
              <div className="space-y-2">
                {pendingApprovals.map((pa) => (
                  <div
                    key={pa.id}
                    onClick={() => onSelectDeliverable(pa)}
                    className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between gap-3 cursor-pointer hover:shadow-xs transition-shadow"
                  >
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">{pa.title}</span>
                      <span className="text-[11px] text-amber-700 font-medium capitalize">
                        {pa.stage.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDeliverable(pa);
                      }}
                      className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-semibold shrink-0"
                    >
                      Sign Off / Revise
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (~36% width on desktop) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Content Calendar */}
          <PlanexCalendar
            events={calendarEvents}
            onSelectDate={(d) => {}}
          />

          {/* Monthly Commitment Progress Card */}
          <div className="liquid-glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-stone-900 tracking-tight">Deliverable Goal</h3>
                <p className="text-xs text-stone-400 mt-0.5">Monthly retainer commitments</p>
              </div>
              <div className="p-1.5 liquid-glass-subtle rounded-full text-stone-700">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>

            {/* Progress Card */}
            <div className="p-4 rounded-2xl liquid-glass-subtle mb-6">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-stone-500 font-medium">Monthly Goal Achieved</span>
                <span className="text-stone-900 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-stone-200/70 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-900 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-2">
                {stats.completed} of {stats.totalCommitment} deliverables published
              </p>
            </div>

            {/* Bottom 3 Summary Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200/50 text-center">
              <div>
                <span className="text-xl font-bold text-stone-900">
                  {String(stats.totalCommitment).padStart(2, '0')}
                </span>
                <p className="text-[11px] text-stone-400 font-medium mt-0.5">Target</p>
              </div>
              <div>
                <span className="text-xl font-bold text-stone-900">
                  {String(stats.completed).padStart(2, '0')}
                </span>
                <p className="text-[11px] text-stone-400 font-medium mt-0.5">Delivered</p>
              </div>
              <div>
                <span className="text-xl font-bold text-stone-900">
                  {String(pendingApprovals.length).padStart(2, '0')}
                </span>
                <p className="text-[11px] text-stone-400 font-medium mt-0.5">Approvals</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
