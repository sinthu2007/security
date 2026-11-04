import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Activity,
  Layers,
  Server,
  RefreshCw,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { formatDate, formatDuration } from '../utils/formatters';
import { getGradeBadgeColor } from '../utils/severityColors';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await adminService.getDashboard();
      setData(res);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading && !data) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-400 mt-3 font-mono">LOADING ADMIN TELEMETRY...</p>
      </div>
    );
  }

  const { metrics, queue, vulnerabilities, recentScans } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-amber-500/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900">
              Administrator Command Console
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase">
              ROOT SOC
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            System-wide user governance, distributed queue monitoring, and global threat statistics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            className="p-2.5 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-400 hover:text-white border border-navy-700 transition"
            title="Refresh Admin Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <Link
            to="/admin/users"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs uppercase tracking-wider transition"
          >
            <Users className="w-4 h-4" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* Global Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Registered Accounts</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 font-mono">
              {metrics?.totalUsers || 0}
            </span>
            <span className="text-[11px] text-slate-400">total</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-semibold">
            {metrics?.activeUsers || 0} active operators
          </div>
        </div>

        {/* Global Scans */}
        <div className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">System Scans</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 font-mono">
              {metrics?.totalScans || 0}
            </span>
            <span className="text-[11px] text-slate-400">runs</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {metrics?.completedScans || 0} completed • {metrics?.failedScans || 0} failed
          </div>
        </div>

        {/* Monitored Websites */}
        <div className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Monitored Domains</span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 font-mono">
              {metrics?.totalWebsites || 0}
            </span>
            <span className="text-[11px] text-slate-400">targets</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Registered by all organizations
          </div>
        </div>

        {/* Scan Queue Status */}
        <div className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Job Processing Queue</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-extrabold text-white light:text-slate-900 font-mono truncate">
              {queue?.driver || 'Async Queue'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-400 font-mono flex items-center gap-2">
            <span>Waiting: {queue?.waiting ?? 0}</span>
            <span>•</span>
            <span>Active: {queue?.active ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Global Vulnerabilities Strip */}
      <div className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 light:text-slate-700 uppercase tracking-wider font-mono">
          System-Wide Vulnerability Aggregates
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
            <div className="text-[10px] font-bold text-rose-400">CRITICAL</div>
            <div className="text-xl font-bold font-mono text-white light:text-slate-900 mt-1">
              {vulnerabilities?.criticalTotal || 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center">
            <div className="text-[10px] font-bold text-pink-400">HIGH</div>
            <div className="text-xl font-bold font-mono text-white light:text-slate-900 mt-1">
              {vulnerabilities?.highTotal || 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <div className="text-[10px] font-bold text-amber-400">MEDIUM</div>
            <div className="text-xl font-bold font-mono text-white light:text-slate-900 mt-1">
              {vulnerabilities?.mediumTotal || 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
            <div className="text-[10px] font-bold text-sky-400">LOW</div>
            <div className="text-xl font-bold font-mono text-white light:text-slate-900 mt-1">
              {vulnerabilities?.lowTotal || 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-slate-400">INFORMATIONAL</div>
            <div className="text-xl font-bold font-mono text-white light:text-slate-900 mt-1">
              {vulnerabilities?.informationalTotal || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Global Scans Live Feed */}
      <div className="rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-navy-800 light:border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white light:text-slate-900">
            System Assessment Feed (All Users)
          </h3>
          <span className="text-[10px] font-mono text-slate-400">REAL-TIME PLATFORM AUDIT LOG</span>
        </div>

        {(!recentScans || recentScans.length === 0) ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No system scan records available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/60 light:bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-mono border-b border-navy-800 light:border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Target Domain</th>
                  <th className="px-5 py-3.5 font-bold">User / Owner</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold">Grade</th>
                  <th className="px-5 py-3.5 font-bold">Score</th>
                  <th className="px-5 py-3.5 font-bold">Timestamp</th>
                  <th className="px-5 py-3.5 font-bold text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 light:divide-slate-100">
                {recentScans.map((scan: any) => {
                  const gradeInfo = getGradeBadgeColor(scan.securityGrade);
                  return (
                    <tr key={scan._id} className="hover:bg-navy-850/50 light:hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 font-bold text-white light:text-slate-900">
                        {scan.domain}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        <div className="font-semibold text-slate-200 light:text-slate-800">
                          {scan.userId?.name || 'Anonymous Operator'}
                        </div>
                        <div className="text-[10px] text-slate-500">{scan.userId?.email || 'N/A'}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-navy-800 text-slate-300">
                          {scan.scanStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-extrabold ${gradeInfo.bg} ${gradeInfo.text} border ${gradeInfo.border}`}>
                          {scan.securityGrade}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-200 light:text-slate-800">
                        {scan.riskScore}/100
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                        {formatDate(scan.startedAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to={`/scans/${scan._id}`}
                          className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-cyan-400 inline-flex transition"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
