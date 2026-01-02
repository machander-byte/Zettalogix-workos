'use client';

import { create } from 'zustand';
import type { IPresencePayload } from '@/types';

type State = {
  snapshot: IPresencePayload | null;
};

type Actions = {
  setSnapshot: (payload: IPresencePayload) => void;
};

export const usePresenceStore = create<State & Actions>((set) => ({
  snapshot: null,
  setSnapshot: (payload) => set({ snapshot: payload })
}));
