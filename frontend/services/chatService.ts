import apiClient from './apiClient';
import { ICallSession, IChatMessage, IChatThread } from '@/types';
import type { ScheduleCallPayload } from './callService';

export const chatService = {
  threads: async (scopeAll?: boolean) => {
    const query = scopeAll ? '?scope=all' : '';
    const { data } = await apiClient.get<IChatThread[]>(`/chats${query}`);
    return data;
  },
  start: async (participantId: string) => {
    const { data } = await apiClient.post<IChatThread>('/chats', { participantId });
    return data;
  },
  messages: async (threadId: string) => {
    const { data } = await apiClient.get<IChatMessage[]>(`/chats/${threadId}/messages`);
    return data;
  },
  send: async (threadId: string, body: string) => {
    const { data } = await apiClient.post<IChatMessage>(`/chats/${threadId}/messages`, { body });
    return data;
  },
  quickCall: async ({
    thread,
    callService
  }: {
    thread: IChatThread;
    callService: {
      schedule: (payload: ScheduleCallPayload) => Promise<ICallSession>;
      start: (callId: string) => Promise<ICallSession>;
    };
  }) => {
    const attendees =
      thread.participants?.map((participant) => participant.name || participant.email) || [];
    const title = thread.topic || `Direct call with ${attendees.filter(Boolean).join(' & ')}`;
    const session = await callService.schedule({
      title,
      attendees,
      scheduledFor: new Date().toISOString()
    });
    await callService.start(session._id);
    return session;
  }
};
