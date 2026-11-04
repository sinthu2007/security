import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  FileText,
  GitCompare,
  RotateCcw,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Globe,
  Clock,
  Server,
  Code,
  BookOpen,
  SlidersHorizontal,
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { reportService } from '../services/reportService';
import { IScan, ISecurityFinding, SeverityLevel } from '../types';
import { formatDate, formatDuration } from '../utils/formatters';
import { getGradeBadgeColor, getSeverityBadgeClass } from '../utils/severityColors';

export const ScanResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [scan, setScan] = useState<IScan | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;

    const fetchScan = async () => {
      setLoading(true);
      try {
        const data = await scanService.getScanById(id);
        setScan(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to retrieve scan report.');
      } finally {
        setLoading(false);
      }
    };

    fetchScan();
  }, [id]);

  const toggleExpand = (findingId: string) => {
    setExpandedFindings(prev => ({
      ...prev,
      [findingId]: !prev[findingId],
    }));
  };

  const handleDownloadPdf = async () => {
    if (!scan) return;
    setDownloadingPdf(true);
    try {
      await reportService.downloadReportBlob(scan._id, `aegis-security-report-${scan.domain}.pdf`);
    } catch (err: any) {
      alert('Failed to download report: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-400 mt-3 font-mono">COMPILING TECHNICAL FINDINGS...</p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="p-8 text-center rounded-2xl bg-navy-900/60 border border-navy-800 space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Scan Report Not Found</h3>
        <p className="text-xs text-slate-400">{error || 'Unable to load security findings.'}</p>
        <Link to="/dashboard" className="inline-block px-4 py-2 rounded-xl bg-cyan-500 text-navy-950 font-bold text-xs">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const gradeStyle = getGradeBadgeColor(scan.securityGrade);

  // Filter findings
  const filteredFindings = scan.findings.filter((f) => {
    const matchesSeverity = selectedSeverity === 'ALL' || f.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'ALL' || f.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      f.name.toLowerCase().includes(query) ||
      f.description.toLowerCase().includes(query) ||
      f.evidence.toLowerCase().includes(query) ||
      f.recommendation.toLowerCase().includes(query);

    return matchesSeverity && matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Overview Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-navy-900/90 light:bg-white border border-navy-750 light:border-slate-200 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Target Identity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                SECURITY REPORT #{scan._id.toString().substring(0, 8)}
              </span>
              <span className="text-[10px] text-slate-400">
                {formatDate(scan.startedAt)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 flex items-center gap-2">
              <span>{scan.domain}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5 font-mono">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate max-w-xs">{scan.targetUrl}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span>IP: {scan.resolvedIp || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Duration: {formatDuration(scan.durationSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Score & Grade Display */}
          <div className="flex items-center gap-5 p-4 rounded-xl bg-navy-950/80 light:bg-slate-50 border border-navy-800 light:border-slate-200">
            <div className="text-center">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                RISK SCORE
              </div>
              <div className="text-3xl font-extrabold text-white light:text-slate-900 font-mono mt-0.5">
                {scan.riskScore}
                <span className="text-xs text-slate-500 font-normal"> / 100</span>
              </div>
            </div>

            <div className="h-10 w-px bg-navy-800 light:bg-slate-200" />

            <div className="text-center">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                GRADE
              </div>
              <div className={`mt-0.5 px-3 py-1 rounded-lg text-2xl font-black font-mono ${gradeStyle.bg} ${gradeStyle.text} border ${gradeStyle.border} ${gradeStyle.glow}`}>
                {scan.securityGrade}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-6 pt-5 border-t border-navy-800 light:border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-glow-cyan transition disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{downloadingPdf ? 'Exporting PDF...' : 'Download PDF Report'}</span>
            </button>

            <Link
              to={`/scans/compare?scanId1=${scan._id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-200 font-medium text-xs border border-navy-700 transition"
            >
              <GitCompare className="w-4 h-4 text-cyan-400" />
              <span>Compare with Previous Scan</span>
            </Link>
          </div>

          <Link
            to={`/scan/new?target=${encodeURIComponent(scan.targetUrl)}`}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:underline font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-run Security Assessment</span>
          </Link>
        </div>
      </div>

      {/* Severity Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setSelectedSeverity('CRITICAL')}
          className={`p-3.5 rounded-xl border text-center transition ${
            selectedSeverity === 'CRITICAL'
              ? 'bg-rose-500/20 border-rose-500 shadow-glow-rose'
              : 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/50'
          }`}
        >
          <div className="text-xs font-bold text-rose-400">CRITICAL</div>
          <div className="text-xl font-extrabold font-mono text-white light:text-slate-900 mt-1">
            {scan.summary.critical}
          </div>
        </button>

        <button
          onClick={() => setSelectedSeverity('HIGH')}
          className={`p-3.5 rounded-xl border text-center transition ${
            selectedSeverity === 'HIGH'
              ? 'bg-pink-500/20 border-pink-500'
              : 'bg-pink-500/10 border-pink-500/20 hover:border-pink-500/50'
          }`}
        >
          <div className="text-xs font-bold text-pink-400">HIGH</div>
          <div className="text-xl font-extrabold font-mono text-white light:text-slate-900 mt-1">
            {scan.summary.high}
          </div>
        </button>

        <button
          onClick={() => setSelectedSeverity('MEDIUM')}
          className={`p-3.5 rounded-xl border text-center transition ${
            selectedSeverity === 'MEDIUM'
              ? 'bg-amber-500/20 border-amber-500 shadow-glow-amber'
              : 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50'
          }`}
        >
          <div className="text-xs font-bold text-amber-400">MEDIUM</div>
          <div className="text-xl font-extrabold font-mono text-white light:text-slate-900 mt-1">
            {scan.summary.medium}
          </div>
        </button>

        <button
          onClick={() => setSelectedSeverity('LOW')}
          className={`p-3.5 rounded-xl border text-center transition ${
            selectedSeverity === 'LOW'
              ? 'bg-sky-500/20 border-sky-500'
              : 'bg-sky-500/10 border-sky-500/20 hover:border-sky-500/50'
          }`}
        >
          <div className="text-xs font-bold text-sky-400">LOW</div>
          <div className="text-xl font-extrabold font-mono text-white light:text-slate-900 mt-1">
            {scan.summary.low}
          </div>
        </button>

        <button
          onClick={() => setSelectedSeverity('INFORMATIONAL')}
          className={`p-3.5 rounded-xl border text-center transition col-span-2 sm:col-span-1 ${
            selectedSeverity === 'INFORMATIONAL'
              ? 'bg-slate-500/20 border-slate-400'
              : 'bg-slate-500/10 border-slate-500/20 hover:border-slate-500/50'
          }`}
        >
          <div className="text-xs font-bold text-slate-400">INFO</div>
          <div className="text-xl font-extrabold font-mono text-white light:text-slate-900 mt-1">
            {scan.summary.informational}
          </div>
        </button>
      </div>

      {/* AI Executive Assessment Card */}
      {scan.aiAnalysis && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-navy-900 via-navy-850 to-navy-900 border border-cyan-500/30 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white light:text-slate-900">
              AI Security Posture Assessment & Priority Action Plan
            </h3>
          </div>

          <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed">
            {scan.aiAnalysis.executiveSummary}
          </p>

          <div className="p-4 rounded-xl bg-navy-950/70 light:bg-slate-50 border border-navy-800 light:border-slate-200">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
              Top Priority Remediation Roadmap
            </h4>
            <div className="space-y-2">
              {scan.aiAnalysis.topPriorityActions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 light:text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Findings Section */}
      <div className="space-y-4">
        {/* Filter / Search Bar */}
        <div className="p-4 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings by name, evidence, or remedy..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-200 light:text-slate-800 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-200 light:text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="SSL_TLS">SSL / TLS Transport</option>
              <option value="SECURITY_HEADERS">HTTP Security Headers</option>
              <option value="COOKIE_SECURITY">Cookie Security</option>
              <option value="DNS_SECURITY">DNS Security (SPF/DMARC)</option>
              <option value="INFORMATION_DISCLOSURE">Information Disclosure</option>
              <option value="CONFIGURATION">Configuration & Metadata</option>
            </select>

            {/* Severity Filter Reset */}
            {selectedSeverity !== 'ALL' && (
              <button
                onClick={() => setSelectedSeverity('ALL')}
                className="px-3 py-2 text-xs rounded-xl bg-navy-800 hover:bg-navy-750 text-cyan-400 font-semibold"
              >
                Clear Severity Filter
              </button>
            )}
          </div>
        </div>

        {/* Findings Count Summary */}
        <div className="flex items-center justify-between px-2 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white light:text-slate-900">{filteredFindings.length}</strong> of{' '}
            {scan.findings.length} findings
          </span>
          <button
            onClick={() => {
              const allExpanded = filteredFindings.every(f => expandedFindings[f.id]);
              const next: Record<string, boolean> = {};
              filteredFindings.forEach(f => {
                next[f.id] = !allExpanded;
              });
              setExpandedFindings(next);
            }}
            className="text-cyan-400 hover:underline text-[11px]"
          >
            {filteredFindings.every(f => expandedFindings[f.id]) ? 'Collapse All' : 'Expand All Details'}
          </button>
        </div>

        {/* Findings Cards List */}
        {filteredFindings.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-navy-900/40 border border-navy-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Findings Match Filter Criteria</h4>
            <p className="text-xs text-slate-400">Try adjusting your severity filter or search keywords.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFindings.map((finding) => {
              const isExpanded = !!expandedFindings[finding.id];
              const sevBadge = getSeverityBadgeClass(finding.severity);

              return (
                <div
                  key={finding.id}
                  className="rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 overflow-hidden transition"
                >
                  {/* Header Row */}
                  <div
                    onClick={() => toggleExpand(finding.id)}
                    className="p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-navy-850/50 light:hover:bg-slate-50 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${sevBadge}`}>
                        {finding.severity}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white light:text-slate-900">
                          {finding.name}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                          <span className="font-mono text-cyan-400">{finding.category.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{finding.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-slate-400 hover:text-white p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-navy-800 light:border-slate-100 space-y-4 text-xs">
                      {/* Description */}
                      <div>
                        <div className="font-bold text-slate-300 light:text-slate-700 mb-1">
                          Why This Matters & Security Impact:
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                          {finding.description}
                        </p>
                      </div>

                      {/* Technical Observations Grid */}
                      <div className="grid sm:grid-cols-2 gap-3 font-mono text-[11px]">
                        <div className="p-3 rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-800 light:border-slate-200">
                          <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-1">
                            Observed Value
                          </div>
                          <div className="text-slate-300 light:text-slate-800 break-words">
                            {finding.observedValue || 'N/A'}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-800 light:border-slate-200">
                          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">
                            Expected Standard
                          </div>
                          <div className="text-slate-300 light:text-slate-800 break-words">
                            {finding.expectedValue || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Evidence */}
                      {finding.evidence && (
                        <div>
                          <div className="font-bold text-slate-300 light:text-slate-700 mb-1">
                            Technical Evidence:
                          </div>
                          <div className="p-2.5 rounded-xl bg-navy-950 font-mono text-[11px] text-slate-300 border border-navy-800 break-all select-all">
                            {finding.evidence}
                          </div>
                        </div>
                      )}

                      {/* Remediation */}
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                        <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Recommended Remediation</span>
                        </div>
                        <p className="text-slate-300 light:text-slate-700 leading-relaxed">
                          {finding.recommendation}
                        </p>

                        {finding.remediationSnippet && (
                          <div className="mt-2">
                            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Configuration Snippet:
                            </div>
                            <pre className="p-2.5 rounded-lg bg-navy-950 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-navy-800">
                              {finding.remediationSnippet}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* References */}
                      {finding.references && finding.references.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                          <span>References:</span>
                          {finding.references.map((ref, rIdx) => (
                            <a
                              key={rIdx}
                              href={ref}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              <span>Standard Link #{rIdx + 1}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
