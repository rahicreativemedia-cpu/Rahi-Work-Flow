import React, { useState } from 'react';
import {
  Bell,
  RotateCcw,
  ShieldCheck,
  Menu,
  LogOut,
  Search,
  Settings,
  Sparkles,
  ChevronDown,
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
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenProfileModal?: () => void;
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
  searchQuery = '',
  onSearchChange,
  onOpenProfileModal,
}: AppHeaderProps) {
  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);
  const hasAdminEqual = hasFullAdminAccess(currentUser);

  const roleSubtitle =
    currentUser.role === 'admin'
      ? 'Executive Director'
      : currentUser.role === 'manager'
      ? 'Ops Manager'
      : currentUser.role === 'employee'
      ? currentUser.department || 'Creative Lead'
      : currentUser.clientName || 'Client Partner';

  return (
    <header className="w-full liquid-glass-header px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shrink-0 z-30 transition-all">
      {/* Left: Brand Logo + Planex-Style Search Input */}
      <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-full liquid-glass-pill text-stone-700"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl liquid-glass-pill p-1 flex items-center justify-center shadow-2xs">
            <img src="/rahi-logo.png" alt="RAHI Flowdesk" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-extrabold text-stone-900 text-base tracking-tight hidden sm:inline-block">
            RAHI Flowdesk
          </span>
        </div>

        {/* Planex Global Search Pill */}
        <div className="relative flex items-center flex-1 max-w-xs sm:max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search projects, tasks, members..."
            className="w-full liquid-glass-pill rounded-full pl-10 pr-4 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#ED1C24]/15 focus:border-[#ED1C24]/30 transition-all"
          />
        </div>
      </div>

      {/* Right: User Profile, Notifications, Settings & Logout */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Equal Admin Badge (Discreet) */}
        {hasAdminEqual && (
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-pill text-[11px] font-semibold text-stone-700">
            <ShieldCheck className="w-3.5 h-3.5 text-[#ED1C24]" />
            <span>FULL ADMIN</span>
          </div>
        )}

        {/* User Profile Card (Reference Style) */}
        <div className="relative">
          <button
            onClick={() => setIsSwitchUserOpen((prev) => !prev)}
            className="flex items-center gap-2.5 liquid-glass-pill rounded-full p-1 pr-3 transition text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#1C1917] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden md:block leading-tight">
              <div className="text-xs font-bold text-stone-900 truncate max-w-[120px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-stone-400 font-medium truncate">
                {roleSubtitle}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
          </button>

          {/* Quick Switch User Menu */}
          {isSwitchUserOpen && (
            <div className="absolute right-0 mt-2 w-56 liquid-glass rounded-2xl shadow-xl p-2 z-50">
              {hasAdminEqual && onOpenProfileModal && (
                <div className="p-1 border-b border-stone-200/50 mb-1">
                  <button
                    onClick={() => {
                      setIsSwitchUserOpen(false);
                      onOpenProfileModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-800 hover:bg-white/80 flex items-center gap-2 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#ED1C24]" />
                    <span>My Account & Password</span>
                  </button>
                </div>
              )}
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-200/50">
                Switch Test Role
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5 mt-1">
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u);
                      setIsSwitchUserOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      currentUser.id === u.id
                        ? 'bg-[#1C1917] text-white font-semibold'
                        : 'text-stone-700 hover:bg-white/60'
                    }`}
                  >
                    <span className="truncate">{u.name}</span>
                    <span className="text-[10px] uppercase opacity-75">{u.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings / Credential Management for Admin & Manager */}
        {hasAdminEqual && onOpenProfileModal && (
          <button
            onClick={onOpenProfileModal}
            title="Profile & Credential Settings"
            aria-label="Profile and Credentials"
            className="w-9 h-9 rounded-full liquid-glass-pill text-stone-700 hover:text-black flex items-center justify-center transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Notification Bell (Circular Glass Button) */}
        <button
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-full liquid-glass-pill text-stone-700 flex items-center justify-center"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#ED1C24] text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
              {unreadNotifsCount}
            </span>
          )}
        </button>

        {/* Database Reset / Maintenance */}
        <button
          onClick={onResetDB}
          title="Reset database to seed"
          aria-label="Reset database"
          className="w-9 h-9 rounded-full liquid-glass-pill text-stone-600 hover:text-black flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Logout (Circular Glass Button) */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out"
            aria-label="Sign Out"
            className="w-9 h-9 rounded-full liquid-glass-pill hover:text-[#ED1C24] text-stone-600 flex items-center justify-center"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
