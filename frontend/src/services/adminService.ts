import { api } from './api';

export const adminService = {
  async getDashboard() {
    const res = await api.get('/admin/dashboard');
    return res.data.data;
  },

  async getUsers(params?: { q?: string; role?: string; status?: string; page?: number; limit?: number }) {
    const res = await api.get('/admin/users', { params });
    return res.data.data;
  },

  async toggleUserStatus(id: string) {
    const res = await api.patch(`/admin/users/${id}/status`);
    return res.data.data;
  },

  async updateUserRole(id: string, role: 'USER' | 'ADMIN') {
    const res = await api.patch(`/admin/users/${id}/role`, { role });
    return res.data.data;
  },

  async getScans(params?: { page?: number; limit?: number }) {
    const res = await api.get('/admin/scans', { params });
    return res.data.data;
  },
};
