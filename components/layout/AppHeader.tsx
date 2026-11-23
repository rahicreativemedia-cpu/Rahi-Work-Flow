import React from 'react';
import {
  Bell,
  RotateCcw,
  ShieldCheck,
  Menu,
  LogOut,
} from 'lucide-react';
import { User } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';

interface AppHeaderProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onResetDB: () => void;
  activePortal: 'admin' | 'manager' | 'employee' | 'client';
  onToggleMobileMenu?: () => void;
  onLogout?: () => void;
}

export function AppHeader({
  currentUser,
  allUsers,
  onSwitchUser,
  unreadNotifsCount,
  onOpenNotifications,
  onResetDB,
  activePortal,
  onToggleMobileMenu,
  onLogout,
}: AppHeaderProps) {
  const portalLabels = {
    admin: { name: 'ADMIN PORTAL', color: 'bg-black text-white border border-black' },
    manager: { name: 'MANAGER PORTAL', color: 'bg-neutral-900 text-white border border-black' },
    employee: { name: 'EMPLOYEE PORTAL', color: 'bg-neutral-800 text-white border border-neutral-700' },
    client: { name: 'CLIENT PORTAL', color: 'bg-neutral-800 text-white border border-neutral-700' },
  };

  const currentPortalConfig = portalLabels[activePortal];
  const hasAdminEqual = hasFullAdminAccess(currentUser);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Hamburger (mobile) + Brand & Portal Badge */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 p-1 flex items-center justify-center shadow-xs shrink-0">
            <img src="/rahi-logo.png" alt="RAHI Flowdesk" className="w-7 h-auto max-h-7 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                RAHI Flowdesk
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-sm uppercase ${currentPortalConfig.color}`}
              >
                {currentPortalConfig.name}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
              RAHI Creative Media
            </p>
          </div>
        </div>

        {/* Equal Admin Notice Banner (For Admin & Manager) */}
        {hasAdminEqual && (
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-[11px] font-medium text-neutral-800">
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            <span>
              Equal Rights: <strong>FULL_ADMIN_ACCESS</strong>
            </span>
          </div>
        )}
      </div>

      {/* Right Controls: Notifications, User & Logout */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Reset Database Button */}
        <button
          onClick={onResetDB}
          title="Reset database to fresh seed state"
          className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors border border-transparent hover:border-neutral-200"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
              {unreadNotifsCount}
            </span>
          )}
        </button>

        {/* User Avatar & Info */}
        <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
            {currentUser.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-neutral-900 leading-tight truncate max-w-[120px]">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-neutral-400 font-medium capitalize truncate">
              {currentUser.role === 'admin'
                ? 'Executive Director'
                : currentUser.role === 'manager'
                ? 'Operations Manager'
                : currentUser.role === 'employee'
                ? currentUser.department
                : currentUser.clientName}
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out to Login Screen"
              className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors border border-transparent hover:border-neutral-200 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
