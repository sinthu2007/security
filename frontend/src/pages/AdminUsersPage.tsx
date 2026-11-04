import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { formatDate } from '../utils/formatters';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers({
        q: searchQuery,
        role: roleFilter,
        status: statusFilter,
        limit: 50,
      });
      setUsers(data.users || []);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} account for '${userName}'?`)) {
      return;
    }

    try {
      const res = await adminService.toggleUserStatus(userId);
      setActionMessage(res.message);
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, isActive: res.data.isActive } : u))
      );
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle account status.');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string, userName: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Change role of '${userName}' to ${newRole}?`)) {
      return;
    }

    try {
      const res = await adminService.updateUserRole(userId, newRole);
      setActionMessage(res.message);
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: res.data.role } : u))
      );
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to change user role.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900">
              User Directory & Account Governance
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage registered security operators, enforce access control, and review usage volume
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by operator name or email..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-200 light:text-slate-800 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-200 light:text-slate-800 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="USER">User Role</option>
            <option value="ADMIN">Admin Role</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-navy-950 light:bg-slate-50 border border-navy-750 light:border-slate-200 text-slate-200 light:text-slate-800 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Disabled Only</option>
          </select>

          {(searchQuery || roleFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('');
                setStatusFilter('');
              }}
              className="p-2 rounded-xl text-xs text-slate-400 hover:text-white"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-navy-900/80 light:bg-white border border-navy-800 light:border-slate-200 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 mt-3 font-mono">LOADING OPERATORS...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-400">
            No user accounts found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/60 light:bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-mono border-b border-navy-800 light:border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-bold">User Name & Email</th>
                  <th className="px-5 py-3.5 font-bold">Role</th>
                  <th className="px-5 py-3.5 font-bold">Account Status</th>
                  <th className="px-5 py-3.5 font-bold">Targets</th>
                  <th className="px-5 py-3.5 font-bold">Scans Run</th>
                  <th className="px-5 py-3.5 font-bold">Registered</th>
                  <th className="px-5 py-3.5 font-bold text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 light:divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-navy-850/50 light:hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white light:text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span>{u.isActive ? 'Active' : 'Disabled'}</span>
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-300 light:text-slate-700">
                      {u.websiteCount || 0}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-300 light:text-slate-700 font-bold">
                      {u.scanCount || 0}
                    </td>

                    <td className="px-5 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle Role Button */}
                        <button
                          onClick={() => handleToggleRole(u.id, u.role, u.name)}
                          className="px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white border border-navy-700 text-[11px] font-medium transition"
                          title="Toggle Role (User / Admin)"
                        >
                          {u.role === 'ADMIN' ? 'Demote to User' : 'Make Admin'}
                        </button>

                        {/* Toggle Status Button */}
                        <button
                          onClick={() => handleToggleStatus(u.id, u.isActive, u.name)}
                          className={`p-1.5 rounded-lg border transition ${
                            u.isActive
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                          title={u.isActive ? 'Disable User Account' : 'Reactivate User Account'}
                        >
                          {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
