'use client';

import { create } from 'zustand';
import { ITask } from '@/types';
import { taskService } from '@/services/taskService';

type State = {
  tasks: ITask[];
  loading: boolean;
};

type Actions = {
  fetch: (userId: string) => Promise<void>;
  fetchAdmin: () => Promise<void>;
  updateStatus: (taskId: string, status: ITask['status']) => Promise<void>;
  create: (payload: Partial<ITask>) => Promise<void>;
  upsertTask: (task: ITask) => void;
};

export const useTaskStore = create<State & Actions>((set, get) => ({
  tasks: [],
  loading: false,
  fetch: async (userId) => {
    set({ loading: true });
    const tasks = await taskService.getUserTasks(userId);
    set({ tasks, loading: false });
  },
  fetchAdmin: async () => {
    set({ loading: true });
    const tasks = await taskService.getAdminTasks();
    set({ tasks, loading: false });
  },
  updateStatus: async (taskId, status) => {
    await taskService.update(taskId, { status });
    set({
      tasks: get().tasks.map((task) =>
        task._id === taskId ? { ...task, status } : task
      )
    });
  },
  create: async (payload) => {
    const task = await taskService.create(payload);
    set({ tasks: [task, ...get().tasks] });
  },
  upsertTask: (nextTask) => {
    const current = get().tasks;
    const exists = current.some((task) => task._id === nextTask._id);
    set({
      tasks: exists
        ? current.map((task) => (task._id === nextTask._id ? nextTask : task))
        : [nextTask, ...current]
    });
  }
}));
