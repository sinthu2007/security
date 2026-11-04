import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Plus,
  ShieldCheck,
  ShieldAlert,
  PlayCircle,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Key,
} from 'lucide-react';
import { websiteService } from '../services/websiteService';
import { IWebsite } from '../types';
import { formatDate } from '../utils/formatters';
import { getGradeBadgeColor } from '../utils/severityColors';

export const WebsitesPage: React.FC = () => {
  const [websites, setWebsites] = useState<IWebsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchWebsites = async () => {
    setLoading(true);
    try {
      const data = await websiteService.getWebsites();
      setWebsites(data);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAdding(true);

    try {
      await websiteService.registerWebsite(newUrl);
      setNewUrl('');
      setShowAddModal(false);
      fetchWebsites();
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'Failed to register website.');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteWebsite = async (id: string, domain: string) => {
    if (!window.confirm(`Are you sure you want to remove target '${domain}' from your monitored targets?`)) {
      return;
    }

    try {
      await websiteService.deleteWebsite(id);
      setWebsites(prev => prev.filter(w => w._id !== id));
    } catch (err: any) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900">
              Monitored Target Websites
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Register your authorized domains and verify ownership to unlock continuous scanning
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-glow-cyan transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register Target Domain</span>
        </button>
      </div>

      {/* Target Websites Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 mt-3 font-mono">LOADING TARGETS...</p>
        </div>
      ) : websites.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-navy-900/40 light:bg-slate-50 border border-navy-800 light:border-slate-200 space-y-4">
          <Globe className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white light:text-slate-900">
            No Target Websites Registered
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Add your organization's web application URL to verify ownership and schedule non-invasive security assessments.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-navy-950 font-bold text-xs shadow-glow-cyan"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Website</span>
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {websites.map((site) => {
            const isVerified = site.verificationStatus === 'VERIFIED' || site.verificationStatus === 'SELF_ATTESTED';
            const gradeInfo = site.latestScan ? getGradeBadgeColor(site.latestScan.securityGrade) : null;

            return (
              <div
                key={site._id}
                className="p-5 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 hover:border-navy-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        isVerified
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : site.verificationStatus === 'FAILED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {isVerified ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5" />
                      )}
                      <span>{site.verificationStatus}</span>
                    </span>

                    {gradeInfo && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-mono font-extrabold ${gradeInfo.bg} ${gradeInfo.text} border ${gradeInfo.border}`}
                      >
                        GRADE {site.latestScan?.securityGrade}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-white light:text-slate-900 truncate">
                    {site.domain}
                  </h3>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 truncate mt-0.5"
                  >
                    <span>{site.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>

                  <div className="mt-4 pt-3 border-t border-navy-800 light:border-slate-100 text-[11px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Scans:</span>
                      <span className="font-mono text-slate-200 light:text-slate-800 font-semibold">{site.scanCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Assessment:</span>
                      <span className="text-slate-300 light:text-slate-700">
                        {site.lastScannedAt ? formatDate(site.lastScannedAt) : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-navy-800 light:border-slate-100 flex items-center justify-between gap-2">
                  {!isVerified ? (
                    <Link
                      to={`/websites/${site._id}/verify`}
                      className="flex-1 text-center py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 transition flex items-center justify-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Verify Domain</span>
                    </Link>
                  ) : (
                    <Link
                      to={`/scan/new?websiteId=${site._id}&target=${encodeURIComponent(site.url)}`}
                      className="flex-1 text-center py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold text-xs border border-cyan-500/30 transition flex items-center justify-center gap-1.5"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Run Assessment</span>
                    </Link>
                  )}

                  <button
                    onClick={() => handleDeleteWebsite(site._id, site.domain)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Remove Target"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Website Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-navy-900 light:bg-white border border-navy-750 light:border-slate-200 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800 light:border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white light:text-slate-900">
                  Register Target Website
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddWebsite} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-1.5">
                  Target Website URL
                </label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-100 light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Must be a valid HTTP or HTTPS address. Internal/private network destinations will be blocked by SSRF defense.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-glow-cyan transition disabled:opacity-50"
                >
                  {adding ? 'Registering...' : 'Add Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
