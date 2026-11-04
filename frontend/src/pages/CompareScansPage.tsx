import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  GitCompare,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { IScan } from '../types';
import { formatDate } from '../utils/formatters';
import { getGradeBadgeColor, getSeverityBadgeClass } from '../utils/severityColors';

export const CompareScansPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [scans, setScans] = useState<IScan[]>([]);
  const [scanId1, setScanId1] = useState(searchParams.get('scanId1') || '');
  const [scanId2, setScanId2] = useState(searchParams.get('scanId2') || '');
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScans = async () => {
      setLoading(true);
      try {
        const data = await scanService.getUserScans({ limit: 100, status: 'COMPLETED' });
        const list = data.scans || [];
        setScans(list);

        // Auto-select second scan if only scanId1 provided
        if (scanId1 && !scanId2 && list.length > 1) {
          const second = list.find((s: IScan) => s._id !== scanId1);
          if (second) {
            setScanId2(second._id);
          }
        }
      } catch {
        // Handled
      } finally {
        setLoading(false);
      }
    };

    loadScans();
  }, [scanId1]);

  useEffect(() => {
    if (scanId1 && scanId2 && scanId1 !== scanId2) {
      executeComparison();
    }
  }, [scanId1, scanId2]);

  const executeComparison = async () => {
    if (!scanId1 || !scanId2) return;
    setError(null);
    setComparing(true);

    try {
      const data = await scanService.compareScans(scanId1, scanId2);
      setComparisonResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to compare assessments.');
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900">
            Compare Security Assessments
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Detect score progression, newly introduced vulnerabilities, and verified remediations across two scans
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1.5">
            Base Assessment (Earlier Scan)
          </label>
          <select
            value={scanId1}
            onChange={(e) => setScanId1(e.target.value)}
            className="w-full px-3 py-2.5 text-xs rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-100 light:text-slate-900 focus:outline-none focus:border-cyan-500"
          >
            <option value="">-- Choose Base Scan --</option>
            {scans.map((s) => (
              <option key={s._id} value={s._id}>
                {s.domain} — Grade {s.securityGrade} ({s.riskScore}/100) — {formatDate(s.startedAt)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1.5">
            Comparison Assessment (Later Scan)
          </label>
          <select
            value={scanId2}
            onChange={(e) => setScanId2(e.target.value)}
            className="w-full px-3 py-2.5 text-xs rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-100 light:text-slate-900 focus:outline-none focus:border-cyan-500"
          >
            <option value="">-- Choose Comparison Scan --</option>
            {scans.map((s) => (
              <option key={s._id} value={s._id} disabled={s._id === scanId1}>
                {s.domain} — Grade {s.securityGrade} ({s.riskScore}/100) — {formatDate(s.startedAt)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {comparing ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 mt-3 font-mono">CALCULATING SECURITY DELTA...</p>
        </div>
      ) : !comparisonResult ? (
        <div className="py-16 text-center rounded-2xl bg-navy-900/40 border border-navy-800 space-y-2">
          <GitCompare className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">Select Two Scans to Compare</h4>
          <p className="text-xs text-slate-500">Pick two scans above to visualize security regressions or improvements.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Delta Banner */}
          <div className="p-6 rounded-2xl bg-navy-900/90 light:bg-white border border-navy-750 light:border-slate-200 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                  comparisonResult.scoreDelta > 0
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : comparisonResult.scoreDelta < 0
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {comparisonResult.scoreDelta > 0 ? (
                  <TrendingUp className="w-6 h-6" />
                ) : comparisonResult.scoreDelta < 0 ? (
                  <TrendingDown className="w-6 h-6" />
                ) : (
                  <Minus className="w-6 h-6" />
                )}
              </div>

              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  ASSESSMENT TRAJECTORY
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900 flex items-center gap-2">
                  <span>Posture {comparisonResult.status}</span>
                  <span
                    className={`font-mono text-base font-bold ${
                      comparisonResult.scoreDelta > 0
                        ? 'text-emerald-400'
                        : comparisonResult.scoreDelta < 0
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    ({comparisonResult.scoreDelta > 0 ? `+${comparisonResult.scoreDelta}` : comparisonResult.scoreDelta} pts)
                  </span>
                </div>
              </div>
            </div>

            {/* Score Side-by-side */}
            <div className="flex items-center gap-6 text-center font-mono">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Base Score</div>
                <div className="text-2xl font-extrabold text-slate-300 light:text-slate-800">
                  {comparisonResult.baseScan.score}/100
                </div>
                <span className="text-xs font-bold text-cyan-400">Grade {comparisonResult.baseScan.grade}</span>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-600" />

              <div>
                <div className="text-[10px] text-slate-500 uppercase">Comparison Score</div>
                <div className="text-2xl font-extrabold text-white light:text-slate-900">
                  {comparisonResult.comparisonScan.score}/100
                </div>
                <span className="text-xs font-bold text-cyan-400">Grade {comparisonResult.comparisonScan.grade}</span>
              </div>
            </div>
          </div>

          {/* Tri-column Findings Comparison */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Resolved Vulnerabilities */}
            <div className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resolved Weaknesses ({comparisonResult.resolvedFindings.length})</span>
                </h3>
              </div>

              {comparisonResult.resolvedFindings.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No vulnerabilities were resolved between these scans.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {comparisonResult.resolvedFindings.map((f: any) => (
                    <div key={f.id} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
                      <div className="font-bold text-slate-200 light:text-slate-800">{f.name}</div>
                      <div className="text-[10px] font-mono text-emerald-400 mt-1 uppercase">{f.severity} • RESOLVED</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New Weaknesses Introduced */}
            <div className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-rose-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>New Vulnerabilities ({comparisonResult.newFindings.length})</span>
                </h3>
              </div>

              {comparisonResult.newFindings.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No new security weaknesses introduced.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {comparisonResult.newFindings.map((f: any) => (
                    <div key={f.id} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs">
                      <div className="font-bold text-slate-200 light:text-slate-800">{f.name}</div>
                      <div className="text-[10px] font-mono text-rose-400 mt-1 uppercase">{f.severity} • NEW DEFECT</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Persistent Weaknesses */}
            <div className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Unresolved / Persistent ({comparisonResult.persistentFindings.length})</span>
                </h3>
              </div>

              {comparisonResult.persistentFindings.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No persistent vulnerabilities remaining.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {comparisonResult.persistentFindings.map((f: any) => (
                    <div key={f.id} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                      <div className="font-bold text-slate-200 light:text-slate-800">{f.name}</div>
                      <div className="text-[10px] font-mono text-amber-400 mt-1 uppercase">{f.severity} • PERSISTENT</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
