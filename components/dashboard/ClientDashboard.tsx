import React, { useState } from 'react';
import { Client, Deliverable, Project, User } from '@/lib/types';
import { calculateClientDeliverableStats, formatDate, TODAY_STRING } from '@/lib/utils';
import {
  Folder,
  Play,
  Clock,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Eye,
  ChevronDown,
  Layers,
  Sparkles,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';

interface ClientDashboardProps {
  client?: Client | null;
  projects?: Project[];
  deliverables?: Deliverable[];
  currentUser: User;
  onNavigateTab: (tab: string) => void;
  onSelectDeliverable: (deliverable: Deliverable) => void;
  isPreviewMode?: boolean;
  onExitPreview?: () => void;
}

export function ClientDashboard({
  client,
  projects = [],
  deliverables = [],
  currentUser,
  onNavigateTab,
  onSelectDeliverable,
  isPreviewMode = false,
  onExitPreview,
}: ClientDashboardProps) {
  // Dynamic Month Selection (defaults to current YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-neutral-500">Loading your workspace...</p>
      </div>
    );
  }

  // Dynamic Month Controls
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const formatMonthDisplay = (monthStr: string) => {
    const [y, m] = monthStr.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Stats calculation for the selected month using pure database records
  const stats = calculateClientDeliverableStats(client, deliverables, selectedMonth);

  // Client deliverables and projects strictly isolated by client.id
  const clientDeliverables = deliverables.filter((d) => d.clientId === client.id);
  const clientProjects = projects.filter((p) => p.clientId === client.id);

  // Month-specific deliverables
  const monthDeliverables = clientDeliverables.filter(
    (d) => !selectedMonth || d.targetMonth === selectedMonth
  );

  // Deliverables pending client review
  const pendingApprovals = clientDeliverables.filter(
    (d) =>
      d.stage === 'client_script_approval' ||
      d.stage === 'client_video_approval' ||
      d.status === 'client_review'
  );

  // Delivered items (Stage 10 and status published or delivered)
  const deliveredItems = monthDeliverables.filter(
    (d) =>
      d.stage === 'publishing_or_delivery' &&
      (d.status === 'published' || d.status === 'delivered')
  );

  // In production items
  const inProductionItems = monthDeliverables.filter(
    (d) =>
      d.status !== 'cancelled' &&
      !(
        d.stage === 'publishing_or_delivery' &&
        (d.status === 'published' || d.status === 'delivered')
      ) &&
      d.stage !== 'client_script_approval' &&
      d.stage !== 'client_video_approval' &&
      d.status !== 'client_review' &&
      d.stage !== 'revisions'
  );

  // Revisions items
  const revisionItems = monthDeliverables.filter(
    (d) => d.stage === 'revisions' || d.status === 'revision_requested'
  );

  // True Database Counts for KPI cards
  const totalProjectsCount = clientProjects.length;
  const totalDeliverablesCount = clientDeliverables.length;
  const pendingApprovalsCount = pendingApprovals.length;
  const deliveredCount = deliveredItems.length;

  // Overview progress bar calculations
  const totalTargetOrCount = Math.max(stats.totalCommitment, monthDeliverables.length);
  const remainingTarget = Math.max(0, stats.totalCommitment - deliveredCount);

  const deliveredPct = totalTargetOrCount > 0 ? (deliveredCount / totalTargetOrCount) * 100 : 0;
  const inProdPct =
    totalTargetOrCount > 0 ? (inProductionItems.length / totalTargetOrCount) * 100 : 0;
  const revisionPct =
    totalTargetOrCount > 0 ? (revisionItems.length / totalTargetOrCount) * 100 : 0;
  const remainingPct =
    totalTargetOrCount > 0 ? (remainingTarget / totalTargetOrCount) * 100 : 0;

  // Calendar days generation for selected month
  const [calYear, calMonth] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay(); // 0 for Sunday
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyLeadingDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  return (
    <div className="w-full max-w-full space-y-6">
      {/* 1. Welcome Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <span>Welcome, {client?.name || 'Client Workspace'}</span>
            <span>👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Your creative projects, deliverables and approvals in one place.
          </p>
        </div>

        {/* Month Selector Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-neutral-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-neutral-800 min-w-[110px] text-center select-none">
            {formatMonthDisplay(selectedMonth)}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 4 Primary KPI Cards (Responsive Grid across all viewports) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Total Projects */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs flex items-center gap-4 transition-all hover:shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#ED1C24] flex items-center justify-center shrink-0">
            <Folder className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-neutral-900 block leading-tight">
              {totalProjectsCount}
            </span>
            <span className="text-xs text-neutral-500 font-medium">Total Projects</span>
          </div>
        </div>

        {/* 2. Total Deliverables */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs flex items-center gap-4 transition-all hover:shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#ED1C24] flex items-center justify-center shrink-0">
            <Play className="w-5 h-5 fill-[#ED1C24]" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-neutral-900 block leading-tight">
              {totalDeliverablesCount}
            </span>
            <span className="text-xs text-neutral-500 font-medium">Total Deliverables</span>
          </div>
        </div>

        {/* 3. Pending Approvals */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs flex items-center gap-4 transition-all hover:shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#ED1C24] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-neutral-900 block leading-tight">
              {pendingApprovalsCount}
            </span>
            <span className="text-xs text-neutral-500 font-medium">Pending Approvals</span>
          </div>
        </div>

        {/* 4. Delivered */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs flex items-center gap-4 transition-all hover:shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-neutral-900 block leading-tight">
              {deliveredCount}
            </span>
            <span className="text-xs text-neutral-500 font-medium">Delivered</span>
          </div>
        </div>
      </div>

      {/* 3. Two-Column Full-Width Grid (8 + 4 Columns on desktop) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Active Projects + Deliverable Overview */}
        <div className="xl:col-span-8 space-y-6">
          {/* A. Active Projects Card */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900">Active Projects</h3>
                <p className="text-[11px] text-neutral-400">
                  Your ongoing projects and their deliverable progress
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('projects_tasks')}
                className="text-xs font-semibold text-neutral-800 hover:text-[#ED1C24] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All Projects</span>
                <span>&rarr;</span>
              </button>
            </div>

            <div className="space-y-3">
              {clientProjects.length > 0 ? (
                clientProjects.map((proj) => {
                  const projDeliverables = clientDeliverables.filter(
                    (d) => d.projectId === proj.id
                  );
                  const projCompleted = projDeliverables.filter(
                    (d) =>
                      d.stage === 'publishing_or_delivery' &&
                      (d.status === 'published' || d.status === 'delivered')
                  ).length;
                  const progress =
                    projDeliverables.length > 0
                      ? Math.round((projCompleted / projDeliverables.length) * 100)
                      : proj.progress || 0;

                  return (
                    <div
                      key={proj.id}
                      className="p-3.5 bg-neutral-50/60 hover:bg-neutral-50 rounded-xl border border-neutral-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-10 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-700 font-bold text-xs">
                          {proj.title.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                            {proj.title}
                          </h4>
                          <p className="text-[10px] sm:text-[11px] text-neutral-500 truncate">
                            {projDeliverables.length > 0
                              ? `${projDeliverables.length} Deliverables • ${projCompleted} Completed`
                              : 'Ongoing Creative Project'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:shrink-0">
                        {/* Progress Bar in RAHI Red */}
                        <div className="flex items-center gap-2 w-28 sm:w-32">
                          <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#ED1C24] h-full rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-neutral-700 w-8 text-right">
                            {progress}%
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap bg-neutral-100 text-neutral-800 border-neutral-200 capitalize">
                          {proj.status?.replace('_', ' ') || 'In Progress'}
                        </span>

                        {/* Deadline */}
                        <div className="flex items-center gap-1 text-[10px] text-neutral-500 whitespace-nowrap">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          <span>{formatDate(proj.targetEndDate || (proj as any).deadline)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 px-4 text-center rounded-xl bg-neutral-50/70 border border-neutral-200/60">
                  <Folder className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-neutral-700">No active projects yet</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Creative campaigns and projects created by your agency team will appear here in real time.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* B. Deliverable Overview (Segmented Progress Bar + Commitment Sync) */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900">Deliverable Overview</h3>
                <p className="text-[11px] text-neutral-400">
                  {formatMonthDisplay(selectedMonth)} deliverable progress & commitments
                </p>
              </div>
              {stats.totalCommitment > 0 && (
                <span className="text-xs font-bold text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200 self-start sm:self-auto">
                  {deliveredCount} / {stats.totalCommitment} Completed ({stats.completionPercentage}%)
                </span>
              )}
            </div>

            {stats.allTargetsZero && monthDeliverables.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400 italic bg-neutral-50 rounded-xl border border-neutral-200/60">
                No deliverable commitments have been configured for this client yet.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Multi-Segment Horizontal Bar */}
                <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-neutral-100 shadow-inner">
                  {deliveredPct > 0 && (
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${deliveredPct}%` }}
                      title={`Delivered: ${deliveredCount}`}
                    />
                  )}
                  {inProdPct > 0 && (
                    <div
                      className="bg-amber-400 h-full transition-all"
                      style={{ width: `${inProdPct}%` }}
                      title={`In Production: ${inProductionItems.length}`}
                    />
                  )}
                  {revisionPct > 0 && (
                    <div
                      className="bg-[#ED1C24] h-full transition-all"
                      style={{ width: `${revisionPct}%` }}
                      title={`Revisions: ${revisionItems.length}`}
                    />
                  )}
                  {remainingPct > 0 && (
                    <div
                      className="bg-neutral-300 h-full transition-all"
                      style={{ width: `${remainingPct}%` }}
                      title={`Remaining: ${remainingTarget}`}
                    />
                  )}
                </div>

                {/* Legend Below with actual live counts */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-neutral-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Delivered ({deliveredCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-neutral-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                    <span>In Production ({inProductionItems.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-neutral-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ED1C24] shrink-0" />
                    <span>Revisions ({revisionItems.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-neutral-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 shrink-0" />
                    <span>Remaining ({remainingTarget})</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Content Calendar + Pending Actions */}
        <div className="xl:col-span-4 space-y-6">
          {/* A. Content Calendar Card */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Content Calendar</h3>
                <p className="text-[11px] text-neutral-400">Upcoming content & shoots</p>
              </div>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs font-semibold text-neutral-800 hover:text-[#ED1C24] flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>View Calendar</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Calendar Header Month Control */}
            <div className="flex items-center justify-between py-2 border-b border-neutral-100 text-xs font-bold text-neutral-900">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-900 cursor-pointer"
                aria-label="Previous Month"
              >
                &lt;
              </button>
              <span>{formatMonthDisplay(selectedMonth)}</span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-900 cursor-pointer"
                aria-label="Next Month"
              >
                &gt;
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-neutral-400 pt-2 pb-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Dynamic Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {emptyLeadingDays.map((i) => (
                <div key={`empty-${i}`} className="w-7 h-7 mx-auto" />
              ))}
              {calendarDays.map((day) => {
                const dayDateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
                const isSelected = selectedCalendarDate === dayDateStr;
                const hasDeliverable = clientDeliverables.some((d) => d.deadline === dayDateStr);

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedCalendarDate(dayDateStr)}
                    className={`w-7 h-7 mx-auto rounded-full flex flex-col items-center justify-center font-medium cursor-pointer transition-all relative ${
                      isSelected
                        ? 'bg-[#ED1C24] text-white font-bold shadow-2xs'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{day}</span>
                    {hasDeliverable && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-[#ED1C24] absolute bottom-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* B. Pending Actions Card */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Pending Actions</h3>
                <p className="text-[11px] text-neutral-400">Items that need your review</p>
              </div>
              {pendingApprovals.length > 0 && (
                <button
                  onClick={() => onNavigateTab('approvals')}
                  className="text-xs font-semibold text-neutral-800 hover:text-[#ED1C24] flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  <span>View All ({pendingApprovals.length})</span>
                  <span>&rarr;</span>
                </button>
              )}
            </div>

            {pendingApprovals.length > 0 ? (
              <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#ED1C24] border border-rose-200 flex items-center justify-center shrink-0">
                    <Play className="w-3.5 h-3.5 fill-[#ED1C24]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 truncate">
                      {pendingApprovals[0].title}
                    </h4>
                    <p className="text-[10px] text-neutral-500">
                      {pendingApprovals[0].stage === 'client_script_approval'
                        ? 'Script ready for review'
                        : 'Video ready for review'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onSelectDeliverable(pendingApprovals[0])}
                  className="px-3.5 py-1.5 bg-[#ED1C24] hover:bg-[#d61920] text-white rounded-lg text-xs font-bold shrink-0 shadow-2xs transition-colors cursor-pointer"
                >
                  Review
                </button>
              </div>
            ) : (
              <div className="py-6 px-4 text-center rounded-xl bg-neutral-50/70 border border-neutral-200/60">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-neutral-700">All caught up!</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  No deliverables currently require your review or sign-off.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
