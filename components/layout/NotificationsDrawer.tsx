import React from 'react';
import { X, CheckCircle, Clock, AlertTriangle, FileVideo, MessageSquare, ArrowRight } from 'lucide-react';
import { NotificationItem } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id?: string) => void;
  onNavigateToItem?: (item: NotificationItem) => void;
}

export function NotificationsDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onNavigateToItem,
}: NotificationsDrawerProps) {
  if (!isOpen) return null;

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'client_revision':
        return <AlertTriangle className="w-4 h-4 text-black" />;
      case 'client_approval':
      case 'published':
        return <CheckCircle className="w-4 h-4 text-black" />;
      case 'submission':
      case 'internal_review':
        return <FileVideo className="w-4 h-4 text-black" />;
      case 'assignment':
        return <Clock className="w-4 h-4 text-black" />;
      default:
        return <MessageSquare className="w-4 h-4 text-black" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-neutral-200 flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Notifications</h3>
              <p className="text-xs text-neutral-500">
                {notifications.filter((n) => !n.read).length} unread updates
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onMarkRead()}
                className="text-xs font-semibold text-neutral-900 hover:text-black hover:bg-neutral-200 px-2.5 py-1 rounded-md transition-colors"
              >
                Mark all read
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 p-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-sm">
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) onMarkRead(notif.id);
                    if (onNavigateToItem) onNavigateToItem(notif);
                  }}
                  className={`p-3.5 rounded-lg transition-colors cursor-pointer text-left flex items-start gap-3 ${
                    notif.read ? 'bg-white hover:bg-neutral-50 opacity-80' : 'bg-neutral-100 hover:bg-neutral-200/80 border-l-4 border-black'
                  }`}
                >
                  <div className="mt-0.5 p-2 bg-white rounded-lg border border-neutral-200 shadow-2xs">
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-neutral-900 truncate">{notif.title}</h4>
                      <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                        {formatDateTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    {notif.relatedId && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-neutral-900 font-semibold mt-1.5 hover:underline">
                        View item <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
