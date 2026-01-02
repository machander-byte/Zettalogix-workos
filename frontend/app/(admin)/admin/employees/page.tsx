'use client';

import { useEffect, useState } from 'react';
import { IUser } from '@/types';
import { adminService } from '@/services/adminService';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminEmployeesPage() {
  const [online, setOnline] = useState<IUser[]>([]);
  const { user, ready } = useAuthStore();

  useEffect(() => {
    if (!ready || user?.role !== 'admin') return;
    adminService
      .online()
      .then(setOnline)
      .catch((error) => console.error('Failed to load online employees', error));
  }, [ready, user]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">Online employees</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {online.map((user) => (
          <div key={user._id} className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">{user.email}</p>
            <h3 className="text-lg font-semibold text-slate-900">{user.name}</h3>
            <span className="mt-2 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-600">
              Active
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
