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
  CategoryDeliverableStats,
  WeeklyPeriodStats,
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

  // Deliverables pending client review / approval
  const awaitingApprovalDeliverables = activeDeliverables.filter(
    (d) =>
      d.stage === 'client_script_approval' ||
      d.stage === 'client_video_approval' ||
      d.status === 'client_review'
  );

  // Targets across the 6 categories (with backward compatibility for posts <-> graphics)
  const targetReels = client.monthlyCommitment?.reels ?? 0;
  const targetMarketingReels = client.monthlyCommitment?.marketingReels ?? 0;
  const targetPosts = client.monthlyCommitment?.posts ?? client.monthlyCommitment?.graphics ?? 0;
  const targetCarousels = client.monthlyCommitment?.carousels ?? 0;
  const targetShowreels = client.monthlyCommitment?.showreels ?? 0;
  const targetLongVideos = client.monthlyCommitment?.longVideos ?? 0;

  const totalMonthlyCommitment =
    targetReels +
    targetMarketingReels +
    targetPosts +
    targetCarousels +
    targetShowreels +
    targetLongVideos;

  // Build category stats helper
  const buildCategoryStats = (
    key: 'reels' | 'marketingReels' | 'posts' | 'carousels' | 'showreels' | 'longVideos',
    label: string,
    target: number,
    filterFn: (d: Deliverable) => boolean
  ): CategoryDeliverableStats => {
    const items = activeDeliverables.filter(filterFn);
    const completed = items.filter(
      (d) =>
        d.stage === 'publishing_or_delivery' &&
        (d.status === 'published' || d.status === 'delivered')
    ).length;
    const awaitingApproval = items.filter(
      (d) =>
        d.stage === 'client_script_approval' ||
        d.stage === 'client_video_approval' ||
        d.status === 'client_review'
    ).length;
    const overdue = items.filter((d) => {
      const isDone =
        d.stage === 'publishing_or_delivery' &&
        (d.status === 'published' || d.status === 'delivered');
      return !isDone && d.deadline && d.deadline < TODAY_STRING;
    }).length;
    const inProd = items.length - completed - awaitingApproval;

    return {
      categoryKey: key,
      label,
      target,
      completed,
      pending: Math.max(0, target - completed),
      inProduction: Math.max(0, inProd),
      awaitingApproval,
      overdue,
    };
  };

  const categories: CategoryDeliverableStats[] = [
    buildCategoryStats('reels', 'Reels', targetReels, (d) => d.type === 'reel'),
    buildCategoryStats(
      'marketingReels',
      'Marketing Reels',
      targetMarketingReels,
      (d) => d.type === 'marketing_reel'
    ),
    buildCategoryStats(
      'posts',
      'Posts',
      targetPosts,
      (d) => d.type === 'post' || d.type === 'graphic'
    ),
    buildCategoryStats('carousels', 'Carousels', targetCarousels, (d) => d.type === 'carousel'),
    buildCategoryStats('showreels', 'Showreels', targetShowreels, (d) => d.type === 'showreel'),
    buildCategoryStats(
      'longVideos',
      'Long Videos',
      targetLongVideos,
      (d) => d.type === 'long_video'
    ),
  ];

  // Visible categories strictly hide categories with target === 0
  const visibleCategories = categories.filter((c) => c.target > 0);
  const allTargetsZero = totalMonthlyCommitment === 0;

  const completedCount = completedDeliverables.length;
  const inProgressCount = inProgressDeliverables.length;
  const remainingCount = Math.max(0, totalMonthlyCommitment - completedCount);
  const completionPercentage =
    totalMonthlyCommitment > 0
      ? Math.min(100, Math.round((completedCount / totalMonthlyCommitment) * 100))
      : 0;

  // Determine total days in target month
  const [yearStr, monthStr] = targetMonth.split('-');
  const year = parseInt(yearStr, 10) || 2026;
  const month = parseInt(monthStr, 10) || 11;
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  // Weekly periods generation for Video Production Only or weekly frequency
  const isWeeklyClient =
    client.servicePackage === 'Video Production Only' ||
    client.monthlyCommitment?.trackingFrequency === 'weekly';

  const weeklyCommitment = client.monthlyCommitment?.weeklyCommitment;
  const weeklyTarget = weeklyCommitment
    ? (weeklyCommitment.reels || 0) +
      (weeklyCommitment.marketingReels || 0) +
      (weeklyCommitment.showreels || 0) +
      (weeklyCommitment.longVideos || 0)
    : Math.ceil(totalMonthlyCommitment / 4) || 0;

  const deadlineDayName = client.monthlyCommitment?.weeklyDeadlineDay || weeklyCommitment?.deadlineDay || 'Friday';

  const dayNameToIndex: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const targetDayOfWeek = dayNameToIndex[deadlineDayName] ?? 5; // default Friday

  const weeklyPeriods: WeeklyPeriodStats[] = [];
  const totalWeeks = Math.ceil(totalDaysInMonth / 7);

  for (let w = 1; w <= totalWeeks; w++) {
    const startDay = (w - 1) * 7 + 1;
    const endDay = Math.min(w * 7, totalDaysInMonth);

    const pad = (n: number) => String(n).padStart(2, '0');
    const startDate = `${yearStr}-${pad(month)}-${pad(startDay)}`;
    const endDate = `${yearStr}-${pad(month)}-${pad(endDay)}`;

    // Find the deadline date within or closest to the end of this weekly window
    let dueDay = endDay;
    for (let d = startDay; d <= endDay; d++) {
      const dt = new Date(year, month - 1, d);
      if (dt.getDay() === targetDayOfWeek) {
        dueDay = d;
        break;
      }
    }
    const dueDate = `${yearStr}-${pad(month)}-${pad(dueDay)}`;

    // Match video deliverables whose deadline or created date falls in this window
    const weekItems = activeDeliverables.filter((d) => {
      const isVideo =
        d.type === 'reel' ||
        d.type === 'marketing_reel' ||
        d.type === 'showreel' ||
        d.type === 'long_video';
      if (!isVideo) return false;

      const dateToCheck = d.scheduledPublishDate || d.deadline || d.createdAt?.split('T')[0];
      if (dateToCheck) {
        return dateToCheck >= startDate && dateToCheck <= endDate;
      }
      return false;
    });

    const weekCompleted = weekItems.filter(
      (d) =>
        d.stage === 'publishing_or_delivery' &&
        (d.status === 'published' || d.status === 'delivered')
    ).length;
    const weekAwaiting = weekItems.filter(
      (d) =>
        d.stage === 'client_script_approval' ||
        d.stage === 'client_video_approval' ||
        d.status === 'client_review'
    ).length;
    const weekOverdue = weekItems.filter((d) => {
      const isDone =
        d.stage === 'publishing_or_delivery' &&
        (d.status === 'published' || d.status === 'delivered');
      return !isDone && d.deadline && d.deadline < TODAY_STRING;
    }).length;
    const weekInProd = Math.max(0, weekItems.length - weekCompleted - weekAwaiting);

    weeklyPeriods.push({
      weekNumber: w,
      label: `Week ${w}`,
      startDate,
      endDate,
      dueDate,
      dueDayName: deadlineDayName,
      targetVideos: weeklyTarget,
      completedVideos: weekCompleted,
      pendingVideos: Math.max(0, weeklyTarget - weekCompleted),
      inProduction: weekInProd,
      awaitingApproval: weekAwaiting,
      overdueVideos: weekOverdue,
      completionPercentage:
        weeklyTarget > 0 ? Math.min(100, Math.round((weekCompleted / weeklyTarget) * 100)) : 0,
    });
  }

  // Pacing Calculation
  const currentMonthStr = TODAY_STRING.substring(0, 7); // '2026-11'
  const currentDayNum = parseInt(TODAY_STRING.substring(8, 10), 10); // 22

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
      categories,
      visibleCategories,
      allTargetsZero: true,
      weeklyPeriods,
      isWeeklyClient,
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
    categories,
    visibleCategories,
    allTargetsZero: false,
    weeklyPeriods,
    isWeeklyClient,
    pacing,
  };
}

