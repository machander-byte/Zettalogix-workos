import apiClient from './apiClient';
import { IPresenceUserStatus } from '@/types';

export const presenceService = {
  heartbeat: async (lastActiveAt: string) => {
    await apiClient.post('/presence/heartbeat', { lastActiveAt });
  },
  offline: async () => {
    await apiClient.post('/presence/offline');
  },
  list: async () => {
    const { data } = await apiClient.get<{ updatedAt: string; users: IPresenceUserStatus[] }>(
      '/presence/users'
    );
    return data;
  }
};
