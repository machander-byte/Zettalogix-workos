'use client';

import Link from 'next/link';
import { ITask } from '@/types';

type Props = {
  tasks: ITask[];
  onStatusChange?: (taskId: string, status: ITask['status']) => void;
};

export default function TaskTable({ tasks, onStatusChange }: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
      <div className="h-1.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600" />
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3 text-right">Comments</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const assignee =
                task.assignedTo && typeof task.assignedTo !== 'string' ? task.assignedTo : undefined;
              const detailHref = `/admin/tasks/${task._id}`;

              return (
                <tr key={task._id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <Link
                      href={detailHref}
                      className="transition hover:text-brand-600 hover:underline"
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {task.project && typeof task.project !== 'string' ? (
                      <div>
                        <p className="font-semibold text-slate-900">{task.project.name}</p>
                        <p className="text-xs uppercase text-slate-500">{task.project.status}</p>
                      </div>
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="font-semibold">{assignee?.name || 'N/A'}</div>
                    {assignee?.role && (
                      <p className="text-xs uppercase text-slate-500">{assignee.role}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {onStatusChange ? (
                      <select
                        value={task.status}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase text-slate-700"
                        onChange={(e) =>
                          onStatusChange(task._id, e.target.value as ITask['status'])
                        }
                      >
                        <option value="todo">To-do</option>
                        <option value="in_progress">In progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                        {task.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-700">{task.priority}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    <Link
                      href={detailHref}
                      className="font-semibold text-brand-600 hover:text-brand-700"
                    >
                      {task.comments?.length || 0} comments
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
