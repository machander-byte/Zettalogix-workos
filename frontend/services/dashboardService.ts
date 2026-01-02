import apiClient from './apiClient';

export const dashboardService = {
  overview: async () => {
    const { data } = await apiClient.get('/dashboard');
    return data;
  }
};
