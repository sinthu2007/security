import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  FileText,
  GitCompare,
  Trash2,
  ArrowUpRight,
  Shield,
  PlayCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { reportService } from '../services/reportService';
import { IScan } from '../types';
import { formatDate, formatDuration } from '../utils/formatters';
import { getGradeBadgeColor } from '../utils/severityColors';

export const ScanHistoryPage: React.FC = () => {
  const [scans, setScans] = useState<IScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const data = await scanService.getUserScans({
        q: searchQuery,
        status: statusFilter,
        grade: gradeFilter,
        limit: 100,
      });
      setScans(data.scans || []);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [statusFilter, gradeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchScans();
  };

  const handleDelete = async (scanId: string, domain: string) => {
    if (!window.confirm(`Are you sure you want to delete scan record for ${domain}?`)) {
      return;
    }

    try {
      await scanService.deleteScan(scanId);
      setScans(prev => prev.filter(s => s._id !== scanId));
    } catch (err: any) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDownloadPdf = async (scanId: string, domain: string) => {
    setDownloadingId(scanId);
    try {
      await reportService.downloadReportBlob(scanId, `aegis-security-report-${domain}.pdf`);
    } catch (err: any) {
      alert('Report download error: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900">
              Security Assessment History
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete archive of your past non-invasive audits, score trends, and downloadable reports
          </p>
        </div>

        <Link
          to="/scan/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-glow-cyan transition"
        >
          <PlayCircle className="w-4 h-4" />
          <span>New Assessment</span>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by target domain or URL..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-200 light:text-slate-800 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-200 light:text-slate-800 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="RUNNING">Running</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-200 light:text-slate-800 focus:outline-none"
          >
            <option value="">All Grades</option>
            <option value="A+">Grade A+</option>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
            <option value="F">Grade F</option>
          </select>

          {(searchQuery || statusFilter || gradeFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setGradeFilter('');
              }}
              className="p-2 rounded-xl text-xs text-slate-400 hover:text-white"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scans Table */}
      <div className="rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 mt-3 font-mono">LOADING AUDIT ARCHIVE...</p>
          </div>
        ) : scans.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Shield className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-300 light:text-slate-700">No Assessment Records Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No security scans matched your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/60 light:bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-mono border-b border-navy-800 light:border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Target Website</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold">Risk Score</th>
                  <th className="px-5 py-3.5 font-bold">Security Grade</th>
                  <th className="px-5 py-3.5 font-bold">Vulnerabilities</th>
                  <th className="px-5 py-3.5 font-bold">Execution Date</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 light:divide-slate-100">
                {scans.map((scan) => {
                  const gradeInfo = getGradeBadgeColor(scan.securityGrade);
                  return (
                    <tr
                      key={scan._id}
                      className="hover:bg-navy-850/60 dark:hover:bg-navy-850/60 light:hover:bg-slate-50 transition"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/scans/${scan._id}`}
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
                          {scan.scanStatus}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-mono font-bold text-slate-200 light:text-slate-800">
                        {scan.riskScore} / 100
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-mono font-extrabold ${gradeInfo.bg} ${gradeInfo.text} border ${gradeInfo.border}`}
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
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/scans/${scan._id}`}
                            className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-cyan-400 transition"
                            title="View Report Findings"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>

                          {scan.scanStatus === 'COMPLETED' && (
                            <button
                              onClick={() => handleDownloadPdf(scan._id, scan.domain)}
                              disabled={downloadingId === scan._id}
                              className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white transition"
                              title="Download PDF Report"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          <Link
                            to={`/scans/compare?scanId1=${scan._id}`}
                            className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white transition"
                            title="Compare Scan"
                          >
                            <GitCompare className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleDelete(scan._id, scan.domain)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
