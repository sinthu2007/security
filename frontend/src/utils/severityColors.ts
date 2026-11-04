import { SeverityLevel, SecurityGrade } from '../types';

export const getSeverityBadgeClass = (severity: SeverityLevel): string => {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
    case 'HIGH':
      return 'bg-pink-500/10 text-pink-400 border border-pink-500/30';
    case 'MEDIUM':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
    case 'LOW':
      return 'bg-sky-500/10 text-sky-400 border border-sky-500/30';
    case 'INFORMATIONAL':
    default:
      return 'bg-slate-500/10 text-slate-400 border border-slate-500/30';
  }
};

export const getGradeBadgeColor = (grade: SecurityGrade): { bg: string; text: string; border: string; glow: string } => {
  switch (grade) {
    case 'A+':
    case 'A':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        glow: 'shadow-glow-emerald',
      };
    case 'B':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        border: 'border-cyan-500/40',
        glow: 'shadow-glow-cyan',
      };
    case 'C':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/40',
        glow: 'shadow-glow-amber',
      };
    case 'D':
    case 'F':
    default:
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/40',
        glow: 'shadow-glow-rose',
      };
  }
};
