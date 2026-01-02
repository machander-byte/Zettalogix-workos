import apiClient from './apiClient';
import { ITask } from '@/types';

export const taskService = {
  getUserTasks: async (userId: string) => {
    const { data } = await apiClient.get<ITask[]>(`/tasks/user/${userId}`);
    return data;
  },
  getAdminTasks: async () => {
    const { data } = await apiClient.get<ITask[]>('/admin/tasks');
    return data;
  },
  getTask: async (taskId: string) => {
    const { data } = await apiClient.get<ITask>(`/tasks/${taskId}`);
    return data;
  },
  create: async (payload: Partial<ITask>) => {
    const { data } = await apiClient.post<ITask>('/tasks', payload);
    return data;
  },
  update: async (taskId: string, payload: Partial<ITask>) => {
    const { data } = await apiClient.put<ITask>(`/tasks/${taskId}`, payload);
    return data;
  },
  addComment: async (taskId: string, message: string) => {
    const { data } = await apiClient.post<ITask>(`/tasks/${taskId}/comment`, { message });
    return data;
  },
  addAttachments: async (taskId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const { data } = await apiClient.post<ITask>(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  }
};
