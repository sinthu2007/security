import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message);
      if (res.data?.resetToken) {
        setGeneratedToken(res.data.resetToken);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-glow-cyan mb-4">
            <Shield className="w-7 h-7 text-navy-950 font-bold" />
          </div>
          <h2 className="text-2xl font-bold text-white light:text-slate-900">
            Reset Password
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your registered email to request password reset token
          </p>
        </div>

        <div className="rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {generatedToken && (
            <div className="mb-5 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <div className="text-xs font-semibold text-cyan-300 mb-1">
                Password Reset Token Ready:
              </div>
              <div className="p-2 rounded bg-navy-950 font-mono text-[11px] text-cyan-400 break-all border border-cyan-500/20 select-all">
                {generatedToken}
              </div>
              <button
                type="button"
                onClick={() => navigate(`/reset-password?token=${generatedToken}`)}
                className="mt-3 w-full py-2 px-3 rounded-lg bg-cyan-500 text-navy-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-cyan-400 transition"
              >
                <span>Proceed to Reset Screen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@organization.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-100 light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-cyan transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Processing Request...' : 'Send Reset Instructions'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 border-t border-navy-800 light:border-slate-100 pt-4">
            Remember your credentials?{' '}
            <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
