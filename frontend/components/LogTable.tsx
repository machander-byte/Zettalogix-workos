import { IDailyLog } from '@/types';

type Props = {
  logs: IDailyLog[];
};

export default function LogTable({ logs }: Props) {
  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div
          key={log._id}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)]"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600" />
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <p className="text-sm text-slate-500">
                {log.user?.name || 'Me'} • {new Date(log.createdAt).toLocaleDateString()}
              </p>
              <h4 className="text-lg font-semibold text-slate-900">
                {log.whatDone.split('\n')[0]}
              </h4>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              {log.timeSpentPerTask?.reduce((sum, entry) => sum + (entry.minutes || 0), 0)} minutes
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Accomplishments
              </p>
              <p className="mt-1 text-sm text-slate-700">{log.whatDone}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-red-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Problems</p>
              <p className="mt-1 text-sm text-red-800">{log.problems || '-'}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-emerald-50/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Tomorrow
              </p>
              <p className="mt-1 text-sm text-emerald-800">{log.tomorrowPlan || '-'}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
