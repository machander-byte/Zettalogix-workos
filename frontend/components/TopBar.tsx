'use client';

import { useAuthStore } from '@/store/useAuthStore';
import StatusBadge from '@/components/StatusBadge';
import { useEmployeeStatus } from '@/hooks/useEmployeeStatus';
import { ActivityStatus } from '@/types';

export default function TopBar() {
  const { user, logout } = useAuthStore();
  const status = useEmployeeStatus();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const statusLabel = (status?.status || 'offline') as ActivityStatus;
  const subLabel = status?.reason
    ? status.reason
    : status?.status === 'idle'
    ? 'Idle due to inactivity'
    : 'Engaged inside Work OS';

  return (
    <header className="sticky top-0 z-20 flex flex-col border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {today}
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <h1 className="text-xl font-semibold text-slate-900">Hello, {user?.name}</h1>
          <StatusBadge status={statusLabel} label={statusLabel} />
          <p className="text-xs text-slate-500">{subLabel}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 md:mt-0">
        <div className="text-right text-sm text-slate-500">
          <p>Idle {status?.idleMinutes ?? 0}m</p>
          <p>Today {status?.workingMinutes ?? 0}m</p>
        </div>
        <button className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 md:block">
          Quick sync
        </button>
        <button
          className="rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 focus:ring-2 focus:ring-brand-200 focus:ring-offset-2 focus:ring-offset-white"
          onClick={logout}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
