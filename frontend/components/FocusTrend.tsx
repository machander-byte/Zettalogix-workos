'use client';

type Point = {
  label: string;
  focusScore: number;
};

type Props = {
  points: Point[];
};

export default function FocusTrend({ points }: Props) {
  const maxScore = 100;
  if (!points.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-[0_15px_40px_rgba(15,23,42,0.5)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          Focus trend
        </p>
        <p className="mt-2 text-sm text-slate-400">No recent sessions to chart yet.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-[0_15px_40px_rgba(15,23,42,0.5)]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
        Focus trend
      </p>
      <div className="mt-2 flex items-baseline gap-3">
        <p className="text-3xl font-semibold">{points.at(-1)?.focusScore ?? 0}</p>
        <p className="text-xs uppercase tracking-widest text-slate-400">last reading</p>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-2 text-xs text-slate-300">
        {points.map((point) => (
          <div key={point.label} className="flex flex-col items-center gap-2">
            <div className="relative flex h-24 w-full items-end rounded-full bg-white/10 p-1">
              <div
                className="w-full rounded-full bg-gradient-to-t from-brand-500 to-indigo-400"
                style={{ height: `${(point.focusScore / maxScore) * 100}%` }}
              />
            </div>
            <span className="text-[10px] uppercase tracking-widest">{point.label.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