export function getPriorityBadge(priority: Priority) {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgent', bg: 'bg-rose-950 text-rose-100 border border-rose-800 font-bold shadow-2xs' };
    case 'high':
      return { label: 'High', bg: 'bg-rose-900/80 text-rose-100 border border-rose-800' };
    case 'medium':
      return { label: 'Medium', bg: 'bg-stone-100 text-stone-900 border border-stone-300 font-medium' };
    case 'low':
      return { label: 'Low', bg: 'bg-stone-50 text-stone-700 border border-stone-200' };
  }
}

export function getTaskStatusBadge(status: TaskStatus) {
  switch (status) {
    case 'backlog':
      return { label: 'Backlog', bg: 'bg-stone-100 text-stone-600 border border-stone-200' };
    case 'todo':
      return { label: 'To Do', bg: 'bg-stone-100 text-stone-800 border border-stone-300' };
    case 'in_progress':
      return { label: 'In Progress', bg: 'bg-stone-900 text-white border border-stone-900 font-semibold' };
    case 'under_review':
    case 'in_review':
      return { label: 'Under Review', bg: 'bg-stone-200 text-stone-900 border border-stone-400' };
    case 'revision_required':
    case 'revision':
      return { label: 'Revision Required', bg: 'bg-rose-100 text-rose-950 border border-rose-300 font-bold' };
    case 'approved':
      return { label: 'Approved', bg: 'bg-stone-900 text-white border border-stone-800 font-semibold' };
    case 'completed':
      return { label: 'Completed', bg: 'bg-rose-950 text-rose-100 border border-rose-800 font-bold' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-stone-100 text-stone-500 border border-stone-200 line-through' };
    default:
      return { label: 'To Do', bg: 'bg-stone-100 text-stone-800 border border-stone-300' };
  }
}

export function getDeliverableStatusBadge(status: DeliverableStatus) {
  switch (status) {
    case 'in_progress':
      return { label: 'In Progress', bg: 'bg-stone-900 text-white border border-stone-900 font-semibold' };
    case 'internal_review':
      return { label: 'Internal Review', bg: 'bg-stone-200 text-stone-900 border border-stone-400' };
    case 'client_review':
      return { label: 'Client Approval Pending', bg: 'bg-rose-100 text-rose-950 border border-rose-300 font-bold' };
    case 'revision_requested':
      return { label: 'Revision Requested', bg: 'bg-rose-200 text-rose-950 border border-rose-400 font-bold' };
    case 'approved':
      return { label: 'Client Approved', bg: 'bg-stone-900 text-white border border-stone-800 font-semibold' };
    case 'scheduled':
      return { label: 'Scheduled', bg: 'bg-stone-100 text-stone-800 border border-stone-300' };
    case 'published':
      return { label: 'Published (Delivered)', bg: 'bg-rose-950 text-rose-100 border border-rose-800 font-bold' };
    case 'delivered':
      return { label: 'Delivered', bg: 'bg-rose-950 text-rose-100 border border-rose-800 font-bold' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-stone-100 text-stone-500 border border-stone-200 line-through' };
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
