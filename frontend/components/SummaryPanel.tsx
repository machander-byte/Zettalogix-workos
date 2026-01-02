type Props = {
  data: {
    summary: string;
    redFlags: string[];
    suggestions: string[];
  };
};

export default function SummaryPanel({ data }: Props) {
  return (
    <div className="relative space-y-6 overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.07)]">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Summary</p>
        <p className="mt-2 text-base text-slate-800">{data.summary}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-red-600">Red flags</h3>
          <ul className="mt-2 space-y-1 text-sm text-red-700">
            {data.redFlags.map((flag, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Suggestions
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-emerald-800">
            {data.suggestions.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
