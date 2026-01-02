'use client';

import { useEffect, useMemo, useState } from 'react';
import { callService } from '@/services/callService';
import { CallLogStatus, ICallLog } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useCallSignaling } from '@/hooks/useCallSignaling';
import { useWebRTCAudio } from '@/hooks/useWebRTCAudio';
import { CallModal } from '@/components/CallModal';
import { Phone, Video } from 'lucide-react';

const statusStyles: Record<CallLogStatus, string> = {
  answered: 'bg-emerald-100 text-emerald-700',
  missed: 'bg-amber-100 text-amber-700',
  rejected: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-200 text-slate-700'
};

const formatDuration = (sec: number) => {
  if (!sec) return '0s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0) return `${h}h ${mm}m`;
  return `${m}m ${s}s`;
};

export default function AdminCallsPage() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<ICallLog[]>([]);
  const [loading, setLoading] = useState(false);
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
    const loadLogs = async () => {
      setLoading(true);
      try {
        const data = await callService.logsTeam();
        setLogs(data);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const rows = useMemo(
    () =>
      logs.map((log) => {
        const isCaller = log.fromUserId?._id === user?._id;
        const other = isCaller ? log.toUserId : log.fromUserId;
        return { log, other };
      }),
    [logs, user?._id]
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Calls</p>
        <h1 className="text-2xl font-semibold text-slate-900">Team call history</h1>
        <p className="text-sm text-slate-600">Monitor recent calls and redial participants as needed.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Caller
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Callee
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Duration
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ log, other }) => (
              <tr key={log._id}>
                <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                  {log.fromUserId?.name || log.fromUserId?.email || 'User'}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                  {log.toUserId?.name || log.toUserId?.email || 'User'}
                </td>
                <td className="px-6 py-4 text-sm capitalize text-slate-600">{log.type}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[log.status]}`}
                  >
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {new Date(log.startedAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatDuration(log.durationSec)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-brand-300"
                      onClick={() => other?._id && startCall(other._id, 'audio', other.name || other.email)}
                    >
                      <Phone className="h-4 w-4" />
                      Audio
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-brand-300"
                      onClick={() => other?._id && startCall(other._id, 'video', other.name || other.email)}
                    >
                      <Video className="h-4 w-4" />
                      Video
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                  No call history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && <p className="px-6 py-4 text-sm text-slate-500">Loading call history...</p>}
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
