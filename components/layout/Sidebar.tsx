import React from 'react';
import {
  LayoutDashboard,
  Kanban,
  CheckSquare,
  Users,
  Briefcase,
  FileCheck2,
  BarChart3,
  UserPlus,
  History,
  FolderOpen,
  Calendar,
  UploadCloud,
  MessageSquareWarning,
  Award,
  Shield,
  Layers,
  X,
} from 'lucide-react';
import { User } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  pendingApprovalsCount?: number;
  overdueTasksCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  currentUser,
  activeTab,
  onSelectTab,
  pendingApprovalsCount = 0,
  overdueTasksCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const role = currentUser.role;

  // Navigation Items per Portal
  // Exactly matching Step Five for Admin & Manager
  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { id: 'overview', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'pipeline', label: 'Workflow', icon: Kanban, badge: '10-Stage' },
        { id: 'deliverable_tracker', label: 'Monthly Deliverable Tracker', icon: CheckSquare },
        { id: 'clients', label: 'Client Management', icon: Briefcase },
        { id: 'employees', label: 'Creative Team & Performance', icon: Users },
        {
          id: 'projects_tasks',
          label: 'Projects & Tasks',
          icon: FolderOpen,
          badge: overdueTasksCount > 0 ? `${overdueTasksCount} overdue` : undefined,
          badgeColor: 'bg-rose-100 text-rose-700',
        },
        {
          id: 'approvals',
          label: 'Client Approvals & Revisions',
          icon: FileCheck2,
          badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} pending` : undefined,
          badgeColor: 'bg-amber-100 text-amber-700',
        },
        { id: 'reports', label: 'Financial & Contract Reports', icon: BarChart3 },
        { id: 'users', label: 'User Accounts & Invitations', icon: UserPlus },
        { id: 'audit', label: 'Security & Audit Logs', icon: History },
      ];
    }

    if (role === 'manager') {
      return [
        { id: 'overview', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'pipeline', label: 'Workflow', icon: Kanban, badge: '10-Stage' },
        { id: 'deliverable_tracker', label: 'Monthly Deliverable Tracker', icon: CheckSquare },
        { id: 'clients', label: 'Client Management', icon: Briefcase },
        { id: 'employees', label: 'Creative Team & Performance', icon: Users },
        {
          id: 'projects_tasks',
          label: 'Projects & Tasks',
          icon: FolderOpen,
          badge: overdueTasksCount > 0 ? `${overdueTasksCount} overdue` : undefined,
          badgeColor: 'bg-rose-100 text-rose-700',
        },
        {
          id: 'approvals',
          label: 'Client Approvals & Revisions',
          icon: FileCheck2,
          badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} pending` : undefined,
          badgeColor: 'bg-amber-100 text-amber-700',
        },
        { id: 'reports', label: 'Financial & Contract Reports', icon: BarChart3 },
        { id: 'users', label: 'User Accounts & Invitations', icon: UserPlus },
        { id: 'audit', label: 'Security & Audit Logs', icon: History },
      ];
    }

    if (role === 'employee') {
      return [
        { id: 'my_tasks', label: 'My Assigned Tasks', icon: CheckSquare },
        { id: 'projects_tasks', label: 'Projects & Kanban Board', icon: FolderOpen },
        { id: 'submit_work', label: 'Submit Completed Work', icon: UploadCloud },
        { id: 'feedback_revisions', label: 'Revisions & Feedback', icon: MessageSquareWarning },
        { id: 'my_deliverables', label: 'Assigned Deliverables', icon: Layers },
        { id: 'activity', label: 'My Activity & Output', icon: History },
      ];
    }

    // Client Portal
    return [
      { id: 'client_dashboard', label: 'Client Workspace', icon: LayoutDashboard },
      { id: 'commitment_tracker', label: 'Monthly Commitment Progress', icon: Award },
      {
        id: 'approvals',
        label: 'Review & Approvals',
        icon: FileCheck2,
        badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} to review` : undefined,
        badgeColor: 'bg-purple-100 text-purple-700',
      },
      { id: 'calendar', label: 'Content Calendar & Schedule', icon: Calendar },
      { id: 'asset_library', label: 'Authorized Deliverables', icon: FolderOpen },
    ];
  };

  const navItems = getNavItems();

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
      {/* Brand & Portal Type Box */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center shadow-sm shrink-0">
              <img src="/rahi-logo.png" alt="RAHI Flowdesk" className="w-7 h-auto max-h-7 object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-wider uppercase">
                RAHI FLOWDESK
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
                BY RAHI CREATIVE MEDIA
              </p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tagline */}
        <p className="text-[11px] text-slate-400 mt-2 font-normal italic leading-snug">
          One Workspace. Every Creative Workflow.
        </p>

        {/* Portal Scope Tag */}
        <div className="mt-3.5 p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium capitalize">{role} Portal</span>
          </div>
          <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-semibold uppercase">
            {role === 'admin' || role === 'manager' ? 'Full Admin' : role}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Equal Admin Permissions Notice */}
      {hasFullAdminAccess(currentUser) && (
        <div className="p-3.5 m-3 bg-slate-800/70 border border-slate-700/60 rounded-xl text-left">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Equal Permissions</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
            Admin and Manager share identical <strong>FULL_ADMIN_ACCESS</strong> permissions across all company data.
          </p>
        </div>
      )}

      {/* Current User Footbar */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="truncate">
          <div className="font-semibold text-slate-200 truncate">{currentUser.name}</div>
          <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 ml-2" title="Active Session" />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Responsive Navigation) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Slide-in panel */}
          <div className="relative z-10 flex h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
