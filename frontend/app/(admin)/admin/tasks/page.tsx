'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import TaskTable from '@/components/TaskTable';
import { userService } from '@/services/userService';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import { IUser, ITask } from '@/types';

export default function AdminTasksPage() {
  const { tasks, fetchAdmin, create } = useTaskStore();
  const { user, ready } = useAuthStore();
  const [form, setForm] = useState<{
    title: string;
    description: string;
    assignedTo: string;
    priority: ITask['priority'];
    dueDate: string;
  }>({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: ''
  });
  const [assignees, setAssignees] = useState<IUser[]>([]);
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ready || user?.role !== 'admin') return;
    fetchAdmin();
  }, [fetchAdmin, ready, user]);

  useEffect(() => {
    userService
      .getAll()
      .then(setAssignees)
      .catch((error) => console.error('Failed to fetch employees', error));
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setAssigneeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredAssignees = useMemo(() => {
    const value = assigneeQuery.toLowerCase();
    return assignees.filter(
      (user) =>
        user.name.toLowerCase().includes(value) ||
        user.email.toLowerCase().includes(value) ||
        user.role.toLowerCase().includes(value)
    );
  }, [assigneeQuery, assignees]);

  const handleSelectAssignee = (user: IUser) => {
    setSelectedUser(user);
    setForm((prev) => ({ ...prev, assignedTo: user._id }));
    setAssigneeOpen(false);
    setAssigneeQuery('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.assignedTo) {
      setAssigneeOpen(true);
      return;
    }
    await create(form);
    setForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-xl border bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-900">Assign new task</h2>
        <input
          required
          placeholder="Title"
          className="w-full rounded border px-3 py-2"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
        />
        <textarea
          placeholder="Description"
          className="w-full rounded border px-3 py-2"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Assign to</p>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:border-brand-200"
              onClick={() => setAssigneeOpen((prev) => !prev)}
            >
              <span>
                {selectedUser ? (
                  <>
                    {selectedUser.name} <span className="text-xs text-slate-500">({selectedUser.role})</span>
                  </>
                ) : (
                  'Select employee'
                )}
              </span>
              <span aria-hidden className="text-xs text-slate-500">
                v
              </span>
            </button>
            {assigneeOpen && (
              <div className="absolute left-0 right-0 z-20 mt-2 rounded-xl border border-slate-200 bg-white shadow-xl">
                <input
                  autoFocus
                  placeholder="Search employee"
                  value={assigneeQuery}
                  onChange={(e) => setAssigneeQuery(e.target.value)}
                  className="w-full border-b border-slate-100 px-3 py-2 text-sm outline-none"
                />
                <div className="max-h-56 overflow-y-auto">
                  {filteredAssignees.map((user) => (
                    <button
                      type="button"
                      key={user._id}
                      onClick={() => handleSelectAssignee(user)}
                      className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-brand-50"
                    >
                      <span className="font-semibold text-slate-900">{user.name}</span>
                      <span className="text-xs text-slate-500">
                        {user.email} - {user.role}
                      </span>
                    </button>
                  ))}
                  {filteredAssignees.length === 0 && (
                    <p className="px-3 py-4 text-sm text-slate-500">No employees match that search.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="rounded border px-3 py-2"
            value={form.priority}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                priority: e.target.value as ITask['priority']
              }))
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            type="date"
            className="rounded border px-3 py-2"
            value={form.dueDate}
            onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
          />
        </div>
        <button className="rounded bg-brand-600 px-4 py-2 text-white">Create task</button>
      </form>
      <TaskTable tasks={tasks} />
    </div>
  );
}
