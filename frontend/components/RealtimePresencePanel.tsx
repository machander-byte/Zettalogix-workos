'use client';

import { useMemo } from 'react';
import { usePresenceStore } from '@/store/usePresenceStore';
import type { IPresenceMetrics } from '@/types';

const METRIC_LABELS = [
  { key: 'onlineUsers', label: 'Online users' },
  { key: 'idleUsers', label: 'Idle users' },
  { key: 'activeSessions', label: 'Active sessions' },
  { key: 'liveHours', label: 'Live hours' }
] as const;

export default function RealtimePresencePanel() {
  const snapshot = usePresenceStore((state) => state.snapshot);
  const metrics = snapshot?.liveMetrics;
  const idleUsers = snapshot?.idleUsers || [];
  const timestamp = snapshot?.timestamp;

  const metricValues = useMemo(
    () =>
      METRIC_LABELS.map((metric) => {
        if (!metrics) {
          return { label: metric.label, value: metric.key === 'liveHours' ? '0h' : 0 };
        }
        if (metric.key === 'liveHours') {
          return { label: metric.label, value: `${metrics.liveHours.toFixed(1)}h` };
        }
        return {
          label: metric.label,
          value: metrics[metric.key as keyof IPresenceMetrics] ?? 0
        };
      }),
    [metrics]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Live presence</p>
          <p className="text-lg font-semibold text-slate-900">Realtime pulse</p>
        </div>
        <p className="text-xs text-slate-500">
          {timestamp ? new Date(timestamp).toLocaleTimeString() : 'waiting...'}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {metricValues.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="text-2xl font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Idle users</p>
        {idleUsers.length === 0 && <p className="text-sm text-slate-500">No one is idle.</p>}
        <div className="space-y-2">
          {idleUsers.slice(0, 4).map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between rounded-xl bg-red-50/60 px-3 py-2 text-sm font-medium text-slate-900"
            >
              <div>
                <p>{user.name}</p>
                <p className="text-xs text-slate-500">
                  {user.role} · {user.sessionStatus}
                </p>
              </div>
              <span className="text-xs text-red-600">idle</span>
            </div>
          ))}
        </div>
        {idleUsers.length > 4 && (
          <p className="text-xs text-slate-500">+{idleUsers.length - 4} more idle</p>
        )}
      </div>
    </div>
  );
}
