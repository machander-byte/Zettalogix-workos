import apiClient from './apiClient';
import { IWorkSession, IWorkdayTotals } from '@/types';

export const workService = {
  start: async () => {
    const { data } = await apiClient.post<IWorkSession>('/work/start');
    return data;
  },
  stop: async () => {
    const { data } = await apiClient.post<IWorkSession>('/work/stop');
    return data;
  },
  pause: async () => {
    const { data } = await apiClient.post<IWorkSession>('/work/pause');
    return data;
  },
  resume: async () => {
    const { data } = await apiClient.post<IWorkSession>('/work/resume');
    return data;
  },
  current: async () => {
    const { data } = await apiClient.get<IWorkSession | null>('/work/current');
    return data;
  },
  activePage: async (payload: { url: string; title?: string; duration?: number }) => {
    const { data } = await apiClient.post<IWorkSession>('/work/active-page', payload);
    return data;
  },
  idle: async (payload: { duration: number }) => {
    const { data } = await apiClient.post<IWorkSession>('/work/idle', payload);
    return data;
  },
  timerStart: async () => {
    const { data } = await apiClient.post('/work/session/start');
    return data;
  },
  timerTick: async (payload: { status: 'active' | 'idle' }) => {
    const { data } = await apiClient.post('/work/session/tick', payload);
    return data;
  },
  timerEnd: async (payload: { status: 'active' | 'idle' }) => {
    const { data } = await apiClient.post('/work/session/end', payload);
    return data;
  },
  todayTotals: async () => {
    const { data } = await apiClient.get<IWorkdayTotals>('/work/me/today');
    return data;
  }
};
