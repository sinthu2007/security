import { api } from './api';
import { IWebsite, VerificationMethod } from '../types';

export const websiteService = {
  async registerWebsite(url: string): Promise<IWebsite> {
    const res = await api.post('/websites', { url });
    return res.data.data;
  },

  async getWebsites(): Promise<IWebsite[]> {
    const res = await api.get('/websites');
    return res.data.data;
  },

  async verifyWebsite(id: string, method: VerificationMethod, confirmationStatement?: boolean) {
    const res = await api.post(`/websites/${id}/verify`, { method, confirmationStatement });
    return res.data;
  },

  async deleteWebsite(id: string) {
    const res = await api.delete(`/websites/${id}`);
    return res.data;
  },
};
