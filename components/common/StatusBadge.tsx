import React from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  FileCheck2,
  XCircle,
  Send,
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

  // Configuration for restrained SaaS status indicators
  let bg = 'bg-slate-100';
  let text = 'text-slate-700';
  let border = 'border-slate-200';
  let Icon: React.ElementType | null = null;
  let displayLabel = label;

  switch (normalized) {
    // Completed / Published / Delivered / Approved
    case 'completed':
    case 'published':
    case 'delivered':
    case 'approved':
      bg = 'bg-emerald-50';
      text = 'text-emerald-700';
      border = 'border-emerald-200';
      Icon = CheckCircle2;
      displayLabel = displayLabel || normalized.replace('_', ' ');
      break;

    // Active
    case 'active':
      bg = 'bg-emerald-50';
      text = 'text-emerald-700';
      border = 'border-emerald-200';
      Icon = CheckCircle2;
      displayLabel = displayLabel || 'Active';
      break;

    // In Progress / Video Editing / Scripting / Production
    case 'in_progress':
    case 'video_editing':
    case 'scripting':
    case 'video_production':
    case 'final_polishing':
      bg = 'bg-blue-50';
      text = 'text-blue-700';
      border = 'border-blue-200';
      Icon = PlayCircle;
      displayLabel = displayLabel || normalized.replace(/_/g, ' ');
      break;

    // In Review / Internal Review
    case 'in_review':
    case 'internal_review':
      bg = 'bg-amber-50';
      text = 'text-amber-800';
      border = 'border-amber-200';
      Icon = Eye;
      displayLabel = displayLabel || 'Internal Review';
      break;

    // Client Review / Client Approvals
    case 'client_review':
    case 'client_script_approval':
    case 'client_video_approval':
      bg = 'bg-purple-50';
      text = 'text-purple-700';
      border = 'border-purple-200';
      Icon = FileCheck2;
      displayLabel = displayLabel || 'Client Review';
      break;

    // Revision Requested / Urgent / Overdue / High
    case 'revision_requested':
    case 'urgent':
    case 'blocked':
      bg = 'bg-rose-50';
      text = 'text-rose-700';
      border = 'border-rose-200';
      Icon = AlertTriangle;
      displayLabel = displayLabel || (normalized === 'revision_requested' ? 'Revision Needed' : normalized);
      break;

    case 'high':
      bg = 'bg-amber-50';
      text = 'text-amber-700';
      border = 'border-amber-200';
      Icon = AlertTriangle;
      displayLabel = displayLabel || 'High Priority';
      break;

    case 'medium':
      bg = 'bg-blue-50';
      text = 'text-blue-700';
      border = 'border-blue-200';
      Icon = Clock;
      displayLabel = displayLabel || 'Medium';
      break;

    case 'low':
      bg = 'bg-slate-100';
      text = 'text-slate-600';
      border = 'border-slate-200';
      Icon = Clock;
      displayLabel = displayLabel || 'Low';
      break;

    // Cancelled / Inactive / Paused
    case 'cancelled':
    case 'inactive':
      bg = 'bg-slate-100';
      text = 'text-slate-500';
      border = 'border-slate-200';
      Icon = XCircle;
      displayLabel = displayLabel || normalized;
      break;

    case 'paused':
      bg = 'bg-amber-50';
      text = 'text-amber-700';
      border = 'border-amber-200';
      Icon = Clock;
      displayLabel = displayLabel || 'Paused';
      break;

    // Roles
    case 'admin':
      bg = 'bg-indigo-50';
      text = 'text-indigo-700';
      border = 'border-indigo-200';
      Icon = Shield;
      displayLabel = displayLabel || 'Admin';
      break;

    case 'manager':
      bg = 'bg-blue-50';
      text = 'text-blue-700';
      border = 'border-blue-200';
      Icon = Shield;
      displayLabel = displayLabel || 'Manager';
      break;

    case 'employee':
      bg = 'bg-emerald-50';
      text = 'text-emerald-700';
      border = 'border-emerald-200';
      Icon = Users;
      displayLabel = displayLabel || 'Creative Team';
      break;

    case 'client':
      bg = 'bg-purple-50';
      text = 'text-purple-700';
      border = 'border-purple-200';
      Icon = Briefcase;
      displayLabel = displayLabel || 'Client';
      break;

    // Default / Planning / Pending
    case 'planning':
    case 'pending':
    default:
      bg = 'bg-slate-100';
      text = 'text-slate-700';
      border = 'border-slate-200';
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
