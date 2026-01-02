'use client';

import clsx from 'clsx';
import { ActivityStatus } from '@/types';

const STATUS_CLASSES: Record<
  ActivityStatus,
  { bg: string; border: string; text: string; dot: string }
> = {
  active: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500'
  },
  idle: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500'
  },
  offline: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    dot: 'bg-rose-500'
  }
};

type Props = {
  status: ActivityStatus;
  label?: string;
};

export default function StatusBadge({ status, label }: Props) {
  const classes = STATUS_CLASSES[status];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]',
        classes.bg,
        classes.border,
        classes.text
      )}
    >
      <span className={clsx('h-2 w-2 rounded-full', classes.dot)} />
      {label || status}
    </span>
  );
}
