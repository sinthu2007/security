import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Server,
  Zap,
  HelpCircle,
  Eye,
  Sliders,
  Check,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [quickUrl, setQuickUrl] = useState('');
  const navigate = useNavigate();

  const handleQuickAssess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl) return;
    // Redirect to scan page or login with prefilled URL in query param
    navigate(`/scan/new?target=${encodeURIComponent(quickUrl)}`);
  };

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 px-4 sm:px-6 max-w-7xl mx-auto text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-900 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium mb-8 shadow-glow-cyan">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>NON-INVASIVE WEB APPLICATION SECURITY SCANNING ENGINE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white light:text-slate-900 max-w-5xl mx-auto leading-tight">
          Automate Defense. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400">
            Audit Security Weaknesses
          </span>{' '}
          Before Adversaries Do.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Small and growing organizations deploy web applications every day without adequate security auditing. 
          AegisGuard safely checks your live target websites for SSL/TLS misconfigurations, missing defensive headers, 
          insecure cookie attributes, and DNS vulnerabilities without causing any service interruption.
        </p>

        {/* Interactive URL Quick Start Form */}
        <div className="mt-10 max-w-2xl mx-auto">
          <form
            onSubmit={handleQuickAssess}
            className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-navy-900/90 light:bg-white border border-navy-750 light:border-slate-300 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 px-3 w-full sm:flex-1">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                type="text"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="https://your-authorized-site.com"
                className="w-full bg-transparent border-none text-sm text-slate-100 light:text-slate-900 placeholder-slate-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-cyan transition duration-200"
            >
              <span>Audit Target</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[11px] text-slate-500 mt-2">
            Non-invasive probes only. Requires account registration and ownership / authorization verification.
          </p>
        </div>

        {/* Key Metrics Strip */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-navy-900/60 light:bg-white border border-navy-800 light:border-slate-200 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">100%</div>
            <div className="text-xs text-slate-400 mt-1">Non-Invasive Checks</div>
          </div>
          <div className="p-4 rounded-xl bg-navy-900/60 light:bg-white border border-navy-800 light:border-slate-200 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">&lt; 15s</div>
            <div className="text-xs text-slate-400 mt-1">Full Assessment Time</div>
          </div>
          <div className="p-4 rounded-xl bg-navy-900/60 light:bg-white border border-navy-800 light:border-slate-200 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">RFC 9116</div>
            <div className="text-xs text-slate-400 mt-1">Standardized Metrics</div>
          </div>
          <div className="p-4 rounded-xl bg-navy-900/60 light:bg-white border border-navy-800 light:border-slate-200 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400 font-mono">Zero</div>
            <div className="text-xs text-slate-400 mt-1">Target Downtime Risk</div>
          </div>
        </div>
      </section>

      {/* Security Assessment Capabilities */}
      <section className="px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
            Real Automated Probes
          </h2>
          <p className="mt-2 text-3xl font-bold text-white light:text-slate-900">
            What AegisGuard Inspects on Your Target
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Every check produces confirmed technical observations with exact evidence, expected standards, and actionable remediation snippets.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: SSL/TLS Analysis */}
          <div className="p-6 rounded-2xl bg-navy-900/70 light:bg-white border border-navy-800 light:border-slate-200 hover:border-cyan-500/40 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-5">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white light:text-slate-900">
              SSL/TLS Certificate & Transport
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Real cryptographic handshake inspection. Checks certificate expiration, CA issuer chain, self-signed anomaly detection, and deprecation of legacy TLSv1.0/1.1 protocols.
            </p>
            <div className="mt-4 pt-4 border-t border-navy-800 light:border-slate-100 flex items-center gap-2 text-[11px] text-cyan-400 font-mono">
              <Check className="w-3.5 h-3.5" /> SNI & Cipher Suite Audit
            </div>
          </div>

          {/* Card 2: Security Headers */}
          <div className="p-6 rounded-2xl bg-navy-900/70 light:bg-white border border-navy-800 light:border-slate-200 hover:border-cyan-500/40 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-5">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white light:text-slate-900">
              HTTP Security Headers
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Verifies presence and configuration of Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options (Clickjacking defense), and X-Content-Type-Options.
            </p>
            <div className="mt-4 pt-4 border-t border-navy-800 light:border-slate-100 flex items-center gap-2 text-[11px] text-blue-400 font-mono">
              <Check className="w-3.5 h-3.5" /> OWASP Secure Header Mapping
            </div>
          </div>

          {/* Card 3: Cookie Hygiene */}
          <div className="p-6 rounded-2xl bg-navy-900/70 light:bg-white border border-navy-800 light:border-slate-200 hover:border-cyan-500/40 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-5">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white light:text-slate-900">
              Cookie Attribute Security
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Audits Set-Cookie headers for essential defense flags: Secure (preventing plaintext transmission), HttpOnly (preventing XSS theft), and SameSite (mitigating CSRF).
            </p>
            <div className="mt-4 pt-4 border-t border-navy-800 light:border-slate-100 flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
              <Check className="w-3.5 h-3.5" /> Session Flag Inspection
            </div>
          </div>

          {/* Card 4: DNS Security */}
          <div className="p-6 rounded-2xl bg-navy-900/70 light:bg-white border border-navy-800 light:border-slate-200 hover:border-cyan-500/40 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-5">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white light:text-slate-900">
              DNS Email Authentication
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Checks SPF (Sender Policy Framework) and DMARC records to detect vulnerability to domain spoofing, brand hijacking, and malicious phishing campaigns.
            </p>
            <div className="mt-4 pt-4 border-t border-navy-800 light:border-slate-100 flex items-center gap-2 text-[11px] text-amber-400 font-mono">
              <Check className="w-3.5 h-3.5" /> SPF / DMARC Policy Evaluation
            </div>
          </div>

          {/* Card 5: Information Disclosure */}
          <div className="p-6 rounded-2xl bg-navy-900/70 light:bg-white border border-navy-800 light:border-slate-200 hover:border-cyan-500/40 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-5">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white light:text-slate-900">
              Information Disclosure Probes
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Flags exposed server headers (Server: Apache/2.4) and runtime technology banners (X-Powered-By: Express/PHP) that facilitate targeted attacker reconnaissance.
            </p>
            <div className="mt-4 pt-4 border-t border-navy-800 light:border-slate-100 flex items-center gap-2 text-[11px] text-rose-400 font-mono">
              <Check className="w-3.5 h-3.5" /> Server Fingerprinting Defense
            </div>
          </div>

          {/* Card 6: AI-Assisted Reports */}
          <div className="p-6 rounded-2xl bg-navy-900/70 light:bg-white border border-navy-800 light:border-slate-200 hover:border-cyan-500/40 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-5">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white light:text-slate-900">
              Executive PDF Reports
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Generates downloadable, executive-ready PDF security posture audits with visual severity grades, prioritized remediation guidance, and technical evidence.
            </p>
            <div className="mt-4 pt-4 border-t border-navy-800 light:border-slate-100 flex items-center gap-2 text-[11px] text-purple-400 font-mono">
              <Check className="w-3.5 h-3.5" /> Instant Downloadable Artifacts
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="px-4 sm:px-6 max-w-7xl mx-auto py-12 rounded-3xl bg-navy-900/40 light:bg-slate-100/60 border border-navy-800/80 light:border-slate-200">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
            Step-by-Step Workflow
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-white light:text-slate-900">
            Three Steps to Full Visibility
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500 text-navy-950 font-extrabold flex items-center justify-center mx-auto text-base">
              1
            </div>
            <h4 className="text-sm font-bold text-white light:text-slate-900">Register Target & Verify</h4>
            <p className="text-xs text-slate-400">
              Confirm your domain ownership via DNS TXT record, HTTP verification file, or electronic authorization signature.
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-navy-950 font-extrabold flex items-center justify-center mx-auto text-base">
              2
            </div>
            <h4 className="text-sm font-bold text-white light:text-slate-900">Execute Safe Security Probes</h4>
            <p className="text-xs text-slate-400">
              The backend engine initiates non-invasive probes across SSL/TLS, HTTP headers, cookies, and DNS with real-time stage tracking.
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-navy-950 font-extrabold flex items-center justify-center mx-auto text-base">
              3
            </div>
            <h4 className="text-sm font-bold text-white light:text-slate-900">Review Insights & Remediate</h4>
            <p className="text-xs text-slate-400">
              Inspect your transparent risk score, review code remediation snippets, and export professional PDF security reports.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-2xl font-bold text-white light:text-slate-900">
            Security & Assessment FAQs
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-navy-900/60 light:bg-white border border-navy-800 light:border-slate-200">
            <h4 className="text-sm font-bold text-white light:text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              Does AegisGuard perform destructive or exploit testing?
            </h4>
            <p className="text-xs text-slate-400 mt-2 pl-6">
              No. AegisGuard is engineered strictly for non-invasive, safe configuration auditing. It does not perform SQL injection, credential brute-forcing, buffer overflows, or denial-of-service simulations. All checks are safe for production web servers.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-navy-900/60 light:bg-white border border-navy-800 light:border-slate-200">
            <h4 className="text-sm font-bold text-white light:text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              How is the Security Grade and Risk Score calculated?
            </h4>
            <p className="text-xs text-slate-400 mt-2 pl-6">
              Our risk-scoring algorithm is completely transparent: scans start at a baseline of 100 points. Penalties are deducted per observed weakness (Critical: -25 pts, High: -15 pts, Medium: -8 pts, Low: -3 pts). Scores map to grades A+, A, B, C, D, and F.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-navy-900/60 light:bg-white border border-navy-800 light:border-slate-200">
            <h4 className="text-sm font-bold text-white light:text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              How does AegisGuard protect against SSRF attacks?
            </h4>
            <p className="text-xs text-slate-400 mt-2 pl-6">
              Before connecting to any URL, the backend resolves its DNS and inspects every resolved IP against RFC 1918 private ranges, loopback addresses (127.0.0.1, ::1), carrier-grade NATs, and cloud metadata endpoints (169.254.169.254). Internal targets are blocked.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-navy-900 via-navy-850 to-navy-950 border border-cyan-500/30 text-center shadow-2xl overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
            Ready to assess your web application?
          </h3>
          <p className="mt-3 text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Create your account today and gain immediate visibility into SSL certificates, security headers, and domain posture.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-glow-cyan transition"
            >
              Start Free Assessment
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-navy-800 hover:bg-navy-750 text-white font-medium text-xs border border-navy-700 transition"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
