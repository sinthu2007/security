import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlayCircle,
  Globe,
  History,
  GitCompare,
  FileText,
  ShieldAlert,
  Users,
  User,
  Bell,
  Activity,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();
  const { unreadCount } = useNotifications();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition duration-150 ${
      isActive
        ? 'bg-cyan-500/10 text-cyan-400 font-semibold border-l-2 border-cyan-400'
        : 'text-slate-400 hover:text-slate-200 hover:bg-navy-850 dark:hover:bg-navy-850 light:hover:bg-slate-100'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-navy-900/95 dark:bg-navy-900/95 light:bg-white border-r border-navy-800 dark:border-navy-800 light:border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Mobile Header with close button */}
          <div className="flex md:hidden items-center justify-between p-4 border-b border-navy-800 dark:border-navy-800 light:border-slate-100">
            <span className="font-extrabold text-sm tracking-tight text-white light:text-slate-900">
              AEGIS<span className="text-cyan-400">GUARD</span>
            </span>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-6">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold px-3 mb-2">
                Security Operations
              </div>
              <nav className="space-y-1">
                <NavLink to="/dashboard" className={navItemClass} onClick={onClose}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>

                <NavLink to="/scan/new" className={navItemClass} onClick={onClose}>
                  <PlayCircle className="w-4 h-4 text-cyan-400" />
                  <span>Start Security Scan</span>
                </NavLink>

                <NavLink to="/websites" className={navItemClass} onClick={onClose}>
                  <Globe className="w-4 h-4" />
                  <span>Monitored Targets</span>
                </NavLink>

                <NavLink to="/scans" className={navItemClass} onClick={onClose}>
                  <History className="w-4 h-4" />
                  <span>Scan History</span>
                </NavLink>

                <NavLink to="/scans/compare" className={navItemClass} onClick={onClose}>
                  <GitCompare className="w-4 h-4" />
                  <span>Compare Assessments</span>
                </NavLink>

                <NavLink to="/reports" className={navItemClass} onClick={onClose}>
                  <FileText className="w-4 h-4" />
                  <span>Security PDF Reports</span>
                </NavLink>
              </nav>
            </div>

            {/* Admin Management Section */}
            {isAdmin && (
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-500/80 font-bold px-3 mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>Admin Controls</span>
                </div>
                <nav className="space-y-1">
                  <NavLink to="/admin" end className={navItemClass} onClick={onClose}>
                    <Activity className="w-4 h-4" />
                    <span>System Analytics</span>
                  </NavLink>
                  <NavLink to="/admin/users" className={navItemClass} onClick={onClose}>
                    <Users className="w-4 h-4" />
                    <span>User Management</span>
                  </NavLink>
                </nav>
              </div>
            )}

            {/* User Preferences */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold px-3 mb-2">
                Account & Center
              </div>
              <nav className="space-y-1">
                <NavLink to="/profile" className={navItemClass} onClick={onClose}>
                  <User className="w-4 h-4" />
                  <span>Profile & Security</span>
                </NavLink>

                <NavLink to="/notifications" className={navItemClass} onClick={onClose}>
                  <div className="relative">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </div>
                  <span className="flex-1">Alerts & Logs</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 font-bold">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              </nav>
            </div>
          </div>
        </div>

        {/* Footer info: Scanner Engine Daemon status */}
        <div className="p-4 border-t border-navy-800 dark:border-navy-800 light:border-slate-100">
          <div className="rounded-lg p-3 bg-navy-950 dark:bg-navy-950 light:bg-slate-50 border border-navy-800 dark:border-navy-800 light:border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono font-semibold text-slate-300 light:text-slate-800">
                ENGINE ONLINE
              </span>
            </div>
            <p className="text-[10px] text-slate-500 light:text-slate-500">
              Safe Assessment Mode (Non-invasive RFC/OWASP checks)
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
