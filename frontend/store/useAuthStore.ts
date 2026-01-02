'use client';

import { create } from 'zustand';
import { authService, LoginPayload, RegisterPayload } from '@/services/authService';
import { presenceService } from '@/services/presenceService';
import { workService } from '@/services/workService';
import { IUser } from '@/types';

type State = {
  user: IUser | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  ready: boolean;
};

type Actions = {
  hydrate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<IUser>;
  register: (payload: RegisterPayload) => Promise<IUser>;
  logout: () => Promise<void>;
};

const persistAuth = (data: { user: IUser; token: string; refreshToken: string }) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('workhub-auth', JSON.stringify(data));
  localStorage.setItem('workhub-token', data.token);
  localStorage.setItem('workhub-refresh', data.refreshToken);
};

export const useAuthStore = create<State & Actions>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  loading: false,
  ready: false,
  hydrate: async () => {
    if (typeof window === 'undefined' || get().ready) return;
    const storedToken = localStorage.getItem('workhub-token');
    const storedRefresh = localStorage.getItem('workhub-refresh');

    if (!storedToken && storedRefresh) {
      try {
        const refreshed = await authService.refresh(storedRefresh);
        persistAuth(refreshed);
        set({ user: refreshed.user, token: refreshed.token, refreshToken: refreshed.refreshToken, ready: true });
        return;
      } catch {
        localStorage.removeItem('workhub-auth');
        localStorage.removeItem('workhub-token');
        localStorage.removeItem('workhub-refresh');
        set({ ready: true, user: null, token: null, refreshToken: null });
        return;
      }
    }

    if (!storedToken) {
      localStorage.removeItem('workhub-auth');
      localStorage.removeItem('workhub-token');
      localStorage.removeItem('workhub-refresh');
      set({ ready: true, user: null, token: null, refreshToken: null });
      return;
    }

    try {
      const profile = await authService.me();
      if (storedRefresh) {
        persistAuth({ user: profile, token: storedToken, refreshToken: storedRefresh });
      }
      set({ user: profile, token: storedToken, refreshToken: storedRefresh, ready: true });
    } catch {
      localStorage.removeItem('workhub-auth');
      localStorage.removeItem('workhub-token');
      localStorage.removeItem('workhub-refresh');
      set({ user: null, token: null, refreshToken: null, ready: true });
    }
  },
  login: async (payload) => {
    set({ loading: true });
    try {
      const data = await authService.login(payload);
      let profile = data.user;
      try {
        profile = await authService.me();
      } catch (error) {
        console.warn('Failed to refresh profile after login', error);
      }
      persistAuth({ user: profile, token: data.token, refreshToken: data.refreshToken });
      set({ user: profile, token: data.token, refreshToken: data.refreshToken, loading: false, ready: true });
      return profile;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  register: async (payload) => {
    set({ loading: true });
    try {
      const data = await authService.register(payload);
      let profile = data.user;
      try {
        profile = await authService.me();
      } catch (error) {
        console.warn('Failed to refresh profile after registration', error);
      }
      persistAuth({ user: profile, token: data.token, refreshToken: data.refreshToken });
      set({ user: profile, token: data.token, refreshToken: data.refreshToken, loading: false, ready: true });
      return profile;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  logout: async () => {
    try {
      await workService.stop();
    } catch (error) {
      console.warn('Failed to stop active session before logout', error);
    }
    try {
      await workService.timerEnd({ status: 'active' });
    } catch (error) {
      console.warn('Failed to end work timer', error);
    }
    try {
      await presenceService.offline();
    } catch (error) {
      console.warn('Failed to record offline status', error);
    }
    try {
      const refreshToken = get().refreshToken || (typeof window !== 'undefined' ? localStorage.getItem('workhub-refresh') : null);
      if (refreshToken) await authService.logout(refreshToken);
    } catch (error) {
      console.warn('Logout failed', error);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('workhub-auth');
      localStorage.removeItem('workhub-token');
      localStorage.removeItem('workhub-refresh');
    }
    set({ user: null, token: null, refreshToken: null, ready: true });
  }
}));
