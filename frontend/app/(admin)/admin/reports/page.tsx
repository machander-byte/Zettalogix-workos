'use client';

import { useEffect, useMemo, useState } from 'react';
import { reportService } from '@/services/reportService';
import { adminService } from '@/services/adminService';
import {
  IDailyActivityReport,
  IIdlePatternEntry,
  IIdlePatternReport,
  ITeamOverviewReport,
  IWeeklySummaryReport
} from '@/types';

const DEFAULT_WINDOW_DAYS = 14;

export default function AdminReportsPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [windowDays, setWindowDays] = useState(DEFAULT_WINDOW_DAYS);
  const [dailyReport, setDailyReport] = useState<IDailyActivityReport | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<IWeeklySummaryReport | null>(null);
  const [teamReport, setTeamReport] = useState<ITeamOverviewReport | null>(null);
  const [idleReport, setIdleReport] = useState<IIdlePatternReport | null>(null);
  const [downloading, setDownloading] = useState<'weekly' | 'monthly' | null>(null);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const buildCsv = (headers: string[], rows: Array<Array<string | number>>) => {
    const encode = (value: string | number) =>
      `"${String(value ?? '').replace(/\"/g, '\"\"')}"`;
    return [headers, ...rows].map((row) => row.map(encode).join(',')).join('\n');
  };

  useEffect(() => {
    reportService.daily(date).then(setDailyReport).catch(() => setDailyReport(null));
    reportService.weekly(date).then(setWeeklyReport).catch(() => setWeeklyReport(null));
  }, [date]);

  useEffect(() => {
    reportService.team().then(setTeamReport).catch(() => setTeamReport(null));
    reportService.idlePattern(windowDays).then(setIdleReport).catch(() => setIdleReport(null));
  }, [windowDays]);

  const topDaily = useMemo(() => dailyReport?.users.slice(0, 4) ?? [], [dailyReport]);
  const topWeekly = useMemo(() => weeklyReport?.users.slice(0, 4) ?? [], [weeklyReport]);
  const teamOverview = teamReport?.summary ?? [];
  const patterns = idleReport?.patterns ?? [];

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const exportDailyCsv = () => {
    if (!dailyReport) return;
    const rows = dailyReport.users.map((row) => [
      row.user.name,
      row.user.email,
      row.user.department || '',
      row.user.role,
      row.activeMinutes,
      row.idleMinutes,
      row.offlineMinutes,
      row.sessions
    ]);
    const csv = buildCsv(
      ['Name', 'Email', 'Department', 'Role', 'Active Minutes', 'Idle Minutes', 'Offline Minutes', 'Sessions'],
      rows
    );
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `daily-report-${date}.csv`);
  };

  const exportWeeklyCsv = () => {
    if (!weeklyReport) return;
    const rows = weeklyReport.users.map((row) => [
      row.user.name,
      row.user.email,
      row.user.department || '',
      row.user.role,
      row.activeMinutes,
      row.idleMinutes,
      row.offlineMinutes,
      row.sessions
    ]);
    const csv = buildCsv(
      ['Name', 'Email', 'Department', 'Role', 'Active Minutes', 'Idle Minutes', 'Offline Minutes', 'Sessions'],
      rows
    );
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `weekly-report-${date}.csv`);
  };

  const downloadPdf = async (type: 'weekly' | 'monthly') => {
    setDownloading(type);
    try {
      const file = await adminService.report(type);
      const bytes = atob(file);
      const buffer = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i += 1) {
        buffer[i] = bytes.charCodeAt(i);
      }
      downloadBlob(
        new Blob([buffer], { type: 'application/pdf' }),
        `${type}-productivity-report-${date}.pdf`
      );
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Reporting workspace</p>
          <h1 className="text-2xl font-semibold text-slate-900">Manager & admin reports</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Daily snapshot</label>
          <input
            type="date"
            value={date}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none"
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Idle window (days)</label>
          <select
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none"
          >
            {[7, 14, 30].map((value) => (
              <option key={value} value={value}>
                {value} days
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportDailyCsv}
            disabled={!dailyReport}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm disabled:opacity-50"
          >
            Daily CSV
          </button>
          <button
            type="button"
            onClick={exportWeeklyCsv}
            disabled={!weeklyReport}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm disabled:opacity-50"
          >
            Weekly CSV
          </button>
          <button
            type="button"
            onClick={() => downloadPdf('weekly')}
            disabled={downloading !== null}
            className="rounded-xl border border-slate-200 bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm disabled:opacity-60"
          >
            {downloading === 'weekly' ? 'Preparing...' : 'Weekly PDF'}
          </button>
          <button
            type="button"
            onClick={() => downloadPdf('monthly')}
            disabled={downloading !== null}
            className="rounded-xl border border-slate-200 bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm disabled:opacity-60"
          >
            {downloading === 'monthly' ? 'Preparing...' : 'Monthly PDF'}
          </button>
        </div>
      </header>

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Daily activity</p>
          {topDaily.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Awaiting data for {date}.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {topDaily.map((row) => (
                <div key={row.user._id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{row.user.name}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      {row.user.department || 'Team'} · {row.user.role}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{formatMinutes(row.activeMinutes)} active</p>
                    <p>{formatMinutes(row.idleMinutes)} idle</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Weekly summary</p>
          {topWeekly.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Loading team weekly overview.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {topWeekly.map((row) => (
                <div key={row.user._id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{row.user.name}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{row.user.role}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{formatMinutes(row.activeMinutes)} active</p>
                    <p>{formatMinutes(row.offlineMinutes)} offline</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Team overview</p>
          {teamOverview.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Team metrics are warming up.</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {teamOverview.map((dept) => (
                <div key={dept.department} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">
                  <p className="font-semibold text-slate-900">{dept.department}</p>
                  <p className="text-xs">
                    {formatMinutes(dept.activeMinutes)} active · {formatMinutes(dept.idleMinutes)} idle
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Idle patterns</p>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {(patterns.length === 0 && (
              <p className="text-sm text-slate-500">No repeated idle alerts yet.</p>
            )) ||
              patterns.map((pattern) => (
                <div
                  key={pattern.user?._id || pattern.latest}
                  className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50/80 px-3 py-2"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{pattern.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">
                      {pattern.user?.role || 'Employee'} · {pattern.count} alerts
                    </p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    {pattern.latest ? new Date(pattern.latest).toLocaleDateString() : 'recent'}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
