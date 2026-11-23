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
      pacingBadgeClass: 'bg-neutral-100 text-neutral-600 border-neutral-200',
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
  let pacingBadgeClass = 'bg-neutral-100 text-neutral-900 border-neutral-300';

  if (monthProgressionPct === 0) {
    pacingStatus = 'upcoming';
    pacingLabel = 'Upcoming Month';
    pacingBadgeClass = 'bg-neutral-100 text-neutral-600 border-neutral-200';
  } else if (monthProgressionPct === 100) {
    if (completedCount >= totalMonthlyCommitment) {
      pacingStatus = 'completed';
      pacingLabel = 'Target Met (100%)';
      pacingBadgeClass = 'bg-black text-white border-black font-bold';
    } else {
      pacingStatus = 'critical';
      pacingLabel = `Target Shortfall (-${remainingCount})`;
      pacingBadgeClass = 'bg-neutral-200 text-neutral-900 border-neutral-400 font-bold';
    }
  } else {
    // Active current month
    if (completionPercentage >= monthProgressionPct + 5) {
      pacingStatus = 'ahead';
      pacingLabel = `Ahead of Pace (+${pacingDelta})`;
      pacingBadgeClass = 'bg-black text-white border-black';
    } else if (completionPercentage >= monthProgressionPct - 10) {
      pacingStatus = 'on_track';
      pacingLabel = `On Track (${completedCount}/${expectedDeliverables} exp)`;
      pacingBadgeClass = 'bg-neutral-100 text-neutral-900 border-neutral-300';
    } else if (completionPercentage >= monthProgressionPct - 25) {
      pacingStatus = 'behind';
      pacingLabel = `Behind Pace (${pacingDelta})`;
      pacingBadgeClass = 'bg-neutral-100 text-neutral-800 border-neutral-400';
    } else {
      pacingStatus = 'critical';
      pacingLabel = `Critical Lag (${pacingDelta} deliverables)`;
      pacingBadgeClass = 'bg-neutral-200 text-neutral-900 border-neutral-400 font-bold';
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
      return { label: 'Urgent', bg: 'bg-black text-white border-black font-bold' };
    case 'high':
      return { label: 'High', bg: 'bg-neutral-800 text-white border-neutral-800' };
    case 'medium':
      return { label: 'Medium', bg: 'bg-neutral-200 text-neutral-900 border-neutral-300' };
    case 'low':
      return { label: 'Low', bg: 'bg-neutral-100 text-neutral-700 border-neutral-200' };
  }
}

export function getTaskStatusBadge(status: TaskStatus) {
  switch (status) {
    case 'backlog':
      return { label: 'Backlog', bg: 'bg-neutral-100 text-neutral-600 border-neutral-200' };
    case 'todo':
      return { label: 'To Do', bg: 'bg-neutral-100 text-neutral-800 border-neutral-300' };
    case 'in_progress':
      return { label: 'In Progress', bg: 'bg-neutral-900 text-white border-neutral-900 font-semibold' };
    case 'under_review':
    case 'in_review':
      return { label: 'Under Review', bg: 'bg-neutral-200 text-neutral-900 border-neutral-400' };
    case 'revision_required':
    case 'revision':
      return { label: 'Revision Required', bg: 'bg-neutral-200 text-neutral-900 border-neutral-400 font-bold' };
    case 'approved':
      return { label: 'Approved', bg: 'bg-neutral-100 text-neutral-900 border-neutral-300 font-semibold' };
    case 'completed':
      return { label: 'Completed', bg: 'bg-black text-white border-black font-bold' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-neutral-100 text-neutral-500 border-neutral-200 line-through' };
    default:
      return { label: 'To Do', bg: 'bg-neutral-100 text-neutral-800 border-neutral-300' };
  }
}

export function getDeliverableStatusBadge(status: DeliverableStatus) {
  switch (status) {
    case 'in_progress':
      return { label: 'In Progress', bg: 'bg-neutral-900 text-white border-neutral-900 font-semibold' };
    case 'internal_review':
      return { label: 'Internal Review', bg: 'bg-neutral-200 text-neutral-900 border-neutral-400' };
    case 'client_review':
      return { label: 'Client Approval Pending', bg: 'bg-neutral-200 text-neutral-900 border-neutral-400 font-semibold' };
    case 'revision_requested':
      return { label: 'Revision Requested', bg: 'bg-neutral-200 text-neutral-900 border-neutral-400 font-bold' };
    case 'approved':
      return { label: 'Client Approved', bg: 'bg-neutral-100 text-neutral-900 border-neutral-300 font-semibold' };
    case 'scheduled':
      return { label: 'Scheduled', bg: 'bg-neutral-100 text-neutral-800 border-neutral-300' };
    case 'published':
      return { label: 'Published (Delivered)', bg: 'bg-black text-white border-black font-bold' };
    case 'delivered':
      return { label: 'Delivered', bg: 'bg-black text-white border-black font-bold' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-neutral-100 text-neutral-500 border-neutral-200 line-through' };
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
      badgeClass: 'bg-black text-white border-black font-bold',
      barColor: 'bg-black',
      isOverloaded: true,
      isHigh: true,
    };
  }

  if (percentage >= 80) {
    return {
      percentage,
      status: 'near_capacity',
      label: 'Near Capacity',
      badgeClass: 'bg-neutral-800 text-white border-neutral-800',
      barColor: 'bg-neutral-700',
      isOverloaded: false,
      isHigh: true,
    };
  }

  if (percentage >= 40) {
    return {
      percentage,
      status: 'optimal',
      label: 'Optimal',
      badgeClass: 'bg-neutral-100 text-neutral-900 border-neutral-300',
      barColor: 'bg-neutral-900',
      isOverloaded: false,
      isHigh: false,
    };
  }

  return {
    percentage,
    status: 'under_capacity',
    label: 'Under-Capacity',
    badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    barColor: 'bg-neutral-400',
    isOverloaded: false,
    isHigh: false,
  };
}
