import { api, API_BASE_URL } from './api';
import { IReport } from '../types';

export const reportService = {
  async generateReport(scanId: string): Promise<IReport> {
    const res = await api.post(`/reports/${scanId}`);
    return res.data.data;
  },

  async getUserReports(): Promise<IReport[]> {
    const res = await api.get('/reports');
    return res.data.data;
  },

  getDownloadUrl(reportIdOrScanId: string): string {
    const token = localStorage.getItem('aegis_token');
    return `${API_BASE_URL}/reports/${reportIdOrScanId}/download?token=${token || ''}`;
  },

  async downloadReportBlob(reportIdOrScanId: string, filename: string) {
    const res = await api.get(`/reports/${reportIdOrScanId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
