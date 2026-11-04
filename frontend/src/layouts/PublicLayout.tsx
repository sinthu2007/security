import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Shield, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Footer } from '../components/common/Footer';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-navy-950 dark:bg-navy-950 light:bg-slate-50 transition-colors">
      {/* Public Navbar */}
      <header className="sticky top-0 z-30 h-16 bg-navy-900/90 dark:bg-navy-900/90 light:bg-white/90 backdrop-blur-md border-b border-navy-800 dark:border-navy-800 light:border-slate-200 px-4 sm:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
            <Shield className="w-5 h-5 text-navy-950 font-bold" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white light:text-slate-900">
            AEGIS<span className="text-cyan-400">GUARD</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            SECURITY PLATFORM
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-navy-800 dark:hover:bg-navy-800 light:hover:bg-slate-100 transition"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-navy-950 transition shadow-glow-cyan"
            >
              Open Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 shadow-glow-cyan transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
