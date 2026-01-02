'use client';

import { IActivityLog } from '@/types';

type Props = {
  items: IActivityLog[];
};

export default function ActivityFeed({ items }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Activity
      </p>
      <p className="text-lg font-semibold text-slate-900">Recent admin events</p>
      <div className="mt-4 space-y-4">
        {items.map((entry) => (
          <div key={entry._id} className="flex items-start gap-3">
            <div className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{entry.description}</p>
              <p className="text-xs text-slate-500">
                {(entry.user?.name || 'System') + ' - ' + new Date(entry.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-500">No recent activity captured.</p>
        )}
      </div>
    </div>
  );
}
