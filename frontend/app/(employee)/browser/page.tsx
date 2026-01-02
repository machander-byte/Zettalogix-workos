'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, Maximize2 } from 'lucide-react';
import clsx from 'clsx';
import { settingsService } from '@/services/settingsService';
import { IBrowserSettings } from '@/types';

type NavHistory = { urls: string[]; index: number };

const normalizeUrl = (value: string) => {
  try {
    return new URL(value).toString();
  } catch {
    try {
      return new URL(`https://${value}`).toString();
    } catch {
      return '';
    }
  }
};

const buildAllowedList = (settings: IBrowserSettings | null) => {
  const list = new Set<string>();
  if (settings?.browserHomeUrl) list.add(settings.browserHomeUrl.trim().toLowerCase());
  settings?.browserAllowedUrls?.forEach((url) => {
    if (url) list.add(url.trim().toLowerCase());
  });
  return Array.from(list);
};

const isAllowed = (target: string, allowed: string[]) => {
  if (!target) return false;
  const normalized = target.toLowerCase();
  return allowed.some((entry) => normalized.startsWith(entry));
};

export default function WorkBrowserPage() {
  const [settings, setSettings] = useState<IBrowserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [history, setHistory] = useState<NavHistory>({ urls: [], index: -1 });
  const [blocked, setBlocked] = useState<string | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const allowedList = useMemo(() => buildAllowedList(settings), [settings]);

  useEffect(() => {
    settingsService
      .getBrowserSettings()
      .then((data) => {
        setSettings(data);
        const home = normalizeUrl(data.browserHomeUrl || '');
        if (home) {
          setAddress(home);
          setCurrentUrl(home);
          setHistory({ urls: [home], index: 0 });
        }
      })
      .catch(() => setSettings({ browserEnabled: false, browserHomeUrl: '', browserAllowedUrls: [] }))
      .finally(() => setLoading(false));
  }, []);

  const navigateTo = (value: string) => {
    const target = normalizeUrl(value);
    if (!target) return;
    if (!isAllowed(target, allowedList)) {
      setBlocked('Blocked by admin policy.');
      return;
    }
    setBlocked(null);
    setAddress(target);
    setCurrentUrl(target);
    setHistory((prev) => {
      const urls = prev.urls.slice(0, prev.index + 1).concat(target);
      return { urls, index: urls.length - 1 };
    });
    setFrameKey((k) => k + 1);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    navigateTo(address);
  };

  const goBack = () =>
    setHistory((prev) => {
      if (prev.index <= 0) return prev;
      const index = prev.index - 1;
      setCurrentUrl(prev.urls[index]);
      setAddress(prev.urls[index]);
      setFrameKey((k) => k + 1);
      setBlocked(null);
      return { urls: prev.urls, index };
    });

  const goForward = () =>
    setHistory((prev) => {
      if (prev.index >= prev.urls.length - 1) return prev;
      const index = prev.index + 1;
      setCurrentUrl(prev.urls[index]);
      setAddress(prev.urls[index]);
      setFrameKey((k) => k + 1);
      setBlocked(null);
      return { urls: prev.urls, index };
    });

  const refresh = () => setFrameKey((k) => k + 1);

  if (loading) {
    return <div className="p-6">Loading browser settings...</div>;
  }

  if (!settings?.browserEnabled) {
    return (
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Work Browser</h1>
        <p className="text-sm text-slate-600">This feature is disabled by your administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Work Browser</p>
          <h1 className="text-2xl font-semibold text-slate-900">Stay on approved sites</h1>
          <p className="text-sm text-slate-600">Navigation is limited to administrator-approved URLs.</p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goBack}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            disabled={history.index <= 0}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goForward}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            disabled={history.index >= history.urls.length - 1}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        <input
          type="url"
          className="min-w-[280px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="https://"
        />
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
        >
          Go
        </button>
      </form>

      {blocked && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {blocked}
        </div>
      )}

      <div
        className={clsx(
          'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
          fullscreen ? 'min-h-[80vh]' : 'min-h-[70vh]'
        )}
      >
        {currentUrl ? (
          <iframe
            key={frameKey}
            src={currentUrl}
            className="h-full min-h-[70vh] w-full"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            title="Work Browser"
          />
        ) : (
          <div className="p-6 text-sm text-slate-600">Enter an approved URL to begin browsing.</div>
        )}
      </div>
    </div>
  );
}
