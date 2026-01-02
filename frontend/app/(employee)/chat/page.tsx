'use client';

import { useEffect, useMemo, useState } from 'react';
import { chatService } from '@/services/chatService';
import { callService } from '@/services/callService';
import { userService } from '@/services/userService';
import { IChatMessage, IChatThread, IUser } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useCallSignaling } from '@/hooks/useCallSignaling';
import { CallModal } from '@/components/CallModal';
import { Phone, Video } from 'lucide-react';
import { useWebRTCAudio } from '@/hooks/useWebRTCAudio';

const panelBase =
  'rounded-3xl border border-slate-200 bg-white/80 shadow-[0_20px_70px_rgba(15,23,42,0.08)]';

export default function EmployeeChatPage() {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState<IChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<IChatThread | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [people, setPeople] = useState<IUser[]>([]);
  const [newPartner, setNewPartner] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { call, startCall, acceptCall, rejectCall, endCall, cancelCall } = useCallSignaling();
  const {
    remoteAudioRef,
    remoteVideoRef,
    localVideoRef,
    state: rtcState,
    error: rtcError,
    muted,
    cameraOff,
    hasVideo,
    toggleMute,
    toggleCamera
  } = useWebRTCAudio(call, user?._id);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const [threadList, roster] = await Promise.all([
          chatService.threads(),
          userService.getRoster()
        ]);
        setThreads(threadList);
        setPeople(roster);
        setSelectedThread(threadList[0] || null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedThread) {
      setMessages([]);
      return;
    }
    const loadMessages = async () => {
      const data = await chatService.messages(selectedThread._id);
      setMessages(data);
    };
    loadMessages();
  }, [selectedThread]);

  const partnerOptions = useMemo(
    () => people.filter((person) => person.role === 'employee'),
    [people]
  );

  const handleStartChat = async () => {
    if (!newPartner) return;
    setLoading(true);
    try {
      const thread = await chatService.start(newPartner);
      setThreads((prev) => {
        const exists = prev.find((t) => t._id === thread._id);
        return exists ? prev : [thread, ...prev];
      });
      setSelectedThread(thread);
      setNewPartner('');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedThread) return;
    setSending(true);
    try {
      const message = await chatService.send(selectedThread._id, messageInput.trim());
      setMessages((prev) => [...prev, message]);
      setThreads((prev) =>
        prev.map((thread) =>
          thread._id === selectedThread._id ? { ...thread, lastMessageAt: message.createdAt } : thread
        )
      );
      setMessageInput('');
    } finally {
      setSending(false);
    }
  };

  const handleQuickCall = async () => {
    if (!selectedThread) return;
    await chatService.quickCall({ thread: selectedThread, callService });
    alert('Direct call launched and visible inside Work Mode call queue.');
  };

  const friendlyName = (thread: IChatThread) => {
    if (thread.topic) return thread.topic;
    const names = thread.participants?.map((participant) => participant.name || participant.email);
    return names?.join(' & ') || 'Conversation';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Chat</p>
          <h2 className="text-2xl font-semibold text-slate-900">Conversations</h2>
          <p className="text-sm text-slate-500">
            DM team members or jump into a quick call with a Teams-inspired surface.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:border-brand-400"
            value={newPartner}
            onChange={(e) => setNewPartner(e.target.value)}
          >
            <option value="">Start chat with...</option>
            {partnerOptions.map((person) => (
              <option key={person._id} value={person._id}>
                {person.name} ({person.email})
              </option>
            ))}
          </select>
          <button
            className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60"
            disabled={!newPartner || loading}
            onClick={handleStartChat}
          >
            Start chat
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className={`${panelBase} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Threads</p>
          <div className="mt-4 space-y-2">
            {threads.map((thread) => (
              <button
                key={thread._id}
                type="button"
                onClick={() => setSelectedThread(thread)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  selectedThread?._id === thread._id
                    ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-lg'
                    : 'border-slate-200 bg-white/70 text-slate-700 hover:border-brand-200'
                }`}
              >
                <p className="font-semibold">{friendlyName(thread)}</p>
                <p className="text-xs text-slate-400">
                  {thread.participants?.map((p) => p.name || p.email).join(', ')}
                </p>
              </button>
            ))}
            {threads.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
                No direct messages yet. Pick someone above to start chatting.
              </p>
            )}
          </div>
        </aside>

        <section className={`${panelBase} flex min-h-[600px] flex-col p-4`}>
          {selectedThread ? (
            <>
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-600/10 to-brand-500/10 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Thread</p>
                  <h3 className="text-xl font-semibold text-slate-900">{friendlyName(selectedThread)}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedThread.participants?.map((p) => p.name || p.email).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
                    onClick={() => {
                      const target = selectedThread.participants?.find((p) => p._id !== user?._id);
                      if (target?._id) startCall(target._id, 'audio', target.name || target.email);
                    }}
                  >
                    <Phone className="h-4 w-4" />
                    Audio
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
                    onClick={() => {
                      const target = selectedThread.participants?.find((p) => p._id !== user?._id);
                      if (target?._id) startCall(target._id, 'video', target.name || target.email);
                    }}
                  >
                    <Video className="h-4 w-4" />
                    Video
                  </button>
                </div>
              </div>
              <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl bg-slate-50/70 p-4">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${
                      message.author?._id === user?._id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow ${
                        message.author?._id === user?._id
                          ? 'bg-brand-600 text-white'
                          : 'bg-white text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500/70">
                        <span className="font-semibold">
                          {message.author?.name || message.author?.email || 'Teammate'}
                        </span>
                        <span className="text-[10px]">
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{message.body}</p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-center text-sm text-slate-500">No messages yet. Say hello.</p>
                )}
              </div>
              <form
                className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <input
                  className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Type a message"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <button
                  className="rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
                  disabled={!messageInput.trim() || sending}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-500">
              <p className="text-lg font-semibold text-slate-900">Pick a thread to get started</p>
              <p className="text-sm text-slate-500">
                Choose a conversation on the left or start a fresh chat with a teammate.
              </p>
            </div>
          )}
        </section>
      </div>
      <CallModal
        open={!!call}
        callerName={
          call
            ? call.to === user?._id
              ? call.fromName || 'Incoming call'
              : call.toName || 'Outgoing call'
            : ''
        }
        type={call?.type || 'audio'}
        status={call?.status}
        onAccept={call && call.to === user?._id && call.status === 'ringing' ? acceptCall : undefined}
        onReject={
          call && call.status === 'ringing'
            ? call.to === user?._id
              ? rejectCall
              : cancelCall
            : undefined
        }
        onEnd={call && call.status === 'accepted' ? endCall : undefined}
        remoteAudioRef={remoteAudioRef}
        remoteVideoRef={remoteVideoRef}
        localVideoRef={localVideoRef}
        hasVideo={hasVideo}
        cameraOff={cameraOff}
        connectionState={rtcState}
        muted={muted}
        onToggleMute={toggleMute}
        onToggleCamera={call?.type === 'video' ? toggleCamera : undefined}
        error={rtcError || undefined}
      />
    </div>
  );
}
