'use client';

import { useEffect, useState } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import { useAuthStore } from '@/store/useAuthStore';

export type CallStatus = 'ringing' | 'outgoing' | 'accepted' | 'rejected' | 'canceled' | 'ended';
export type CallType = 'audio' | 'video';

export interface CallSessionState {
  callId: string;
  from: string;
  to: string;
  fromName?: string;
  toName?: string;
  type: CallType;
  status: CallStatus;
}

export const useCallSignaling = () => {
  const socket = useSocketStore((state) => state.socket);
  const { user } = useAuthStore();
  const [call, setCall] = useState<CallSessionState | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleRinging = (payload: CallSessionState) => {
      setCall({ ...payload, status: 'ringing' });
    };
    const handleOutgoing = (payload: CallSessionState) => {
      setCall({ ...payload, status: 'outgoing' });
    };
    const handleAccepted = (payload: CallSessionState) => {
      setCall({ ...payload, status: 'accepted' });
    };
    const handleEnded = () => setCall(null);
    const handleRejected = () => setCall(null);
    const handleCanceled = () => setCall(null);

    socket.on('call:ringing', handleRinging);
    socket.on('call:outgoing', handleOutgoing);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:ended', handleEnded);
    socket.on('call:rejected', handleRejected);
    socket.on('call:canceled', handleCanceled);

    return () => {
      socket.off('call:ringing', handleRinging);
      socket.off('call:outgoing', handleOutgoing);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:ended', handleEnded);
      socket.off('call:rejected', handleRejected);
      socket.off('call:canceled', handleCanceled);
    };
  }, [socket]);

  const startCall = (toUserId: string, type: CallType, toName?: string) => {
    if (!socket || !user?._id) return;
    socket.emit('call:invite', { toUserId, type, toName });
  };

  const acceptCall = () => {
    if (!socket || !call) return;
    socket.emit('call:accept', { callId: call.callId });
    setCall((prev) => (prev ? { ...prev, status: 'accepted' } : prev));
  };

  const rejectCall = () => {
    if (!socket || !call) return;
    socket.emit('call:reject', { callId: call.callId });
    setCall(null);
  };

  const endCall = () => {
    if (!socket || !call) return;
    socket.emit('call:end', { callId: call.callId });
    setCall(null);
  };

  const cancelCall = () => {
    if (!socket || !call) return;
    socket.emit('call:cancel', { callId: call.callId });
    setCall(null);
  };

  return {
    call,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    cancelCall
  };
};
