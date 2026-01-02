'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CommentForm from '@/components/CommentForm';
import CommentThread from '@/components/CommentThread';
import { taskService } from '@/services/taskService';
import { useAuthStore } from '@/store/useAuthStore';
import { useTaskStore } from '@/store/useTaskStore';
import { ITask } from '@/types';

type Props = { taskId: string };

const statusStyles: Record<ITask['status'], string> = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-amber-100 text-amber-800',
  review: 'bg-indigo-100 text-indigo-800',
  done: 'bg-emerald-100 text-emerald-800'
};

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

export default function TaskDetailsPage({ taskId }: Props) {
  const router = useRouter();
  const { user, ready } = useAuthStore();
  const upsertTask = useTaskStore((state) => state.upsertTask);
  const [task, setTask] = useState<ITask | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    const fetchTask = async () => {
      try {
        setLoading(true);
        const data = await taskService.getTask(taskId);
        setTask(data);
        upsertTask(data);
        setError(null);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load task');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [ready, user, taskId, router, upsertTask]);

  const handleComment = async (message: string) => {
    setSubmitting(true);
    try {
      const updated = await taskService.addComment(taskId, message);
      setTask(updated);
      upsertTask(updated);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachmentUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const updated = await taskService.addAttachments(taskId, Array.from(files));
      setTask(updated);
      upsertTask(updated);
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || 'Unable to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  const backTo = user?.role === 'admin' ? '/admin/tasks' : '/tasks';

  if (!ready || loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Loading task details...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">{error || 'Task not found.'}</p>
        <Link href={backTo} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          Back to tasks
        </Link>
      </div>
    );
  }

  const assignee =
    task.assignedTo && typeof task.assignedTo !== 'string' ? task.assignedTo : undefined;
  const assigner =
    task.assignedBy && typeof task.assignedBy !== 'string' ? task.assignedBy : undefined;
  const attachments = task.attachments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Task</p>
          <h1 className="text-2xl font-semibold text-slate-900">{task.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusStyles[task.status]}`}
          >
            {task.status.replace('_', ' ')}
          </span>
          <Link
            href={backTo}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
          >
            Back to tasks
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <section className="space-y-6 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Task details</h3>
              <p className="mt-2 text-sm text-slate-600">
                {task.description || 'No description provided.'}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-slate-500">Assignee</p>
                <p className="font-semibold text-slate-900">{assignee?.name || 'Unassigned'}</p>
                <p className="text-xs text-slate-500">{assignee?.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Assigned by</p>
                <p className="font-semibold text-slate-900">{assigner?.name || 'N/A'}</p>
                <p className="text-xs text-slate-500">{assigner?.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Priority</p>
                <p className="font-semibold capitalize text-slate-900">{task.priority}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Due date</p>
                <p className="font-semibold text-slate-900">{formatDate(task.dueDate)}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Attachments</h3>
              <label className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase text-slate-700 transition hover:border-brand-300 hover:text-brand-700">
                Upload
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleAttachmentUpload(e.target.files)}
                  disabled={uploading}
                />
              </label>
            </div>
            {uploadError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {uploadError}
              </div>
            )}
            {attachments.length === 0 ? (
              <p className="text-sm text-slate-500">
                No attachments yet. Upload files to keep the task context together.
              </p>
            ) : (
              <div className="space-y-3">
                {attachments.map((item, index) => (
                  <div
                    key={`${item.name || 'attachment'}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{item.name || 'Attachment'}</p>
                      <p className="text-xs text-slate-500">
                        {typeof item.uploadedBy === 'string'
                          ? 'Uploaded by teammate'
                          : item.uploadedBy?.name || item.uploadedBy?.email || 'Uploaded'}
                        {item.uploadedAt ? ` • ${formatDate(item.uploadedAt)}` : ''}
                      </p>
                    </div>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm"
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
            {uploading && <p className="text-xs text-slate-500">Uploading attachments...</p>}
          </section>
        </div>
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Discussion</h3>
            <span className="text-xs font-semibold uppercase text-slate-500">
              {task.comments?.length || 0} updates
            </span>
          </div>
          <CommentThread comments={task.comments} />
          <CommentForm onSubmit={handleComment} submitting={submitting} />
        </section>
      </div>
    </div>
  );
}
