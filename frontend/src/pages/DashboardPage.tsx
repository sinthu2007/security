import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  PlayCircle,
  FileText,
  Activity,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Clock,
  Layers,
  CheckCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { scanService } from '../services/scanService';
import { reportService } from '../services/reportService';
import { IDashboardStats, SecurityGrade } from '../types';
import { formatDate, formatDuration } from '../utils/formatters';
import { getGradeBadgeColor, getSeverityBadgeClass } from '../utils/severityColors';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await scanService.getDashboardStats();
      setStats(data);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDownloadPdf = async (scanId: string, domain: string) => {
    setDownloadingId(scanId);
    try {
      await reportService.downloadReportBlob(scanId, `aegis-report-${domain}.pdf`);
    } catch (err: any) {
      alert('Report download error: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-mono text-cyan-400">LOADING METRICS & SCAN ARCHIVE...</span>
      </div>
    );
  }

  const score = stats?.averageScore ?? 100;
  const grade: SecurityGrade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';
  const gradeStyling = getGradeBadgeColor(grade);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-navy-750 light:border-slate-200 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900">
              Security Operations Dashboard
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase">
              LIVE DATA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security telemetry from your authorized targets & automated scans
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchStats}
            className="p-2.5 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-400 hover:text-white border border-navy-700 transition"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <Link
            to="/scan/new"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-glow-cyan transition duration-200"
          >
            <PlayCircle className="w-4 h-4" />
            <span>New Security Scan</span>
          </Link>
        </div>
      </div>

      {/* Top Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Scans</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 font-mono">
              {stats?.totalScans || 0}
            </span>
            <span className="text-[11px] text-slate-400">executed</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{stats?.completedScans || 0} completed</span>
            <span>•</span>
            <span className="text-rose-400 font-semibold">{stats?.failedScans || 0} failed</span>
          </div>
        </div>

        {/* Monitored & Secure Websites */}
        <div className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Monitored Targets</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 font-mono">
              {stats?.monitoredTargetsCount || 0}
            </span>
            <span className="text-[11px] text-slate-400">domains</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{stats?.secureWebsites || 0} grade A / A+ secure</span>
          </div>
        </div>

        {/* Vulnerabilities Found */}
        <div className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Identified Weaknesses</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 font-mono">
              {stats?.totalVulnerabilitiesFound || 0}
            </span>
            <span className="text-[11px] text-slate-400">active</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-400 font-semibold flex items-center gap-1">
            <span>{stats?.criticalTotal || 0} critical, {stats?.highTotal || 0} high</span>
          </div>
        </div>

        {/* Average Risk Score & Grade */}
        <div className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Security Health Grade</span>
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 font-mono">
                {score}
              </span>
              <span className="text-[11px] text-slate-400">/ 100</span>
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-sm font-extrabold ${gradeStyling.bg} ${gradeStyling.text} border ${gradeStyling.border} shadow-sm font-mono`}>
              {grade}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Average across latest completed scans
          </div>
        </div>
      </div>

      {/* Severity Breakdown Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
          <div className="text-xs font-bold text-rose-400">CRITICAL</div>
          <div className="text-xl font-extrabold font-mono text-white light:text-slate-900 mt-1">
            {stats?.criticalTotal || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Immediate action</div>
        </div>

        <div className="p-3.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center">
          <div className="text-xs font-bold text-pink-400">HIGH RISK</div>
          <div className="text-xl font-extrabold font-mono text-white light:text-slate-900 mt-1">
            {stats?.highTotal || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">High priority</div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <div className="text-xs font-bold text-amber-400">MEDIUM RISK</div>
          <div className="text-xl font-extrabold font-mono text-white light:text-slate-900 mt-1">
            {stats?.mediumTotal || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Remediation advised</div>
        </div>

        <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
          <div className="text-xs font-bold text-sky-400">LOW RISK</div>
          <div className="text-xl font-extrabold font-mono text-white light:text-slate-900 mt-1">
            {stats?.lowTotal || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Minor weaknesses</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center col-span-2 sm:col-span-1">
          <div className="text-xs font-bold text-slate-400">INFORMATIONAL</div>
          <div className="text-xl font-extrabold font-mono text-white light:text-slate-900 mt-1">
            {stats?.informationalTotal || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Good practices</div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 7-Day Activity Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white light:text-slate-900">
                Scan Activity Trend
              </h3>
              <p className="text-[11px] text-slate-400">Daily assessment frequency over the last 7 days</p>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-navy-800 text-slate-300">
              7 DAYS
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.activityChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00f2fe" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a101f',
                    border: '1px solid #1e345e',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="scans" stroke="#00f2fe" strokeWidth={2} fillOpacity={1} fill="url(#scanGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vulnerability Distribution Chart */}
        <div className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white light:text-slate-900">
              Vulnerability Distribution
            </h3>
            <p className="text-[11px] text-slate-400">Active observations by severity class</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.vulnerabilityDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a101f',
                    border: '1px solid #1e345e',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(stats?.vulnerabilityDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-navy-800 light:border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white light:text-slate-900">
              Recent Security Assessments
            </h3>
            <p className="text-[11px] text-slate-400">Latest automated URL audits conducted by your account</p>
          </div>
          <Link
            to="/scans"
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>View Full Archive</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!stats?.recentScans || stats.recentScans.length === 0) ? (
          <div className="py-14 text-center space-y-3">
            <Shield className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-300 light:text-slate-700">No Security Scans Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Launch your first automated assessment against an authorized website to view vulnerability metrics.
            </p>
            <Link
              to="/scan/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-navy-950 text-xs font-bold shadow-glow-cyan"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Start Assessment</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/60 light:bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-mono border-b border-navy-800 light:border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Target Domain</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold">Score</th>
                  <th className="px-5 py-3.5 font-bold">Grade</th>
                  <th className="px-5 py-3.5 font-bold">Issues (C/H/M/L)</th>
                  <th className="px-5 py-3.5 font-bold">Timestamp</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 light:divide-slate-100">
                {stats.recentScans.map((scan) => {
                  const itemGrade = getGradeBadgeColor(scan.securityGrade);
                  return (
                    <tr
                      key={scan.id}
                      className="hover:bg-navy-850/60 dark:hover:bg-navy-850/60 light:hover:bg-slate-50 transition"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/scans/${scan.id}`}
                          className="font-bold text-white light:text-slate-900 hover:text-cyan-400 transition"
                        >
                          {scan.domain}
                        </Link>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">
                          {scan.targetUrl}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            scan.scanStatus === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : scan.scanStatus === 'RUNNING'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse'
                              : scan.scanStatus === 'FAILED'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              scan.scanStatus === 'COMPLETED'
                                ? 'bg-emerald-400'
                                : scan.scanStatus === 'FAILED'
                                ? 'bg-rose-400'
                                : 'bg-cyan-400'
                            }`}
                          />
                          {scan.scanStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-200 light:text-slate-800">
                        {scan.riskScore} / 100
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-mono font-extrabold ${itemGrade.bg} ${itemGrade.text} border ${itemGrade.border}`}
                        >
                          {scan.securityGrade}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        <span className="text-rose-400 font-bold">{scan.summary?.critical || 0}</span> /{' '}
                        <span className="text-pink-400 font-bold">{scan.summary?.high || 0}</span> /{' '}
                        <span className="text-amber-400 font-bold">{scan.summary?.medium || 0}</span> /{' '}
                        <span className="text-sky-400">{scan.summary?.low || 0}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                        {formatDate(scan.startedAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/scans/${scan.id}`}
                            className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-cyan-400 hover:text-cyan-300 transition"
                            title="View Detailed Results"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                          {scan.scanStatus === 'COMPLETED' && (
                            <button
                              onClick={() => handleDownloadPdf(scan.id, scan.domain)}
                              disabled={downloadingId === scan.id}
                              className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white transition"
                              title="Download PDF Report"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                        </div>
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
