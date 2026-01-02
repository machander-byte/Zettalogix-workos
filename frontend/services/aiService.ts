import apiClient from './apiClient';

export type SummaryPayload = {
  logs: unknown[];
  tasks: unknown[];
};

export type SummaryResponse = {
  summary: string;
  redFlags: string[];
  suggestions: string[];
};

export const aiService = {
  summarize: async (payload: SummaryPayload) => {
    const { data } = await apiClient.post<SummaryResponse>('/ai/summary', payload);
    return data;
  }
};
