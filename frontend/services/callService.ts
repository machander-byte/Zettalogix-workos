import apiClient from './apiClient';
import { ICallMessage, ICallSession, ICallLog } from '@/types';

export type ScheduleCallPayload = {
  title: string;
  scheduledFor?: string;
  attendees: string[];
  channel?: string;
};

export const callService = {
  list: async () => {
    const { data } = await apiClient.get<ICallSession[]>('/calls');
    return data;
  },
  schedule: async (payload: ScheduleCallPayload) => {
    const { data } = await apiClient.post<ICallSession>('/calls', payload);
    return data;
  },
  start: async (callId: string) => {
    const { data } = await apiClient.post<ICallSession>(`/calls/${callId}/start`);
    return data;
  },
  end: async (callId: string) => {
    const { data } = await apiClient.post<ICallSession>(`/calls/${callId}/end`);
    return data;
  },
  chat: async (callId: string) => {
    const { data } = await apiClient.get<ICallMessage[]>(`/calls/${callId}/chat`);
    return data;
  },
  postChat: async (callId: string, body: string) => {
    const { data } = await apiClient.post<ICallMessage>(`/calls/${callId}/chat`, { body });
    return data;
  },
  logsMe: async () => {
    const { data } = await apiClient.get<ICallLog[]>('/calls/me');
    return data;
  },
  logsTeam: async () => {
    const { data } = await apiClient.get<ICallLog[]>('/calls/team');
    return data;
  }
};
