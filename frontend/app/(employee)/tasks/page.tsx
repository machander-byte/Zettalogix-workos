'use client';

import { useEffect } from 'react';
import TaskBoard from '@/components/TaskBoard';
import { useAuthStore } from '@/store/useAuthStore';
import { useTaskStore } from '@/store/useTaskStore';

export default function TasksPage() {
  const { user } = useAuthStore();
  const { tasks, fetch, updateStatus } = useTaskStore();

  useEffect(() => {
    if (user) fetch(user._id);
  }, [user, fetch]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">My tasks</h2>
      <TaskBoard tasks={tasks} onUpdateStatus={updateStatus} />
    </div>
  );
}
