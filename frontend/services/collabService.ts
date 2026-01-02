import apiClient from './apiClient';
import { ICollabFile, ICollabMessage } from '@/types';

export const collabService = {
  listMessages: async (room = 'strategy') => {
    const { data } = await apiClient.get<ICollabMessage[]>('/collab/messages', {
      params: { room }
    });
    return data;
  },
  postMessage: async (payload: { room?: string; body: string }) => {
    const { data } = await apiClient.post<ICollabMessage>('/collab/messages', payload);
    return data;
  },
  listFiles: async (room = 'strategy') => {
    const { data } = await apiClient.get<ICollabFile[]>('/collab/files', {
      params: { room }
    });
    return data;
  },
  postFile: async (payload: { room?: string; name: string; link?: string }) => {
    const { data } = await apiClient.post<ICollabFile>('/collab/files', payload);
    return data;
  }
};
