'use client';

import { useState } from 'react';
import { useLogStore } from '@/store/useLogStore';

export default function LogForm() {
  const { createLog } = useLogStore();
  const [form, setForm] = useState({
    whatDone: '',
    problems: '',
    tomorrowPlan: '',
    timeSpentPerTask: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const entries = form.timeSpentPerTask
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [taskTitle, minutes] = line.split(',');
        return {
          taskTitle: taskTitle?.trim(),
          minutes: Number(minutes) || 0
        };
      });
    await createLog({ ...form, timeSpentPerTask: entries });
    setSaving(false);
    setForm({ whatDone: '', problems: '', tomorrowPlan: '', timeSpentPerTask: '' });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Daily log
          </p>
          <h2 className="text-xl font-semibold text-slate-900">Capture progress & blockers</h2>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
          Today
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <textarea
          required
          className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:-translate-y-0.5 focus:border-brand-500 focus:bg-white focus:shadow-lg"
          placeholder="What did you accomplish?"
          value={form.whatDone}
          onChange={(e) => setForm((prev) => ({ ...prev, whatDone: e.target.value }))}
        />
        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:-translate-y-0.5 focus:border-brand-500 focus:bg-white focus:shadow-lg"
          placeholder="Any blockers?"
          value={form.problems}
          onChange={(e) => setForm((prev) => ({ ...prev, problems: e.target.value }))}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:-translate-y-0.5 focus:border-brand-500 focus:bg-white focus:shadow-lg"
          placeholder="Plan for tomorrow"
          value={form.tomorrowPlan}
          onChange={(e) => setForm((prev) => ({ ...prev, tomorrowPlan: e.target.value }))}
        />
        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:-translate-y-0.5 focus:border-brand-500 focus:bg-white focus:shadow-lg"
          placeholder="Task title, minutes per line"
          value={form.timeSpentPerTask}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, timeSpentPerTask: e.target.value }))
          }
        />
      </div>
      <button
        disabled={saving}
        className="w-full rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 focus:ring-2 focus:ring-brand-200 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-70"
      >
        {saving ? 'Saving…' : 'Submit log'}
      </button>
    </form>
  );
}
