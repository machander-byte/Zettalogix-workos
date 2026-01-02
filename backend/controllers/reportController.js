import dayjs from 'dayjs';
import User from '../models/User.js';
import WorkSession from '../models/WorkSession.js';
import ActivityAlert from '../models/ActivityAlert.js';
import { getSettings } from '../services/settingsService.js';

const toStartOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const workingWindowMinutes = (settings) =>
  Math.max(0, (settings.workEndHour || 18) - (settings.workStartHour || 9)) * 60;

const activeMsFromSession = (session) => {
  const start = session.startTime ? new Date(session.startTime).getTime() : Date.now();
  const end = session.endTime ? new Date(session.endTime).getTime() : Date.now();
  return Math.max(0, end - start - (session.idleTime || 0));
};

const convertSessions = (sessions, employees, workMinutes) => {
  const employeeMap = new Map(employees.map((user) => [user._id.toString(), user]));
  const reportMap = new Map();
  sessions.forEach((session) => {
    const userId = session.user.toString();
    const user = employeeMap.get(userId);
    if (!user) return;
    const activeMs = activeMsFromSession(session);
    const idleMs = session.idleTime || 0;
    const summary = reportMap.get(userId) || { activeMs: 0, idleMs: 0, sessions: 0 };
    summary.activeMs += activeMs;
    summary.idleMs += idleMs;
    summary.sessions += 1;
    reportMap.set(userId, summary);
  });

  return Array.from(employeeMap.values()).map((user) => {
    const data = reportMap.get(user._id.toString());
    const activeMinutes = data ? Math.round(data.activeMs / 60000) : 0;
    const idleMinutes = data ? Math.round(data.idleMs / 60000) : 0;
    const offlineMinutes = Math.max(workMinutes - activeMinutes, 0);
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role
      },
      activeMinutes,
      idleMinutes,
      offlineMinutes,
      sessions: data?.sessions || 0
    };
  });
};

export const dailyActivityReport = async (req, res) => {
  const settings = await getSettings();
  const dateParam = req.query.date ? new Date(req.query.date) : new Date();
  const targetDay = toStartOfDay(dateParam);
  const nextDay = dayjs(targetDay).add(1, 'day').toDate();
  const employees = await User.find({ role: 'employee' }).lean();
  const sessions = await WorkSession.find({
    user: { $in: employees.map((user) => user._id) },
    startTime: { $gte: targetDay, $lt: nextDay }
  }).lean();

  const workMinutes = workingWindowMinutes(settings);
  const users = convertSessions(sessions, employees, workMinutes);
  res.json({
    date: targetDay.toISOString(),
    workMinutes,
    users
  });
};

export const weeklySummaryReport = async (req, res) => {
  const settings = await getSettings();
  const dateParam = req.query.date ? new Date(req.query.date) : new Date();
  const endDay = toStartOfDay(dateParam);
  const startDay = dayjs(endDay).subtract(6, 'day').toDate();
  const employees = await User.find({ role: 'employee' }).lean();
  const sessions = await WorkSession.find({
    user: { $in: employees.map((user) => user._id) },
    startTime: { $gte: startDay, $lt: dayjs(endDay).add(1, 'day').toDate() }
  }).lean();

  const workMinutes = workingWindowMinutes(settings);
  const users = convertSessions(sessions, employees, workMinutes);
  res.json({
    period: `${startDay.toISOString()}_${endDay.toISOString()}`,
    workMinutes,
    users
  });
};

export const teamOverviewReport = async (req, res) => {
  const settings = await getSettings();
  const employees = await User.find({ role: 'employee' }).lean();
  const sessions = await WorkSession.find({
    user: { $in: employees.map((user) => user._id) },
    startTime: { $gte: dayjs().startOf('day').subtract(1, 'week').toDate() }
  }).lean();

  const workMinutes = workingWindowMinutes(settings);
  const entries = convertSessions(sessions, employees, workMinutes);
  const grouped = entries.reduce((acc, entry) => {
    const dept = entry.user.department || 'Unassigned';
    const bucket = acc.get(dept) || { activeMinutes: 0, idleMinutes: 0, offlineMinutes: 0, count: 0 };
    bucket.activeMinutes += entry.activeMinutes;
    bucket.idleMinutes += entry.idleMinutes;
    bucket.offlineMinutes += entry.offlineMinutes;
    bucket.count += 1;
    acc.set(dept, bucket);
    return acc;
  }, new Map());

  const summary = Array.from(grouped.entries()).map(([department, aggregate]) => ({
    department,
    ...aggregate
  }));

  res.json({ workMinutes, summary });
};

export const idlePatternReport = async (req, res) => {
  const windowDays = Number(req.query.days || 14);
  const since = dayjs().subtract(windowDays, 'day').toDate();
  const alerts = await ActivityAlert.aggregate([
    { $match: { type: 'idle_admin', createdAt: { $gte: since } } },
    {
      $group: {
        _id: '$user',
        count: { $sum: 1 },
        latest: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);
  const users = await User.find({ _id: { $in: alerts.map((entry) => entry._id) } }).lean();
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));
  const patterns = alerts.map((row) => ({
    user: userMap.get(row._id.toString()),
    count: row.count,
    latest: row.latest
  }));
  res.json({ windowDays, patterns });
};
