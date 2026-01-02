'use client';

import { IAttendanceRecord } from '@/types';

type Props = {
  records: IAttendanceRecord[];
  limit?: number;
};

const statusColor: Record<IAttendanceRecord['status'], string> = {
  pending: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  missed: 'bg-rose-100 text-rose-700'
};

export default function AttendanceList({ records, limit = 5 }: Props) {
  const items = records.slice(0, limit);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Attendance
          </p>
          <p className="text-lg font-semibold text-slate-900">
            Recent check-ins ({items.length})
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((record) => (
          <div
            key={record._id}
            className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-sm text-slate-600"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {record.user?.name || 'Unknown user'}
                </p>
                <p className="text-xs uppercase text-slate-500">
                  {new Date(record.date).toLocaleDateString()}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[record.status]}`}>
                {record.status.replace('_', ' ')}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
              <div>
                <p className="font-semibold">Check-in</p>
                <p>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '—'}</p>
              </div>
              <div>
                <p className="font-semibold">Check-out</p>
                <p>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '—'}</p>
              </div>
              <div>
                <p className="font-semibold">Worked</p>
                <p>{record.workedMinutes ? `${Math.round(record.workedMinutes / 60)}h` : '—'}</p>
              </div>
              <div>
                <p className="font-semibold">Break</p>
                <p>{record.totalBreakMinutes ? `${record.totalBreakMinutes}m` : '—'}</p>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-sm text-slate-500">No attendance records yet.</p>
        )}
      </div>
    </div>
  );
}
