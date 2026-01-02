import apiClient from './apiClient';
import { IEmployeeStatusRecord, IEmployeeStatusSnapshot } from '@/types';

export const statusService = {
  me: async () => {
    const { data } = await apiClient.get<IEmployeeStatusRecord>('/status/me');
    return data;
  },
  list: async () => {
    const { data } = await apiClient.get<IEmployeeStatusSnapshot>('/status/employees');
    return data;
  }
};
