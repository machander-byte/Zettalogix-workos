'use client';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  console.error('App error boundary:', error);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-950/95 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-10 py-12 text-center shadow-2xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">WorkHub</p>
          <h1 className="mt-2 text-3xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-sm text-white/70">
            We hit a snag rendering this screen. Try again, or head back to your dashboard.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              className="rounded-2xl border border-white/20 px-5 py-2 text-sm font-semibold text-white shadow-inner transition hover:border-white/60"
              onClick={() => reset()}
            >
              Try again
            </button>
            <a
              href="/dashboard"
              className="rounded-2xl bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5"
            >
              Go to dashboard
            </a>
          </div>
          {error.digest && (
            <p className="mt-4 text-[11px] uppercase tracking-[0.3em] text-white/40">
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
