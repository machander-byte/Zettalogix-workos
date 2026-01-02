type Props = {
  stats: { label: string; value: string }[];
  loading?: boolean;
};

export default function AdminStats({ stats, loading }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.label}
          className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_25px_80px_rgba(37,99,235,0.12)]"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {item.label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {loading ? '?' : item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
