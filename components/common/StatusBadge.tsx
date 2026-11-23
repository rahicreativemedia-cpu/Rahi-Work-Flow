import React from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  FileCheck2,
  XCircle,
  Eye,
  Shield,
  Briefcase,
  Users,
} from 'lucide-react';

export type StatusType =
  // Deliverable statuses & stages
  | 'planning'
  | 'scripting'
  | 'client_script_approval'
  | 'video_production'
  | 'video_editing'
  | 'internal_review'
  | 'client_video_approval'
  | 'final_polishing'
  | 'approved'
  | 'publishing_or_delivery'
  | 'published'
  | 'delivered'
  | 'revision_requested'
  | 'client_review'
  | 'cancelled'
  // Task statuses
  | 'pending'
  | 'in_progress'
  | 'in_review'
  | 'completed'
  | 'blocked'
  // Priorities
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'
  // Roles
  | 'admin'
  | 'manager'
  | 'employee'
  | 'client'
  // Account/Client states
  | 'active'
  | 'inactive'
  | 'paused'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  size = 'sm',
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const normalized = (status || '').toLowerCase().replace(/[\s-]/g, '_');

  // Minimalist Monochrome Theme
  let bg = 'bg-neutral-100';
  let text = 'text-neutral-800';
  let border = 'border-neutral-200';
  let Icon: React.ElementType | null = null;
  let displayLabel = label;

  switch (normalized) {
    // Completed / Published / Delivered / Approved
    case 'completed':
    case 'published':
    case 'delivered':
    case 'approved':
      bg = 'bg-black';
      text = 'text-white font-semibold';
      border = 'border-black';
      Icon = CheckCircle2;
      displayLabel = displayLabel || normalized.replace('_', ' ');
      break;

    // Active
    case 'active':
      bg = 'bg-black';
      text = 'text-white font-semibold';
      border = 'border-black';
      Icon = CheckCircle2;
      displayLabel = displayLabel || 'Active';
      break;

    // In Progress / Video Editing / Scripting / Production
    case 'in_progress':
    case 'video_editing':
    case 'scripting':
    case 'video_production':
    case 'final_polishing':
      bg = 'bg-neutral-900';
      text = 'text-white font-medium';
      border = 'border-neutral-800';
      Icon = PlayCircle;
      displayLabel = displayLabel || normalized.replace(/_/g, ' ');
      break;

    // In Review / Internal Review
    case 'in_review':
    case 'internal_review':
      bg = 'bg-neutral-100';
      text = 'text-black font-semibold';
      border = 'border-neutral-300';
      Icon = Eye;
      displayLabel = displayLabel || 'Internal Review';
      break;

    // Client Review / Client Approvals
    case 'client_review':
    case 'client_script_approval':
    case 'client_video_approval':
      bg = 'bg-neutral-200';
      text = 'text-black font-semibold';
      border = 'border-neutral-400';
      Icon = FileCheck2;
      displayLabel = displayLabel || 'Client Review';
      break;

    // Revision Requested / Urgent / Overdue / High
    case 'revision_requested':
    case 'urgent':
    case 'blocked':
      bg = 'bg-neutral-900';
      text = 'text-white font-bold';
      border = 'border-black';
      Icon = AlertTriangle;
      displayLabel = displayLabel || (normalized === 'revision_requested' ? 'Revision Needed' : normalized);
      break;

    case 'high':
      bg = 'bg-neutral-800';
      text = 'text-white font-semibold';
      border = 'border-neutral-700';
      Icon = AlertTriangle;
      displayLabel = displayLabel || 'High Priority';
      break;

    case 'medium':
      bg = 'bg-neutral-100';
      text = 'text-neutral-900';
      border = 'border-neutral-300';
      Icon = Clock;
      displayLabel = displayLabel || 'Medium';
      break;

    case 'low':
      bg = 'bg-neutral-50';
      text = 'text-neutral-600';
      border = 'border-neutral-200';
      Icon = Clock;
      displayLabel = displayLabel || 'Low';
      break;

    // Cancelled / Inactive / Paused
    case 'cancelled':
    case 'inactive':
      bg = 'bg-neutral-100';
      text = 'text-neutral-400 line-through';
      border = 'border-neutral-200';
      Icon = XCircle;
      displayLabel = displayLabel || normalized;
      break;

    case 'paused':
      bg = 'bg-neutral-100';
      text = 'text-neutral-600';
      border = 'border-neutral-300';
      Icon = Clock;
      displayLabel = displayLabel || 'Paused';
      break;

    // Roles
    case 'admin':
      bg = 'bg-black';
      text = 'text-white font-semibold';
      border = 'border-black';
      Icon = Shield;
      displayLabel = displayLabel || 'Admin';
      break;

    case 'manager':
      bg = 'bg-neutral-900';
      text = 'text-white font-semibold';
      border = 'border-neutral-800';
      Icon = Shield;
      displayLabel = displayLabel || 'Manager';
      break;

    case 'employee':
      bg = 'bg-neutral-100';
      text = 'text-black font-semibold';
      border = 'border-neutral-300';
      Icon = Users;
      displayLabel = displayLabel || 'Creative Team';
      break;

    case 'client':
      bg = 'bg-neutral-100';
      text = 'text-black font-semibold';
      border = 'border-neutral-300';
      Icon = Briefcase;
      displayLabel = displayLabel || 'Client';
      break;

    // Default / Planning / Pending
    case 'planning':
    case 'pending':
    default:
      bg = 'bg-neutral-100';
      text = 'text-neutral-800';
      border = 'border-neutral-200';
      Icon = Clock;
      displayLabel = displayLabel || normalized.replace(/_/g, ' ');
      break;
  }

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-xs font-semibold px-3 py-1.5 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium capitalize rounded-full border transition-colors',
        bg,
        text,
        border,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}
