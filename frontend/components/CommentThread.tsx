'use client';

import { ITaskComment } from '@/types';

type Props = {
  comments?: ITaskComment[];
};

const formatDate = (value?: string) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function CommentThread({ comments = [] }: Props) {
  if (!comments.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-500">
        No comments yet. Start the conversation to keep everyone aligned.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment, index) => {
        const commenter =
          comment.user && typeof comment.user !== 'string' ? comment.user : undefined;
        const keyBase = commenter?._id ?? comment.user ?? index;

        return (
          <div
            key={`${keyBase}-${comment.createdAt ?? index}`}
            className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 text-xs text-slate-500">
              <div className="font-semibold text-slate-700">{commenter?.name || 'Unknown user'}</div>
              <span>{formatDate(comment.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{comment.message}</p>
          </div>
        );
      })}
    </div>
  );
}
