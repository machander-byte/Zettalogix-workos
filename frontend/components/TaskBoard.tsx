'use client';

import Link from 'next/link';

import { ITask } from '@/types';

type Props = {
  tasks: ITask[];
  onUpdateStatus?: (taskId: string, status: ITask['status']) => void;
};

const statusConfig: Record<ITask['status'], { label: string; badge: string; gradient: string }> = {
  todo: { label: 'To do', badge: 'bg-slate-100 text-slate-700', gradient: 'from-slate-50 to-white' },
  in_progress: {
    label: 'In progress',
    badge: 'bg-amber-100 text-amber-800',
    gradient: 'from-amber-50 to-white'
  },
  review: {
    label: 'In review',
    badge: 'bg-indigo-100 text-indigo-800',
    gradient: 'from-indigo-50 to-white'
  },
  done: { label: 'Done', badge: 'bg-emerald-100 text-emerald-800', gradient: 'from-emerald-50 to-white' }
};

const statuses: ITask['status'][] = ['todo', 'in_progress', 'review', 'done'];

export default function TaskBoard({ tasks, onUpdateStatus }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {statuses.map((status) => {
        const config = statusConfig[status];
        const filtered = tasks.filter((task) => task.status === status);

        return (
          <div
            key={status}
            className={`relative rounded-2xl border border-slate-200 bg-gradient-to-b ${config.gradient} p-4 shadow-[0_15px_50px_rgba(15,23,42,0.06)]`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {config.label}
                </p>
                <span className="text-sm font-semibold text-slate-900">{filtered.length} tasks</span>
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${config.badge}`}>
                {status.replace('_', ' ')}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {filtered.map((task) => {
                const detailHref = `/tasks/${task._id}`;

                return (
                  <div
                    key={task._id}
                    className="group rounded-xl border border-slate-200 bg-white/70 p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {task.description || 'No description provided.'}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold">{task.comments?.length || 0} comments</span>
                      <Link href={detailHref} className="font-semibold text-brand-600 hover:text-brand-700">
                        Open discussion
                      </Link>
                    </div>
                    {onUpdateStatus && (
                      <select
                        className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-brand-500"
                        value={task.status}
                        onChange={(e) => onUpdateStatus(task._id, e.target.value as ITask['status'])}
                      >
                        {statuses.map((val) => (
                          <option key={val} value={val}>
                            {val.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-500">
                  Nothing here yet - drop a task in to get moving.
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
