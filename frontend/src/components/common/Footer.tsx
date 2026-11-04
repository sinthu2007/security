import React from 'react';
import { Shield, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-navy-800 dark:border-navy-800 light:border-slate-200 py-6 px-4 sm:px-6 bg-navy-950/80 dark:bg-navy-950/80 light:bg-slate-50 transition-colors text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-300 light:text-slate-700">AegisGuard AI</span>
          <span>— Production Web Application Security Assessment Platform</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Non-Invasive Safe Auditing • RFC 9116 / OWASP Compliant Checks</span>
        </div>

        <div className="text-[11px]">
          &copy; {new Date().getFullYear()} AegisGuard. All security checks strictly authorized.
        </div>
      </div>
    </footer>
  );
};
