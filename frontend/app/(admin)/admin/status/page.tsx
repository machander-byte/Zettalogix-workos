'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { presenceService } from '@/services/presenceService';
import { ActivityStatus, IPresenceUserStatus } from '@/types';

const statusClass = (status: ActivityStatus) =>
  ({
    active: 'bg-emerald-100 text-emerald-700',
    idle: 'bg-amber-100 text-amber-700',
    offline: 'bg-slate-200 text-slate-700'
  }[status]);

const formatLastActive = (value?: string) =>
  value
    ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

export default function AdminStatusPage() {
  const [users, setUsers] = useState<IPresenceUserStatus[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await presenceService.list();
        if (!mounted) return;
        setUsers(data.users);
        setUpdatedAt(data.updatedAt);
      } catch (error) {
        console.warn('Failed to load presence', error);
      }
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Presence</p>
        <h2 className="text-2xl font-semibold text-slate-900">Employee status</h2>
        <p className="text-sm text-slate-500">
          Live view of who is active, idle, or offline based on recent activity signals.
        </p>
        {updatedAt && (
          <p className="mt-2 text-xs text-slate-400">Updated {new Date(updatedAt).toLocaleTimeString()}</p>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Last active
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 text-sm font-semibold text-slate-800">{user.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600 capitalize">{user.role}</td>
                <td className="px-6 py-4">
                  <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', statusClass(user.status))}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatLastActive(user.lastActiveAt)}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                  No employee presence data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
