'use client';

import { useEffect, useState } from 'react';
import SummaryPanel from '@/components/SummaryPanel';
import { useAuthStore } from '@/store/useAuthStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useLogStore } from '@/store/useLogStore';
import { aiService, SummaryResponse } from '@/services/aiService';

const defaultSummary: SummaryResponse = {
  summary: 'Generate an AI summary to see insights.',
  redFlags: [],
  suggestions: []
};

export default function SummaryPage() {
  const { user } = useAuthStore();
  const { tasks, fetch } = useTaskStore();
  const { logs, fetch: fetchLogs } = useLogStore();
  const [summary, setSummary] = useState<SummaryResponse>(defaultSummary);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetch(user._id);
      fetchLogs(user._id);
    }
  }, [user, fetch, fetchLogs]);

  const handleGenerate = async () => {
    setLoading(true);
    const data = await aiService.summarize({ logs, tasks });
    setSummary(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">AI Summary</h2>
        <button
          className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating…' : 'Generate summary'}
        </button>
      </div>
      <SummaryPanel data={summary} />
    </div>
  );
}
