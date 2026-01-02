import apiClient from './apiClient';
import { IUser, IDailyLog, IAdminDashboardSnapshot, IActivityLog } from '@/types';

export const adminService = {
  dashboard: async () => {
    const { data } = await apiClient.get<IAdminDashboardSnapshot>('/admin/dashboard');
    return data;
  },
  online: async () => {
    const { data } = await apiClient.get<IUser[]>('/admin/online');
    return data;
  },
  productivity: async () => {
    const { data } = await apiClient.get<
      { user: { name: string; email: string }; avgFocusScore: number; totalSessions: number }[]
    >('/admin/productivity');
    return data;
  },
  activity: async (limit = 20) => {
    const { data } = await apiClient.get<IActivityLog[]>('/admin/activity', { params: { limit } });
    return data;
  },
  report: async (type: 'weekly' | 'monthly') => {
    const { data } = await apiClient.get<{ file: string }>(`/admin/reports/${type}`);
    return data.file;
  },
  logs: async () => {
    const { data } = await apiClient.get<IDailyLog[]>('/admin/logs');
    return data;
  },
  tasks: async () => {
    const { data } = await apiClient.get('/admin/tasks');
    return data;
  },
  exportData: async () => {
    const { data } = await apiClient.get<{ exportedAt: string; data: Record<string, unknown> }>(
      '/admin/data/export'
    );
    return data;
  },
  importData: async (payload: { data: Record<string, unknown>; mode?: 'replace' | 'merge' }) => {
    const { data } = await apiClient.post('/admin/data/import', payload);
    return data;
  }
};
