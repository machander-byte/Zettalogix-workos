import type { LucideIcon } from 'lucide-react';
import { Activity, ClipboardList, Clock, LayoutDashboard } from 'lucide-react';

type Props = {
  stats: {
    focusScore: number;
    activeTasks: number;
    idleMinutes: number;
    tabSwitchCount: number;
  };
};

const entries: {
  key: keyof Props['stats'];
  title: string;
  suffix: string;
  accent: string;
  icon: LucideIcon;
}[] = [
  {
    key: 'focusScore',
    title: 'Focus score',
    suffix: '/100',
    accent: 'from-emerald-500 to-teal-500',
    icon: Activity
  },
  {
    key: 'activeTasks',
    title: 'Active tasks',
    suffix: '',
    accent: 'from-indigo-500 to-brand-500',
    icon: ClipboardList
  },
  {
    key: 'idleMinutes',
    title: 'Idle minutes',
    suffix: 'm',
    accent: 'from-amber-400 to-orange-500',
    icon: Clock
  },
  {
    key: 'tabSwitchCount',
    title: 'Tab switches',
    suffix: '',
    accent: 'from-fuchsia-500 to-purple-600',
    icon: LayoutDashboard
  }
];

export default function DashboardCards({ stats }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map((item) => {
        const value = stats[item.key];
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_25px_80px_rgba(37,99,235,0.12)]"
          >
            <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${item.accent}`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {item.title}
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {value}{' '}
                  <span className="text-sm font-medium text-slate-500">{item.suffix}</span>
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg text-brand-600">
                <Icon className="h-5 w-5" strokeWidth={2.5} />
              </div>
            </div>

            {item.key === 'focusScore' && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Deep focus</span>
                  <span>{Math.min(100, Math.max(0, value))}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-[width]"
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
