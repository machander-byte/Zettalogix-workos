import apiClient from './apiClient';
import { IAttendanceRecord } from '@/types';

export const attendanceService = {
  myHistory: async (days = 14) => {
    const { data } = await apiClient.get<IAttendanceRecord[]>('/attendance/me', {
      params: { days }
    });
    return data;
  },
  checkIn: async () => {
    const { data } = await apiClient.post<IAttendanceRecord>('/attendance/check-in');
    return data;
  },
  checkOut: async () => {
    const { data } = await apiClient.post<IAttendanceRecord>('/attendance/check-out');
    return data;
  },
  startBreak: async () => {
    const { data } = await apiClient.post<IAttendanceRecord>('/attendance/break/start');
    return data;
  },
  endBreak: async () => {
    const { data } = await apiClient.post<IAttendanceRecord>('/attendance/break/end');
    return data;
  },
  adminList: async (params?: { from?: string; to?: string; userId?: string }) => {
    const { data } = await apiClient.get<IAttendanceRecord[]>('/attendance', { params });
    return data;
  },
  override: async (id: string, payload: Partial<IAttendanceRecord>) => {
    const { data } = await apiClient.patch<IAttendanceRecord>(`/attendance/${id}/override`, payload);
    return data;
  }
};
