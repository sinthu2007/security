import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Globe,
  Key,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Shield,
  FileText,
} from 'lucide-react';
import { websiteService } from '../services/websiteService';
import { IWebsite, VerificationMethod } from '../types';

export const WebsiteVerificationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [website, setWebsite] = useState<IWebsite | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<VerificationMethod>('DNS_TXT');
  const [attestationConfirmed, setAttestationConfirmed] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchWebsite = async () => {
      setLoading(true);
      try {
        const websites = await websiteService.getWebsites();
        const found = websites.find(w => w._id === id);
        if (found) {
          setWebsite(found);
        } else {
          navigate('/websites');
        }
      } catch {
        navigate('/websites');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsite();
  }, [id, navigate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (method: VerificationMethod) => {
    if (!website) return;
    setVerifying(true);
    setVerificationResult(null);

    try {
      const res = await websiteService.verifyWebsite(
        website._id,
        method,
        method === 'SELF_ATTESTED' ? attestationConfirmed : undefined
      );

      setVerificationResult({
        success: true,
        message: res.message || 'Domain ownership and assessment authorization verified!',
      });

      // Update local state
      setWebsite(prev => prev ? { ...prev, verificationStatus: 'VERIFIED' } : null);
    } catch (err: any) {
      setVerificationResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Verification failed. Please review the configuration.',
      });
    } finally {
      setVerifying(false);
    }
  };

  if (loading || !website) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-400 mt-3 font-mono">LOADING VERIFICATION TARGET...</p>
      </div>
    );
  }

  const isAlreadyVerified = website.verificationStatus === 'VERIFIED' || website.verificationStatus === 'SELF_ATTESTED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl font-bold text-white light:text-slate-900">
                Verify Domain Ownership & Authorization
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Confirm your authority to assess <strong className="text-cyan-400 font-mono">{website.domain}</strong> using safe verification methods.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                isAlreadyVerified
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isAlreadyVerified ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{website.verificationStatus}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Verification Feedback Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
            verificationResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {verificationResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-bold">{verificationResult.success ? 'Verification Confirmed' : 'Verification Failed'}</div>
            <p className="mt-1">{verificationResult.message}</p>
            {verificationResult.success && (
              <div className="mt-3">
                <Link
                  to={`/scan/new?websiteId=${website._id}&target=${encodeURIComponent(website.url)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-navy-950 font-bold text-xs uppercase tracking-wider"
                >
                  <span>Launch Initial Assessment Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification Tabs Card */}
      <div className="rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 overflow-hidden shadow-xl">
        {/* Tab Headers */}
        <div className="flex border-b border-navy-800 light:border-slate-100 bg-navy-950/40 light:bg-slate-50">
          <button
            onClick={() => setActiveTab('DNS_TXT')}
            className={`flex-1 py-3.5 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'DNS_TXT'
                ? 'border-cyan-400 text-cyan-400 bg-navy-900/70 light:bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Method 1: DNS TXT Record</span>
          </button>

          <button
            onClick={() => setActiveTab('HTTP_FILE')}
            className={`flex-1 py-3.5 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'HTTP_FILE'
                ? 'border-cyan-400 text-cyan-400 bg-navy-900/70 light:bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Method 2: HTTP Verification File</span>
          </button>

          <button
            onClick={() => setActiveTab('SELF_ATTESTED')}
            className={`flex-1 py-3.5 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'SELF_ATTESTED'
                ? 'border-cyan-400 text-cyan-400 bg-navy-900/70 light:bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Method 3: Electronic Authorization</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8">
          {/* Method 1: DNS TXT */}
          {activeTab === 'DNS_TXT' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white light:text-slate-900">
                  Add a TXT Record to Domain DNS
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Log in to your DNS provider (Cloudflare, Route53, Namecheap, etc.) and add the following TXT entry:
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-bold">
                    Record Type
                  </label>
                  <div className="mt-1 p-2.5 rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-cyan-400 font-bold">
                    TXT
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-bold">
                    Host / Name
                  </label>
                  <div className="mt-1 p-2.5 rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-200 light:text-slate-800 flex items-center justify-between">
                    <span>_security-verify.{website.domain} (or @)</span>
                    <button
                      onClick={() => copyToClipboard(`_security-verify.${website.domain}`)}
                      className="text-slate-400 hover:text-cyan-400"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-bold">
                    Value / Content
                  </label>
                  <div className="mt-1 p-2.5 rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-cyan-400 flex items-center justify-between">
                    <span className="truncate mr-2">{website.verificationToken}</span>
                    <button
                      onClick={() => copyToClipboard(website.verificationToken)}
                      className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 font-sans text-[11px]"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleVerify('DNS_TXT')}
                  disabled={verifying}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-glow-cyan transition disabled:opacity-50 flex items-center gap-2"
                >
                  {verifying ? 'Querying DNS Servers...' : 'Verify DNS TXT Record'}
                </button>
              </div>
            </div>
          )}

          {/* Method 2: HTTP File */}
          {activeTab === 'HTTP_FILE' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white light:text-slate-900">
                  Upload Verification File via Web Server
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Create a text file accessible via standard HTTP at the following path:
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-bold">
                    Public Path
                  </label>
                  <div className="mt-1 p-2.5 rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-cyan-400">
                    http://{website.domain}/.well-known/security-platform-verify.txt
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-bold">
                    Required File Content
                  </label>
                  <div className="mt-1 p-2.5 rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-200 light:text-slate-800 flex items-center justify-between">
                    <span>{website.verificationToken}</span>
                    <button
                      onClick={() => copyToClipboard(website.verificationToken)}
                      className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 font-sans text-[11px]"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleVerify('HTTP_FILE')}
                  disabled={verifying}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-glow-cyan transition disabled:opacity-50"
                >
                  {verifying ? 'Checking Verification URL...' : 'Check Verification File'}
                </button>
              </div>
            </div>
          )}

          {/* Method 3: Electronic Authorization Attestation */}
          {activeTab === 'SELF_ATTESTED' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white light:text-slate-900">
                  Electronic Owner & Authorization Attestation
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  If DNS records or web root access are managed by external hosting vendors, you may sign an electronic authorization confirmation statement.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-xs text-slate-300 light:text-slate-700 leading-relaxed space-y-2">
                <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Legal Authorization Declaration</span>
                </div>
                <p>
                  "I hereby affirm, declare, and warrant that I am the legal owner, systems administrator, or duly authorized security representative for domain <strong>{website.domain}</strong>, and I explicitly grant permission for AegisGuard AI to conduct non-invasive security checks."
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={attestationConfirmed}
                  onChange={(e) => setAttestationConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-navy-700 text-cyan-500 focus:ring-cyan-500 bg-navy-950"
                />
                <span className="text-xs text-slate-300 light:text-slate-700">
                  I agree and affirm the authorization statement above and accept responsibility for initiating audits on this target.
                </span>
              </label>

              <div className="pt-2">
                <button
                  onClick={() => handleVerify('SELF_ATTESTED')}
                  disabled={verifying || !attestationConfirmed}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-glow-cyan transition disabled:opacity-40"
                >
                  {verifying ? 'Recording Attestation...' : 'Confirm Authorization & Verify'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
