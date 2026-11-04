import React from 'react';
import { Bell, Check, Clock, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatDate } from '../utils/formatters';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900">
              Notification & Alert Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time notifications on completed assessments, verified domains, and system warnings
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-cyan-400 text-xs font-semibold border border-navy-700 transition"
          >
            <Check className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 overflow-hidden shadow-xl">
        {notifications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Bell className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white light:text-slate-900">No Notifications Available</h4>
            <p className="text-xs text-slate-400">You are all caught up on alerts and assessment reports.</p>
          </div>
        ) : (
          <div className="divide-y divide-navy-800/60 light:divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => !n.readStatus && markAsRead(n._id)}
                className={`p-5 flex items-start justify-between gap-4 transition cursor-pointer ${
                  !n.readStatus
                    ? 'bg-cyan-500/5 hover:bg-cyan-500/10'
                    : 'hover:bg-navy-850/50 light:hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 p-2 rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-800 light:border-slate-200 text-cyan-400 shrink-0">
                    {n.type === 'SCAN_COMPLETE' ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : n.type === 'SCAN_FAILED' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Bell className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white light:text-slate-900">
                        {n.title}
                      </h4>
                      {!n.readStatus && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 light:text-slate-700 mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(n.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {!n.readStatus && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(n._id);
                    }}
                    className="p-1 text-slate-500 hover:text-cyan-400 text-xs font-semibold shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
