import apiClient from './apiClient';
import { IActivityLog } from '@/types';

export interface INotification {
  _id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
  readAt?: string;
  context?: Record<string, unknown>;
}

export const notificationService = {
  list: async () => {
    const { data } = await apiClient.get<INotification[]>('/notifications');
    return data;
  },
  markRead: async (id: string) => {
    const { data } = await apiClient.post<INotification>(`/notifications/${id}/read`);
    return data;
  },
  rules: async () => {
    const { data } = await apiClient.get('/notifications/rules/list');
    return data;
  }
};
