import apiClient from './apiClient';
import { IProject, ITask } from '@/types';

export const projectService = {
  list: async () => {
    const { data } = await apiClient.get<IProject[]>('/projects');
    return data;
  },
  create: async (payload: Partial<IProject>) => {
    const { data } = await apiClient.post<IProject>('/projects', payload);
    return data;
  },
  update: async (id: string, payload: Partial<IProject>) => {
    const { data } = await apiClient.patch<IProject>(`/projects/${id}`, payload);
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<IProject>(`/projects/${id}`);
    return data;
  },
  tasks: async (id: string) => {
    const { data } = await apiClient.get<ITask[]>(`/projects/${id}/tasks`);
    return data;
  }
};
