import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-navy-900 border border-rose-500/30 flex items-center justify-center mx-auto shadow-glow-rose">
          <ShieldAlert className="w-8 h-8 text-rose-400" />
        </div>
        <div className="text-4xl font-black font-mono text-white light:text-slate-900 tracking-wider">
          404: RESOURCE_NOT_FOUND
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          The requested endpoint or security report does not exist in the active SOC ledger.
        </p>
        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-glow-cyan transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Safety</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
