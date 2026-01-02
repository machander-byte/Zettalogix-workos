'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import { usePresenceStore } from '@/store/usePresenceStore';
import type { IPresencePayload } from '@/types';

export const usePresenceSync = () => {
  const socket = useSocketStore((state) => state.socket);
  const setSnapshot = usePresenceStore((state) => state.setSnapshot);

  useEffect(() => {
    if (!socket) return;
    const handleSnapshot = (payload: IPresencePayload) => setSnapshot(payload);
    socket.on('presence:update', handleSnapshot);
    return () => {
      socket.off('presence:update', handleSnapshot);
    };
  }, [socket, setSnapshot]);
};
