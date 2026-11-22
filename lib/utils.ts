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

/**
 * Calculates deliverable counts for a client:
 * CRITICAL RULE: Deliverables count toward monthly commitment ONLY when
 * they reach 'publishing_or_delivery' and are marked as 'published' or 'delivered'.
 * Cancelled deliverables are preserved in activity history and NOT counted.
 */
export function calculateClientDeliverableStats(
  client: Client,
  deliverables: Deliverable[],
  targetMonth?: string
) {
  const clientDeliverables = deliverables.filter((d) => {
    const matchClient = d.clientId === client.id;
    if (!matchClient) return false;
    if (targetMonth) return d.targetMonth === targetMonth;
    return true;
  });

  const activeDeliverables = clientDeliverables.filter((d) => d.status !== 'cancelled');
  const cancelledDeliverables = clientDeliverables.filter((d) => d.status === 'cancelled');

  // Only true completions
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
    client.monthlyCommitment.reels +
    client.monthlyCommitment.longVideos +
    client.monthlyCommitment.graphics +
    client.monthlyCommitment.carousels;

  const completedCount = completedDeliverables.length;
  const inProgressCount = inProgressDeliverables.length;
  const remainingCount = Math.max(0, totalMonthlyCommitment - completedCount);
  const completionPercentage =
    totalMonthlyCommitment > 0
      ? Math.min(100, Math.round((completedCount / totalMonthlyCommitment) * 100))
      : 0;

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
