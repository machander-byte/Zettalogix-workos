'use client';

import { useEffect } from 'react';
import LogForm from '@/components/LogForm';
import LogTable from '@/components/LogTable';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogStore } from '@/store/useLogStore';

export default function LogsPage() {
  const { user } = useAuthStore();
  const { logs, fetch } = useLogStore();

  useEffect(() => {
    if (user) fetch(user._id);
  }, [user, fetch]);

  return (
    <div className="space-y-6">
      <LogForm />
      <LogTable logs={logs} />
    </div>
  );
}
