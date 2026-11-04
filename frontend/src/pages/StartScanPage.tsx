import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlayCircle,
  Globe,
  Shield,
  Lock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { websiteService } from '../services/websiteService';
import { IWebsite } from '../types';

export const StartScanPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [url, setUrl] = useState('');
  const [websiteId, setWebsiteId] = useState<string | undefined>(undefined);
  const [websites, setWebsites] = useState<IWebsite[]>([]);
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(false);
  const [loadingWebsites, setLoadingWebsites] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const targetQuery = searchParams.get('target');
    const websiteIdQuery = searchParams.get('websiteId');

    if (targetQuery) {
      setUrl(targetQuery);
    }
    if (websiteIdQuery) {
      setWebsiteId(websiteIdQuery);
    }

    const loadTargets = async () => {
      try {
        const list = await websiteService.getWebsites();
        setWebsites(list);
      } catch {
        // Handled
      } finally {
        setLoadingWebsites(false);
      }
    };

    loadTargets();
  }, [searchParams]);

  const handleSelectWebsite = (selectedId: string) => {
    if (!selectedId) {
      setWebsiteId(undefined);
      return;
    }
    const found = websites.find(w => w._id === selectedId);
    if (found) {
      setWebsiteId(found._id);
      setUrl(found.url);
    }
  };

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
      setUrl(targetUrl);
    }

    if (!authorizationConfirmed) {
      setError('You must confirm authorization before launching the security assessment.');
      return;
    }

    setStarting(true);

    try {
      const res = await scanService.startScan({
        url: targetUrl,
        websiteId,
        authorizationConfirmed,
      });

      // Redirect to scan progress page!
      navigate(`/scans/${res.scanId}/progress`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to start scan.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title Card */}
      <div className="p-6 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
        <div className="flex items-center gap-2">
          <PlayCircle className="w-6 h-6 text-cyan-400" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900">
            Launch New Security Assessment
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Initiate safe, non-invasive automated checks across transport encryption, HTTP headers, cookies, and DNS.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Scan Form */}
      <div className="rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleStartScan} className="space-y-6">
          {/* Target Website Selector if available */}
          {websites.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1.5">
                Select Monitored Website Target (Optional)
              </label>
              <select
                value={websiteId || ''}
                onChange={(e) => handleSelectWebsite(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-100 light:text-slate-900 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Or enter custom target URL below --</option>
                {websites.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.domain} ({w.verificationStatus})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Target URL Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1.5">
              Website URL to Assess
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Globe className="w-4 h-4 text-cyan-400" />
              </div>
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-100 light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Example: https://example.com or https://app.example.com. Protocols supported: HTTP & HTTPS.
            </p>
          </div>

          {/* Scope & Safety Notice */}
          <div className="p-4 rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-800 light:border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-200 light:text-slate-800">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Assessment Scope & Safety Guarantee</span>
            </div>
            <ul className="space-y-1 text-slate-400 text-[11px] list-disc list-inside">
              <li>Checks SSL/TLS certificate validity, expiry, and negotiated cipher protocols.</li>
              <li>Inspects response headers for CSP, HSTS, X-Frame-Options, and referrer leakage.</li>
              <li>Audits cookie directives for Secure, HttpOnly, and SameSite attributes.</li>
              <li>Queries public DNS records for SPF and DMARC email spoofing defenses.</li>
              <li>Probes are completely passive and non-destructive with zero service interruption.</li>
            </ul>
          </div>

          {/* Authorization Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-950/60 light:bg-slate-50 border border-navy-800 light:border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={authorizationConfirmed}
                onChange={(e) => setAuthorizationConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-navy-700 text-cyan-500 focus:ring-cyan-500 bg-navy-950"
              />
              <span className="text-xs text-slate-300 light:text-slate-700 leading-relaxed">
                <strong>Authorization Confirmation:</strong> I confirm and warrant that I own or have obtained explicit permission from the target website owner to execute these security assessment probes.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={starting || !url || !authorizationConfirmed}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-cyan transition duration-200 disabled:opacity-40"
          >
            {starting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Enqueuing Scan...</span>
              </span>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                <span>START SECURITY SCAN</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
