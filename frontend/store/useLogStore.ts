'use client';

import { create } from 'zustand';
import { IDailyLog } from '@/types';
import { logService } from '@/services/logService';

type State = { logs: IDailyLog[]; loading: boolean };
type Actions = {
  fetch: (userId: string) => Promise<void>;
  fetchAll: () => Promise<void>;
  createLog: (payload: Partial<IDailyLog>) => Promise<void>;
};

export const useLogStore = create<State & Actions>((set, get) => ({
  logs: [],
  loading: false,
  fetch: async (userId) => {
    set({ loading: true });
    const logs = await logService.getUserLogs(userId);
    set({ logs, loading: false });
  },
  fetchAll: async () => {
    set({ loading: true });
    const logs = await logService.getAll();
    set({ logs, loading: false });
  },
  createLog: async (payload) => {
    const log = await logService.create(payload);
    set({ logs: [log, ...get().logs] });
  }
}));
