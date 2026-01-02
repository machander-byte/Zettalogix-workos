'use client';

import { create } from 'zustand';
import { workService } from '@/services/workService';
import { IWorkSession } from '@/types';

type State = {
  session: IWorkSession | null;
  loading: boolean;
};

type Actions = {
  refresh: () => Promise<void>;
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  trackActivePage: (payload: { url: string; title?: string; duration?: number }) => Promise<void>;
  addIdleTime: (minutes: number) => Promise<void>;
};

export const useWorkStore = create<State & Actions>((set, get) => ({
  session: null,
  loading: false,
  refresh: async () => {
    const session = await workService.current();
    set({ session });
  },
  startSession: async () => {
    set({ loading: true });
    const session = await workService.start();
    set({ session, loading: false });
  },
  stopSession: async () => {
    set({ loading: true });
    await workService.stop();
    set({ session: null, loading: false });
  },
  pauseSession: async () => {
    set({ loading: true });
    const session = await workService.pause();
    set({ session, loading: false });
  },
  resumeSession: async () => {
    set({ loading: true });
    const session = await workService.resume();
    set({ session, loading: false });
  },
  trackActivePage: async (payload) => {
    if (!get().session) return;
    const session = await workService.activePage(payload);
    set({ session });
  },
  addIdleTime: async (minutes) => {
    if (!get().session) return;
    const session = await workService.idle({ duration: minutes * 60 * 1000 });
    set({ session });
  }
}));
