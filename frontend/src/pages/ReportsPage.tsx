import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  ExternalLink,
  Shield,
  Clock,
  HardDrive,
  ArrowUpRight,
} from 'lucide-react';
import { reportService } from '../services/reportService';
import { IReport } from '../types';
import { formatDate } from '../utils/formatters';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<IReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const data = await reportService.getUserReports();
        setReports(data);
      } catch {
        // Handled
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleDownload = async (report: IReport) => {
    setDownloadingId(report._id);
    try {
      await reportService.downloadReportBlob(
        report._id,
        `${report.reportTitle.replace(/[^a-zA-Z0-9-_\.]/g, '_')}.pdf`
      );
    } catch (err: any) {
      alert('Download failed: ' + (err.response?.data?.message || err.message));
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
            <FileText className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900">
              Executive PDF Security Reports
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Downloadable audit reports containing technical evidence, risk grades, and remediation guidance
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 mt-3 font-mono">LOADING AUDIT REPORTS...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-navy-900/40 border border-navy-800 space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-white">No PDF Reports Generated Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Run an automated security scan to generate downloadable executive posture documentation.
          </p>
          <Link
            to="/scan/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-navy-950 font-bold text-xs uppercase shadow-glow-cyan"
          >
            Launch Assessment
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((report) => {
            const scan = typeof report.scanId === 'object' ? report.scanId : null;
            return (
              <div
                key={report._id}
                className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 hover:border-cyan-500/40 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                      PDF ARTIFACT
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formatDate(report.generatedAt)}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white light:text-slate-900 leading-snug">
                    {report.reportTitle}
                  </h3>

                  {scan && (
                    <div className="mt-3 p-2.5 rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-800 light:border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono truncate max-w-[150px]">{scan.domain}</span>
                      <span className="font-mono font-bold text-emerald-400">GRADE {scan.securityGrade}</span>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <HardDrive className="w-3 h-3" />
                      {Math.round((report.fileSize || 50000) / 1024)} KB
                    </span>
                    <span>•</span>
                    <span>Confidential Audit</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-navy-800 light:border-slate-100 flex items-center justify-between gap-2">
                  {scan && (
                    <Link
                      to={`/scans/${scan._id}`}
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>View Online</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  <button
                    onClick={() => handleDownload(report)}
                    disabled={downloadingId === report._id}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingId === report._id ? 'Downloading...' : 'Download PDF'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
