'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { chatService } from '@/services/chatService';
import { IChatMessage, IChatThread } from '@/types';
import { Phone, RefreshCw, Video } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCallSignaling } from '@/hooks/useCallSignaling';
import { CallModal } from '@/components/CallModal';
import { useWebRTCAudio } from '@/hooks/useWebRTCAudio';

const DEFAULT_BROWSER_URL = process.env.NEXT_PUBLIC_INTERNAL_BROWSER_URL || 'https://www.workhub.com/tools';
const BROWSER_SHORTCUTS = [
  { label: 'Workspace tools', url: DEFAULT_BROWSER_URL },
  { label: 'Handbook', url: process.env.NEXT_PUBLIC_HANDBOOK_URL || 'https://www.workhub.com/handbook' },
  { label: 'Support desk', url: process.env.NEXT_PUBLIC_SUPPORT_URL || 'https://www.workhub.com/support' },
  { label: 'Status', url: process.env.NEXT_PUBLIC_STATUS_URL || 'https://status.workhub.com' }
];

const normalizeUrl = (value: string) => {
  try {
    return new URL(value).toString();
  } catch {
    try {
      return new URL(`https://${value}`).toString();
    } catch {
      return '';
    }
  }
};

export default function AdminConversationsPage() {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState<IChatThread[]>([]);
  const [selected, setSelected] = useState<IChatThread | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const endRef = useRef<HTMLDivElement | null>(null);
  const [browserAddress, setBrowserAddress] = useState(DEFAULT_BROWSER_URL);
  const [browserUrl, setBrowserUrl] = useState(DEFAULT_BROWSER_URL);
  const [browserKey, setBrowserKey] = useState(0);
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
    const loadThreads = async () => {
      const data = await chatService.threads(true);
      setThreads(data);
      if (data[0]) {
        setSelected(data[0]);
        setVisited({ [data[0]._id]: true });
      }
      if (data.length > 1) {
        setVisited((prev) => {
          const next = { ...prev };
          data.slice(1).forEach((t) => {
            if (!(t._id in next)) next[t._id] = false;
          });
          return next;
        });
      }
    };
    loadThreads();
  }, []);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    chatService.messages(selected._id).then(setMessages);
    setVisited((prev) => ({ ...prev, [selected._id]: true }));
  }, [selected]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const setBrowserTarget = (value: string) => {
    const target = normalizeUrl(value);
    if (!target) return;
    setBrowserAddress(target);
    setBrowserUrl(target);
    setBrowserKey((k) => k + 1);
  };

  const handleBrowserSubmit = (event: FormEvent) => {
    event.preventDefault();
    setBrowserTarget(browserAddress);
  };

  const handleBrowserShortcut = (value: string) => setBrowserTarget(value);

  const handleBrowserRefresh = () => setBrowserKey((k) => k + 1);

  const friendlyName = useMemo(
    () => (thread: IChatThread) => {
      if (thread.topic) return thread.topic;
      return thread.participants?.map((p) => p.name || p.email).join(', ') || 'Conversation';
    },
    []
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Teams</p>
          <h2 className="text-2xl font-semibold text-slate-900">Conversations</h2>
          <p className="text-sm text-slate-500">
            Slack-like view for employee chats. Content stays in this surface; no additional tracking applied.
          </p>
        </div>
      </header>

      <main className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Threads</p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
              {threads.length}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {threads.map((thread) => {
              const isActive = selected?._id === thread._id;
              const hasUnread = !visited[thread._id];
              return (
                <button
                  type="button"
                  key={thread._id}
                  onClick={() => setSelected(thread)}
                  className={`group flex w-full items-start justify-between gap-2 rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? 'border-brand-300 bg-brand-50 text-brand-700 shadow'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-brand-200'
                  }`}
                >
                  <div>
                    <p className="font-semibold">{friendlyName(thread)}</p>
                    <p className="text-xs text-slate-400">
                      {thread.participants?.map((p) => p.name || p.email).join(', ')}
                    </p>
                  </div>
                  {hasUnread && (
                    <span className="mt-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      New
                    </span>
                  )}
                </button>
              );
            })}
            {threads.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-slate-700">No conversations yet</p>
                <p className="text-xs text-slate-500">
                  Threads will appear here once employees begin chatting.
                </p>
              </div>
            )}
          </div>
        </aside>

        <div className="flex flex-col gap-4">
          <section className="flex min-h-[640px] flex-col rounded-3xl border border-slate-200 bg-white/90 shadow-sm">
            {selected ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Conversation</p>
                    <h3 className="text-xl font-semibold text-slate-900">{friendlyName(selected)}</h3>
                    <p className="text-xs text-slate-500">
                      {selected.participants?.map((p) => p.name || p.email).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
                      onClick={() => {
                        const target = selected.participants?.find((p) => p._id !== user?._id);
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
                        const target = selected.participants?.find((p) => p._id !== user?._id);
                        if (target?._id) startCall(target._id, 'video', target.name || target.email);
                      }}
                    >
                      <Video className="h-4 w-4" />
                      Video
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div key={message._id} className="flex justify-start">
                        <div className="max-w-3xl rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-400">
                            <span className="font-semibold text-slate-600">
                              {message.author?.name || message.author?.email || 'User'}
                            </span>
                            <span>
                              {new Date(message.createdAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-700">{message.body}</p>
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                        <p className="text-sm font-semibold text-slate-700">No messages yet</p>
                        <p className="text-xs text-slate-500">
                          When this team chats, messages will appear here with timestamps.
                        </p>
                      </div>
                    )}
                    <div ref={endRef} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-slate-500">
                <p className="text-lg font-semibold text-slate-900">Choose a thread</p>
                <p className="text-sm text-slate-500">Select any chat on the left to review its transcript.</p>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">In-app browser</p>
                <h3 className="text-xl font-semibold text-slate-900">Stay in the workspace while you browse</h3>
                <p className="text-xs text-slate-500">
                  Load resources without leaving admin view. Content stays sandboxed to this tab.
                </p>
              </div>
              <button
                type="button"
                onClick={handleBrowserRefresh}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-brand-200 hover:text-brand-700"
              >
                <RefreshCw className="h-4 w-4" />
                Reload
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {BROWSER_SHORTCUTS.map(({ label, url }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleBrowserShortcut(url)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-brand-200 hover:text-brand-700"
                >
                  {label}
                </button>
              ))}
            </div>
            <form
              onSubmit={handleBrowserSubmit}
              className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"
            >
              <input
                type="url"
                value={browserAddress}
                onChange={(e) => setBrowserAddress(e.target.value)}
                className="min-w-[280px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                placeholder="https://"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
              >
                Go
              </button>
            </form>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner">
              <iframe
                key={browserKey}
                src={browserUrl}
                className="h-[520px] w-full"
                loading="lazy"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
                title="Admin in-app browser"
              />
            </div>
          </section>
        </div>
      </main>
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
