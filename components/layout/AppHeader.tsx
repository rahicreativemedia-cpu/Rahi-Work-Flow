import React from 'react';
import {
  Bell,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  Layers,
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
    admin: { name: 'ADMIN PORTAL', color: 'bg-indigo-600 text-white' },
    manager: { name: 'MANAGER PORTAL', color: 'bg-blue-600 text-white' },
    employee: { name: 'EMPLOYEE PORTAL', color: 'bg-emerald-600 text-white' },
    client: { name: 'CLIENT PORTAL', color: 'bg-purple-600 text-white' },
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
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>
              Equal Rights: <strong>FULL_ADMIN_ACCESS</strong>
            </span>
          </div>
        )}
      </div>

      {/* Right Controls: Persona Switcher (Dev Mode Only), Reset, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Switch Persona / Portal Dropdown (STRICTLY DISABLED IN PRODUCTION) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="relative group">
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-900 transition-colors cursor-pointer" title="Development Testing Persona Switcher">
              <Layers className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="hidden sm:inline font-bold text-[10px] uppercase bg-amber-200/80 px-1 rounded text-amber-800">DEV</span>
              <span className="font-semibold text-amber-900 truncate max-w-[100px] sm:max-w-[120px]">
                {currentUser.name}
              </span>
              <ChevronDown className="w-3 h-3 text-amber-600 shrink-0" />
            </div>

            <div className="absolute right-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 hidden group-hover:block z-50">
              <div className="px-2 py-1.5 text-[11px] font-semibold text-amber-800 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                <span>Dev Persona Switcher</span>
                <span className="text-[9px] bg-amber-100 px-1 py-0.5 rounded text-amber-700 font-bold">DEV ONLY</span>
              </div>

              <div className="py-1 space-y-0.5 max-h-72 overflow-y-auto">
                {allUsers.map((u) => {
                  const isSelected = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => onSwitchUser(u)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200/60'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600 shrink-0">
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="truncate max-w-[130px] font-medium">{u.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {u.role === 'admin'
                              ? 'Admin (Executive)'
                              : u.role === 'manager'
                              ? 'Manager (Equal Admin)'
                              : u.role === 'employee'
                              ? `Creative • ${u.department}`
                              : `Client • ${u.clientName || 'Partner'}`}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase shrink-0 ${
                          u.role === 'admin'
                            ? 'bg-indigo-100 text-indigo-700'
                            : u.role === 'manager'
                            ? 'bg-blue-100 text-blue-700'
                            : u.role === 'employee'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Reset Database Button */}
        <button
          onClick={onResetDB}
          title="Reset database to fresh seed state"
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/60"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
              {unreadNotifsCount}
            </span>
          )}
        </button>

        {/* User Avatar & Info */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
            {currentUser.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-400 font-medium capitalize truncate">
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
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
