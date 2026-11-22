import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Deliverable,
  CreativeWorkflowStage,
  WORKFLOW_STAGE_METADATA,
  Priority,
  TaskStatus,
  DeliverableStatus,
  Client,
} from './types';

export const TODAY_STRING = '2026-11-22';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export interface PacingMetrics {
  monthProgressionPct: number;
  daysElapsed: number;
  totalDaysInMonth: number;
  expectedDeliverables: number;
  pacingDelta: number;
  pacingStatus: 'ahead' | 'on_track' | 'behind' | 'critical' | 'completed' | 'upcoming';
  pacingLabel: string;
  pacingBadgeClass: string;
}

/**
 * Calculates deliverable counts and pacing for a client:
 * CRITICAL RULE: Deliverables count toward monthly commitment ONLY when
 * they reach 'publishing_or_delivery' and are marked as 'published' or 'delivered'.
 * Cancelled deliverables are preserved in activity history and NOT counted.
 *
 * Explicit Milestone Rounding Policy:
 * Standard half-up integer rounding (Math.round) is applied to expected deliverables.
 * Zero-target clients evaluate to expected = 0 with 'No Target Configured'.
 * Deliverable ID deduplication guarantees no deliverable is counted more than once.
 */
export function calculateClientDeliverableStats(
  client: Client,
  deliverables: Deliverable[],
  targetMonth: string = '2026-11'
) {
  // Deduplicate deliverables by ID to strictly prevent any duplicate counting
  const seenDeliverableIds = new Set<string>();
  const clientDeliverables: Deliverable[] = [];

  for (const d of deliverables) {
    if (d.clientId === client.id && (!targetMonth || d.targetMonth === targetMonth)) {
      if (!seenDeliverableIds.has(d.id)) {
        seenDeliverableIds.add(d.id);
        clientDeliverables.push(d);
      }
    }
  }

  const activeDeliverables = clientDeliverables.filter((d) => d.status !== 'cancelled');
  const cancelledDeliverables = clientDeliverables.filter((d) => d.status === 'cancelled');

  // Only true completions: Stage 10 AND status published or delivered
  const completedDeliverables = activeDeliverables.filter(
    (d) =>
      d.stage === 'publishing_or_delivery' &&
      (d.status === 'published' || d.status === 'delivered')
  );

  const inProgressDeliverables = activeDeliverables.filter(
    (d) =>
      !(
        d.stage === 'publishing_or_delivery' &&
        (d.status === 'published' || d.status === 'delivered')
      )
  );

  const totalMonthlyCommitment =
    (client.monthlyCommitment?.reels || 0) +
    (client.monthlyCommitment?.longVideos || 0) +
    (client.monthlyCommitment?.graphics || 0) +
    (client.monthlyCommitment?.carousels || 0);

  const completedCount = completedDeliverables.length;
  const inProgressCount = inProgressDeliverables.length;
  const remainingCount = Math.max(0, totalMonthlyCommitment - completedCount);
  const completionPercentage =
    totalMonthlyCommitment > 0
      ? Math.min(100, Math.round((completedCount / totalMonthlyCommitment) * 100))
      : 0;

  // Pacing Calculation
  const currentMonthStr = TODAY_STRING.substring(0, 7); // '2026-11'
  const currentDayNum = parseInt(TODAY_STRING.substring(8, 10), 10); // 22

  // Determine total days in target month (handles leap years accurately via standard Date API)
  const [yearStr, monthStr] = targetMonth.split('-');
  const year = parseInt(yearStr, 10) || 2026;
  const month = parseInt(monthStr, 10) || 11;
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  let daysElapsed = 0;
  let monthProgressionPct = 0;

  if (targetMonth === currentMonthStr) {
    daysElapsed = Math.min(currentDayNum, totalDaysInMonth);
    monthProgressionPct = Math.round((daysElapsed / totalDaysInMonth) * 100);
  } else if (targetMonth < currentMonthStr) {
    daysElapsed = totalDaysInMonth;
    monthProgressionPct = 100;
  } else {
    daysElapsed = 0;
    monthProgressionPct = 0;
  }

  // Handle Zero-Target Edge Case
  if (totalMonthlyCommitment === 0) {
    const pacing: PacingMetrics = {
      monthProgressionPct,
      daysElapsed,
      totalDaysInMonth,
      expectedDeliverables: 0,
      pacingDelta: 0,
      pacingStatus: 'on_track',
      pacingLabel: 'No Target Configured',
      pacingBadgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    };

    return {
      totalCommitment: 0,
      completed: completedCount,
      inProgress: inProgressCount,
      remaining: 0,
      cancelled: cancelledDeliverables.length,
      completionPercentage: 0,
      deliverables: clientDeliverables,
      completedItems: completedDeliverables,
      inProgressItems: inProgressDeliverables,
      pacing,
    };
  }

  // Standard Half-Up Integer Rounding for expected milestone target
  const expectedDeliverables = Math.round(totalMonthlyCommitment * (monthProgressionPct / 100));
  const pacingDelta = completedCount - expectedDeliverables;

  let pacingStatus: PacingMetrics['pacingStatus'] = 'on_track';
  let pacingLabel = 'On Track';
  let pacingBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';

  if (monthProgressionPct === 0) {
    pacingStatus = 'upcoming';
    pacingLabel = 'Upcoming Month';
    pacingBadgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
  } else if (monthProgressionPct === 100) {
    if (completedCount >= totalMonthlyCommitment) {
      pacingStatus = 'completed';
      pacingLabel = 'Target Met (100%)';
      pacingBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else {
      pacingStatus = 'critical';
      pacingLabel = `Target Shortfall (-${remainingCount})`;
      pacingBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    }
  } else {
    // Active current month
    if (completionPercentage >= monthProgressionPct + 5) {
      pacingStatus = 'ahead';
      pacingLabel = `Ahead of Pace (+${pacingDelta})`;
      pacingBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (completionPercentage >= monthProgressionPct - 10) {
      pacingStatus = 'on_track';
      pacingLabel = `On Track (${completedCount}/${expectedDeliverables} exp)`;
      pacingBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (completionPercentage >= monthProgressionPct - 25) {
      pacingStatus = 'behind';
      pacingLabel = `Behind Pace (${pacingDelta})`;
      pacingBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    } else {
      pacingStatus = 'critical';
      pacingLabel = `Critical Lag (${pacingDelta} deliverables)`;
      pacingBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    }
  }

  const pacing: PacingMetrics = {
    monthProgressionPct,
    daysElapsed,
    totalDaysInMonth,
    expectedDeliverables,
    pacingDelta,
    pacingStatus,
    pacingLabel,
    pacingBadgeClass,
  };

  return {
    totalCommitment: totalMonthlyCommitment,
    completed: completedCount,
    inProgress: inProgressCount,
    remaining: remainingCount,
    cancelled: cancelledDeliverables.length,
    completionPercentage,
    deliverables: clientDeliverables,
    completedItems: completedDeliverables,
    inProgressItems: inProgressDeliverables,
    pacing,
  };
}

export function getPriorityBadge(priority: Priority) {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgent', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'high':
      return { label: 'High', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'medium':
      return { label: 'Medium', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'low':
      return { label: 'Low', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function getTaskStatusBadge(status: TaskStatus) {
  switch (status) {
    case 'backlog':
      return { label: 'Backlog', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'todo':
      return { label: 'To Do', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'in_progress':
      return { label: 'In Progress', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'in_review':
      return { label: 'Internal Review', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'revision':
      return { label: 'Revision', bg: 'bg-pink-50 text-pink-700 border-pink-200' };
    case 'completed':
      return { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
}

export function getDeliverableStatusBadge(status: DeliverableStatus) {
  switch (status) {
    case 'in_progress':
      return { label: 'In Progress', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'internal_review':
      return { label: 'Internal Review', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'client_review':
      return { label: 'Client Approval Pending', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'revision_requested':
      return { label: 'Revision Requested', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'approved':
      return { label: 'Client Approved', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
    case 'scheduled':
      return { label: 'Scheduled', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'published':
      return { label: 'Published (Delivered)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'delivered':
      return { label: 'Delivered', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-slate-100 text-slate-600 border-slate-300' };
  }
}

export function getStageDetails(stage: CreativeWorkflowStage) {
  return WORKFLOW_STAGE_METADATA[stage];
}

export type CapacityStatus = 'under_capacity' | 'optimal' | 'near_capacity' | 'overloaded';

export interface WorkloadCapacityInfo {
  percentage: number;
  status: CapacityStatus;
  label: string;
  badgeClass: string;
  barColor: string;
  isOverloaded: boolean;
  isHigh: boolean;
}

export function getWorkloadCapacityInfo(currentActive: number, maxConcurrent: number): WorkloadCapacityInfo {
  const max = Math.max(1, maxConcurrent);
  const percentage = Math.round((currentActive / max) * 100);

  if (currentActive >= max) {
    return {
      percentage,
      status: 'overloaded',
      label: 'Overloaded',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      barColor: 'bg-rose-600',
      isOverloaded: true,
      isHigh: true,
    };
  }

  if (percentage >= 80) {
    return {
      percentage,
      status: 'near_capacity',
      label: 'Near Capacity',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      barColor: 'bg-amber-500',
      isOverloaded: false,
      isHigh: true,
    };
  }

  if (percentage >= 40) {
    return {
      percentage,
      status: 'optimal',
      label: 'Optimal',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      barColor: 'bg-emerald-600',
      isOverloaded: false,
      isHigh: false,
    };
  }

  return {
    percentage,
    status: 'under_capacity',
    label: 'Under-Capacity',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    barColor: 'bg-blue-600',
    isOverloaded: false,
    isHigh: false,
  };
}
