'use client';

import { create } from 'zustand';
import type { Socket } from 'socket.io-client';

type State = {
  socket: Socket | null;
};

type Actions = {
  setSocket: (socket: Socket | null) => void;
};

export const useSocketStore = create<State & Actions>((set) => ({
  socket: null,
  setSocket: (socket) => set({ socket })
}));
