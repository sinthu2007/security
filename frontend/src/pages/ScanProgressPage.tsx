import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  PlayCircle,
  ArrowRight,
  Server,
  Lock,
  Layers,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { ScanStage, ScanStatus } from '../types';

interface ScanStatusResponse {
  scanId: string;
  scanStatus: ScanStatus;
  currentStage: ScanStage;
  progressPercentage: number;
  errorMessage?: string;
  riskScore: number;
  securityGrade: string;
}

const STAGES: Array<{ key: ScanStage; label: string; description: string }> = [
  {
    key: 'INITIALIZATION',
    label: 'Target Initialization',
    description: 'Validating URL syntax, ports, and authorization parameters',
  },
  {
    key: 'SSRF_AND_DNS_CHECK',
    label: 'SSRF Shield & DNS Resolution',
    description: 'Resolving IP address and verifying public destination boundaries',
  },
  {
    key: 'SSL_TLS_ANALYSIS',
    label: 'SSL/TLS Cryptographic Analysis',
    description: 'Inspecting peer certificates, expiration, issuer trust, and cipher strength',
  },
  {
    key: 'HTTP_SECURITY_HEADERS',
    label: 'HTTP Security Headers & Redirects',
    description: 'Testing CSP, HSTS, X-Frame-Options, and HTTP-to-HTTPS upgrade',
  },
  {
    key: 'COOKIE_SECURITY_AUDIT',
    label: 'Cookie Security Attributes',
    description: 'Auditing Set-Cookie headers for Secure, HttpOnly, and SameSite directives',
  },
  {
    key: 'METADATA_AUDIT',
    label: 'DNS SPF/DMARC & Metadata Audit',
    description: 'Querying DNS email defenses, robots.txt, and RFC 9116 security.txt',
  },
  {
    key: 'RISK_SCORING_AND_AI_ASSESSMENT',
    label: 'Risk Scoring & AI Assessment',
    description: 'Aggregating findings, calculating transparent score, and compiling executive roadmap',
  },
];

export const ScanProgressPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [scanStatus, setScanStatus] = useState<ScanStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    let pollInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const data = await scanService.getScanStatus(id);
        if (!isMounted) return;

        setScanStatus(data);

        // If completed, wait 1 second for visual satisfaction then redirect to results!
        if (data.scanStatus === 'COMPLETED') {
          clearInterval(pollInterval);
          setTimeout(() => {
            navigate(`/scans/${id}`, { replace: true });
          }, 1200);
        } else if (data.scanStatus === 'FAILED') {
          clearInterval(pollInterval);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.response?.data?.message || 'Failed to poll scan progress.');
        clearInterval(pollInterval);
      }
    };

    // Initial check
    checkStatus();
    pollInterval = setInterval(checkStatus, 1500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [id, navigate]);

  const currentStageIndex = STAGES.findIndex(s => s.key === scanStatus?.currentStage);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-navy-900 border border-cyan-500/40 flex items-center justify-center mx-auto shadow-glow-cyan mb-4">
          <Shield className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>
        <h1 className="text-2xl font-extrabold text-white light:text-slate-900">
          Security Assessment In Progress
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          EXECUTION ID: {id}
        </p>
      </div>

      {/* Error state */}
      {scanStatus?.scanStatus === 'FAILED' && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>Assessment Halted / Failed</span>
          </div>
          <p className="text-xs">
            {scanStatus.errorMessage || 'An error occurred during security probe execution.'}
          </p>
          <div className="pt-2 flex items-center gap-3">
            <Link
              to="/scan/new"
              className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs border border-navy-700 flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Assessment</span>
            </Link>
            <Link to="/dashboard" className="text-xs text-slate-400 hover:text-white">
              Return to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Progress Bar Card */}
      <div className="p-6 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 shadow-xl space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-slate-400 font-bold uppercase tracking-wider">
            Probe Execution Lifecycle
          </span>
          <span className="font-mono font-extrabold text-cyan-400 text-base">
            {scanStatus?.progressPercentage || 5}%
          </span>
        </div>

        {/* Bar */}
        <div className="h-3 w-full bg-navy-950 light:bg-slate-200 rounded-full overflow-hidden p-0.5 border border-navy-800 light:border-slate-300">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-500 ease-out shadow-glow-cyan"
            style={{ width: `${scanStatus?.progressPercentage || 5}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Status: <strong className="text-slate-300 light:text-slate-800 uppercase font-mono">{scanStatus?.scanStatus || 'INITIALIZING'}</strong></span>
          <span>Engine: <strong className="text-cyan-400 font-mono">NON-INVASIVE PASSIVE</strong></span>
        </div>
      </div>

      {/* Multi-Stage Tracker */}
      <div className="rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          Execution Stages
        </h3>

        <div className="space-y-3">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex || scanStatus?.scanStatus === 'COMPLETED';
            const isCurrent = idx === currentStageIndex && scanStatus?.scanStatus !== 'COMPLETED';
            const isPending = idx > currentStageIndex && scanStatus?.scanStatus !== 'COMPLETED';

            return (
              <div
                key={stage.key}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300 light:text-slate-800'
                    : isCurrent
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-white light:text-slate-900 shadow-glow-cyan'
                    : 'bg-navy-950/40 light:bg-slate-50/50 border-navy-800/60 light:border-slate-200 text-slate-500'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] font-mono">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold leading-tight">
                      {stage.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider animate-pulse">
                        RUNNING
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                        PASSED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
