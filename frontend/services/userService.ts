import apiClient from './apiClient';
import { IUser } from '@/types';

export const userService = {
  getAll: async (role?: string) => {
    const { data } = await apiClient.get<IUser[]>('/users', role ? { params: { role } } : undefined);
    return data;
  },
  getRoster: async (role?: string) => {
    const { data } = await apiClient.get<IUser[]>(
      '/users/roster',
      role ? { params: { role } } : undefined
    );
    return data;
  },
  create: async (payload: Partial<IUser> & { password: string }) => {
    const { data } = await apiClient.post<IUser>('/users', payload);
    return data;
  },
  update: async (id: string, payload: Partial<IUser>) => {
    const { data } = await apiClient.patch<IUser>(`/users/${id}`, payload);
    return data;
  },
  updateStatus: async (id: string, payload: { status?: string; isDeactivated?: boolean }) => {
    const { data } = await apiClient.patch<IUser>(`/users/${id}/status`, payload);
    return data;
  },
  getProfile: async (id: string) => {
    const { data } = await apiClient.get<{ user: IUser; attendance: unknown; tasks: unknown }>(`/users/${id}`);
    return data;
  }
};
