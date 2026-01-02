import apiClient from './apiClient';
import {
  IDailyActivityReport,
  IWeeklySummaryReport,
  ITeamOverviewReport,
  IIdlePatternReport
} from '@/types';

export const reportService = {
  daily: async (date?: string) => {
    const { data } = await apiClient.get<IDailyActivityReport>('/reports/daily', {
      params: date ? { date } : {}
    });
    return data;
  },
  weekly: async (date?: string) => {
    const { data } = await apiClient.get<IWeeklySummaryReport>('/reports/weekly', {
      params: date ? { date } : {}
    });
    return data;
  },
  team: async () => {
    const { data } = await apiClient.get<ITeamOverviewReport>('/reports/team');
    return data;
  },
  idlePattern: async (days?: number) => {
    const { data } = await apiClient.get<IIdlePatternReport>('/reports/idle-pattern', {
      params: { days }
    });
    return data;
  }
};
