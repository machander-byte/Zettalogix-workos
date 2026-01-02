import apiClient from './apiClient';
import { IAnnouncement } from '@/types';

type CreateAnnouncementPayload = {
  title: string;
  body: string;
  targetRoles?: string[] | string;
};

export const announcementService = {
  list: async (scope?: 'all') => {
    const { data } = await apiClient.get<IAnnouncement[]>('/announcements', {
      params: scope === 'all' ? { scope: 'all' } : {}
    });
    return data;
  },
  create: async (payload: CreateAnnouncementPayload) => {
    const { data } = await apiClient.post<IAnnouncement>('/announcements', payload);
    return data;
  }
};
