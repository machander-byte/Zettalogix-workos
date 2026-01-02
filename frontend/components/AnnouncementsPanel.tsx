'use client';

import { useEffect, useMemo, useState } from 'react';
import { announcementService } from '@/services/announcementService';
import { IAnnouncement } from '@/types';

type Props = {
  canPublish?: boolean;
};

const parseList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function AnnouncementsPanel({ canPublish }: Props) {
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    body: '',
    targetRoles: ''
  });

  useEffect(() => {
    setLoading(true);
    announcementService
      .list(canPublish ? 'all' : undefined)
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, [canPublish]);

  const handlePublish = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setPublishing(true);
    setError(null);
    try {
      const announcement = await announcementService.create({
        title: form.title.trim(),
        body: form.body.trim(),
        targetRoles: parseList(form.targetRoles)
      });
      setAnnouncements((prev) => [announcement, ...prev]);
      setForm({ title: '', body: '', targetRoles: '' });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to publish announcement');
    } finally {
      setPublishing(false);
    }
  };

  const items = useMemo(
    () => [...announcements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [announcements]
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Announcements</p>
        <h1 className="text-2xl font-semibold text-slate-900">Broadcast updates</h1>
        <p className="text-sm text-slate-600">Share priority updates and reminders with teams.</p>
      </div>

      {canPublish && (
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Publish announcement</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              placeholder="Target roles (comma separated, optional)"
              value={form.targetRoles}
              onChange={(e) => setForm((prev) => ({ ...prev, targetRoles: e.target.value }))}
            />
          </div>
          <textarea
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
            rows={4}
            placeholder="Announcement body"
            value={form.body}
            onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow disabled:opacity-60"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
            {error && <p className="text-xs text-rose-600">{error}</p>}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Latest updates</p>
        {loading && <p className="mt-3 text-sm text-slate-500">Loading announcements...</p>}
        {!loading && items.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">No announcements yet.</p>
        )}
        <div className="mt-4 space-y-3">
          {items.map((announcement) => (
            <div key={announcement._id} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-900">{announcement.title}</span>
                <span>
                  {new Date(announcement.createdAt).toLocaleDateString()} ·{' '}
                  {new Date(announcement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{announcement.body}</p>
              <p className="mt-2 text-xs text-slate-500">
                {announcement.createdBy?.name || announcement.createdBy?.email || 'System'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
