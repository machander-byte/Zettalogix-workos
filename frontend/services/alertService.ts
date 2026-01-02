import apiClient from './apiClient';
import { IActivityAlert } from '@/types';

export const alertService = {
  list: async (limit = 20) => {
    const { data } = await apiClient.get<IActivityAlert[]>('/alerts', { params: { limit } });
    return data;
  }
};
