'use client';

import { FormEvent, useState } from 'react';

type Props = {
  onSubmit: (message: string) => Promise<void> | void;
  submitting?: boolean;
};

export default function CommentForm({ onSubmit, submitting }: Props) {
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    await onSubmit(trimmed);
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        rows={3}
        placeholder="Share a quick update or question"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={submitting}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Posting...' : 'Add comment'}
        </button>
      </div>
    </form>
  );
}
