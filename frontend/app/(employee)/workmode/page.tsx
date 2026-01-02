'use client';

import WorkModePanel from '@/components/WorkModePanel';

export default function WorkModePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">Work mode</h2>
      <WorkModePanel />
    </div>
  );
}
