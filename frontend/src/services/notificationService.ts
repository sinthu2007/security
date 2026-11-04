import { api } from './api';
import { INotification } from '../types';

export const notificationService = {
  async getNotifications(): Promise<{ notifications: INotification[]; unreadCount: number }> {
    const res = await api.get('/notifications');
    return res.data.data;
  },

  async markAsRead(id: string): Promise<INotification> {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data.data;
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/mark-all-read');
  },
};
