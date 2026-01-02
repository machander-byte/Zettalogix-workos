'use client';

import { useEffect } from 'react';
import LogTable from '@/components/LogTable';
import { useLogStore } from '@/store/useLogStore';

export default function AdminLogsPage() {
  const { logs, fetchAll } = useLogStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">All daily logs</h2>
      <LogTable logs={logs} />
    </div>
  );
}
