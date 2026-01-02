import apiClient from './apiClient';
import { IDailyLog } from '@/types';

export const logService = {
  create: async (payload: Partial<IDailyLog>) => {
    const { data } = await apiClient.post<IDailyLog>('/logs', payload);
    return data;
  },
  getUserLogs: async (userId: string) => {
    const { data } = await apiClient.get<IDailyLog[]>(`/logs/user/${userId}`);
    return data;
  },
  getAll: async () => {
    const { data } = await apiClient.get<IDailyLog[]>('/admin/logs');
    return data;
  }
};
