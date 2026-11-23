import React from 'react';
import {
  LayoutGrid,
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
  ShieldCheck,
  Layers,
  Settings,
  HelpCircle,
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

  // Primary top navigation items per portal
  const getPrimaryNavItems = () => {
    if (role === 'admin' || role === 'manager') {
      return [
        { id: 'overview', label: 'Executive Dashboard', icon: LayoutGrid },
        { id: 'projects_tasks', label: 'Projects & Tasks', icon: FolderOpen, badge: overdueTasksCount > 0 ? overdueTasksCount : undefined },
        { id: 'pipeline', label: '10-Stage Creative Workflow', icon: Kanban },
        { id: 'deliverable_tracker', label: 'Deliverable Tracker', icon: CheckSquare },
        { id: 'clients', label: 'Client Management', icon: Briefcase },
        { id: 'employees', label: 'Creative Team & Performance', icon: Users },
        { id: 'approvals', label: 'Review & Approvals', icon: FileCheck2, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined },
        { id: 'reports', label: 'Financial & Contract Reports', icon: BarChart3 },
      ];
    }

    if (role === 'employee') {
      return [
        { id: 'my_tasks', label: 'My Assigned Tasks', icon: LayoutGrid },
        { id: 'projects_tasks', label: 'Projects & Kanban Board', icon: FolderOpen },
        { id: 'submit_work', label: 'Submit Completed Work', icon: UploadCloud },
        { id: 'feedback_revisions', label: 'Revisions & Feedback', icon: MessageSquareWarning },
        { id: 'my_deliverables', label: 'Assigned Deliverables', icon: Layers },
        { id: 'activity', label: 'My Activity & Output', icon: History },
      ];
    }

    // Client Portal
    return [
      { id: 'client_dashboard', label: 'Client Workspace', icon: LayoutGrid },
      { id: 'commitment_tracker', label: 'Commitment Progress', icon: Award },
      { id: 'approvals', label: 'Review & Approvals', icon: FileCheck2, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined },
      { id: 'calendar', label: 'Content Calendar & Schedule', icon: Calendar },
      { id: 'asset_library', label: 'Master Deliverables Library', icon: FolderOpen },
    ];
  };

  // Secondary bottom items
  const getSecondaryNavItems = () => {
    if (role === 'admin' || role === 'manager') {
      return [
        { id: 'users', label: 'User Accounts & Invitations', icon: UserPlus },
        { id: 'audit', label: 'Security & Audit Logs', icon: ShieldCheck },
      ];
    }
    return [
      { id: 'help', label: 'Support & Help', icon: HelpCircle },
    ];
  };

  const primaryItems = getPrimaryNavItems();
  const secondaryItems = getSecondaryNavItems();

  const handleItemClick = (id: string) => {
    if (id === 'help') return;
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Liquid Glass Floating Minimal Icon Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col items-center justify-between w-16 liquid-glass-sidebar rounded-3xl py-4 my-3 ml-4 shrink-0 z-20">
        {/* Top Navigation Group */}
        <div className="flex flex-col items-center gap-1.5 w-full px-2">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="relative group flex items-center justify-center">
                <button
                  onClick={() => handleItemClick(item.id)}
                  aria-label={item.label}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 relative ${
                    isActive
                      ? 'liquid-glass-active-nav scale-[1.02]'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                  {item.badge && (
                    <span className="w-2 h-2 rounded-full bg-[#ED1C24] absolute top-2 right-2 ring-2 ring-white/90" />
                  )}
                </button>

                {/* Hover Tooltip */}
                <div className="pointer-events-none absolute left-14 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pl-1 whitespace-nowrap">
                  <div className="px-2.5 py-1 bg-stone-900/90 backdrop-blur-md text-white text-[11px] font-semibold rounded-lg shadow-md flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="bg-[#ED1C24] text-white px-1.5 py-0.2 rounded-full text-[9px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Utility Group */}
        <div className="flex flex-col items-center gap-1.5 w-full px-2 pt-2 border-t border-white/60">
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="relative group flex items-center justify-center">
                <button
                  onClick={() => handleItemClick(item.id)}
                  aria-label={item.label}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'liquid-glass-active-nav scale-[1.02]'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                </button>

                {/* Hover Tooltip */}
                <div className="pointer-events-none absolute left-14 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pl-1 whitespace-nowrap">
                  <div className="px-2.5 py-1 bg-stone-900/90 backdrop-blur-md text-white text-[11px] font-semibold rounded-lg shadow-md">
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Mobile Drawer (Responsive Navigation) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Slide-in panel */}
          <div className="relative z-10 w-72 liquid-glass h-full p-5 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/80 p-1 flex items-center justify-center border border-white/80 shadow-2xs">
                    <img src="/rahi-logo.png" alt="RAHI Flowdesk" className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                      RAHI Flowdesk
                    </h3>
                    <p className="text-[10px] text-stone-500 font-medium capitalize">
                      {role} Portal
                    </p>
                  </div>
                </div>
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-800 hover:bg-white/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Links */}
              <nav className="mt-4 space-y-1">
                {primaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'liquid-glass-active-nav font-bold'
                          : 'text-stone-700 hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ED1C24] text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="pt-3 border-t border-white/60 mt-3 space-y-1">
                  {secondaryItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'liquid-glass-active-nav font-bold'
                            : 'text-stone-700 hover:bg-white/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>

            <div className="pt-4 border-t border-[#EAE6E1] text-xs text-stone-500 flex items-center justify-between">
              <div>
                <p className="font-semibold text-stone-900">{currentUser.name}</p>
                <p className="text-[10px] text-stone-400">{currentUser.email}</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
