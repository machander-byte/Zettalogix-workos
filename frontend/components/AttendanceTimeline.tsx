'use client';

import { IAttendanceRecord } from '@/types';

type Props = {
  records: IAttendanceRecord[];
};

export default function AttendanceTimeline({ records }: Props) {
  if (!records.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Attendance
      </p>
      <p className="text-lg font-semibold text-slate-900">Last {records.length} days</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {records.map((record) => (
          <div key={record._id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">
                {new Date(record.date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 font-semibold uppercase">
                {record.status.replace('_', ' ')}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">Check-in</p>
                <p>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">Check-out</p>
                <p>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '—'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
