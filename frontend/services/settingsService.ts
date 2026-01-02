import apiClient from './apiClient';
import { IBrowserSettings, ISystemSettings } from '@/types';

export const settingsService = {
  getActivitySettings: async () => {
    const { data } = await apiClient.get<ISystemSettings>('/settings/activity');
    return data;
  },
  updateActivitySettings: async (payload: Partial<ISystemSettings>) => {
    const { data } = await apiClient.patch<ISystemSettings>('/settings/activity', payload);
    return data;
  },
  getBrowserSettings: async () => {
    const { data } = await apiClient.get<IBrowserSettings>('/settings/browser');
    return data;
  },
  updateBrowserSettings: async (payload: Partial<IBrowserSettings>) => {
    const { data } = await apiClient.put<IBrowserSettings>('/settings/browser', payload);
    return data;
  }
};
