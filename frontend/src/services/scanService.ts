import { api } from './api';
import { IScan, IDashboardStats } from '../types';

export const scanService = {
  async startScan(data: { url: string; websiteId?: string; authorizationConfirmed: boolean }) {
    const res = await api.post('/scans', data);
    return res.data.data;
  },

  async getUserScans(params?: { q?: string; status?: string; grade?: string; page?: number; limit?: number }) {
    const res = await api.get('/scans', { params });
    return res.data.data;
  },

  async getScanById(id: string): Promise<IScan> {
    const res = await api.get(`/scans/${id}`);
    return res.data.data;
  },

  async getScanStatus(id: string) {
    const res = await api.get(`/scans/${id}/status`);
    return res.data.data;
  },

  async getScanFindings(id: string, params?: { severity?: string; category?: string; q?: string }) {
    const res = await api.get(`/scans/${id}/findings`, { params });
    return res.data.data;
  },

  async deleteScan(id: string) {
    const res = await api.delete(`/scans/${id}`);
    return res.data;
  },

  async compareScans(scanId1: string, scanId2: string) {
    const res = await api.post('/scans/compare', { scanId1, scanId2 });
    return res.data.data;
  },

  async getDashboardStats(): Promise<IDashboardStats> {
    const res = await api.get('/scans/dashboard-stats');
    return res.data.data;
  },
};
