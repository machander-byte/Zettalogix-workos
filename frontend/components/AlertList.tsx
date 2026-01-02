'use client';

import { IActivityAlert } from '@/types';

type AlertPayload = IActivityAlert | { type: string; message: string };

type Props = {
  alerts: AlertPayload[];
};

const colorMap: Record<string, string> = {
  late_login: 'bg-amber-100 text-amber-800',
  early_logout: 'bg-rose-100 text-rose-700',
  idle_soft: 'bg-amber-50 text-amber-700',
  idle_admin: 'bg-rose-50 text-rose-700',
  offline_work_hours: 'bg-rose-50 text-rose-700',
  active_outside: 'bg-sky-50 text-sky-700',
  default: 'bg-slate-100 text-slate-700'
};

const severityMap: Record<string, string> = {
  info: 'text-slate-500',
  warning: 'text-amber-700',
  critical: 'text-rose-700'
};

export default function AlertList({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-500">
        No alerts — everyone is on track.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => {
        const type = 'type' in alert ? alert.type : 'default';
        const message = alert.message;
        const severity = 'severity' in alert ? alert.severity : 'info';
        const time = 'createdAt' in alert && alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString() : null;
        return (
          <div
            key={`${type}-${idx}`}
            className={`rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm font-semibold ${colorMap[type] || colorMap.default}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="flex-1 leading-relaxed text-slate-900">{message}</p>
              {time && <span className="text-xs text-slate-500">{time}</span>}
            </div>
            <p className={`mt-2 text-xs font-semibold ${severityMap[severity] || 'text-slate-500'}`}>
              {severity}
            </p>
          </div>
        );
      })}
    </div>
  );
}
