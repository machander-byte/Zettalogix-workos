'use client';

import { ITask } from '@/types';

type Props = {
  summary: Record<string, number>;
};

const config: Record<string, { label: string; accent: string; bg: string }> = {
  todo: { label: 'To-do', accent: 'from-slate-500 to-slate-700', bg: 'bg-slate-50' },
  in_progress: { label: 'In progress', accent: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
  review: { label: 'In review', accent: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-50' },
  done: { label: 'Completed', accent: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' }
};

const ordered: ITask['status'][] = ['todo', 'in_progress', 'review', 'done'];

export default function TaskStatusBoard({ summary }: Props) {
  const total = Object.values(summary).reduce((sum, value) => sum + (value || 0), 0);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {ordered.map((key) => {
        const value = summary[key] || 0;
        const cfg = config[key];
        const percent = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <div
            key={key}
            className={`rounded-2xl border border-white/70 ${cfg.bg} p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {cfg.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
            <div className="mt-3 text-xs font-semibold text-slate-500">{percent}% of total</div>
            <div className="mt-3 h-2 rounded-full bg-white/70">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${cfg.accent}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
