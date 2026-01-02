import dayjs from 'dayjs';
import User from '../models/User.js';
import WorkSession from '../models/WorkSession.js';
import DailyLog from '../models/DailyLog.js';
import Task from '../models/Task.js';
import Attendance from '../models/Attendance.js';
import Project from '../models/Project.js';
import { getOnlineUsers } from '../socket.js';
import { generateLogReport } from '../utils/pdfGenerator.js';
import { fetchRecentAuditLogs } from '../utils/auditLogger.js';

const asHours = (minutes = 0) => Math.round((minutes / 60) * 10) / 10;

export const getDashboardSnapshot = async (req, res) => {
  const [totalEmployees, activeEmployees, totalProjects, taskAggregation, attendanceToday, trend, onlineUsers] =
    await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: { $ne: 'admin' }, status: 'active' }),
      Project.countDocuments({ status: { $ne: 'archived' } }),
      Task.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Attendance.find({ date: { $gte: dayjs().startOf('day').toDate() } })
        .populate('user', 'name email role attendancePreferences'),
      WorkSession.aggregate([
        {
          $match: { createdAt: { $gte: dayjs().subtract(6, 'day').startOf('day').toDate() } }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            focusScore: { $avg: '$focusScore' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      User.find({ _id: { $in: getOnlineUsers() } }).select('name email role')
    ]);

  const taskSummary = taskAggregation.reduce(
    (acc, item) => ({ ...acc, [item._id]: item.count }),
    { todo: 0, in_progress: 0, review: 0, done: 0 }
  );

  const alerts = [];
  const idleUsers = [];
  attendanceToday.forEach((record) => {
    const prefs = record.user?.attendancePreferences || {};
    const [shiftStartHour = 9, shiftStartMinute = 0] = (prefs.shiftStart || '09:00')
      .split(':')
      .map(Number);
    const [shiftEndHour = 18, shiftEndMinute = 0] = (prefs.shiftEnd || '18:00')
      .split(':')
      .map(Number);
    const expectedStart = dayjs(record.date)
      .hour(shiftStartHour)
      .minute(shiftStartMinute);
    const expectedEnd = dayjs(record.date).hour(shiftEndHour).minute(shiftEndMinute);
    if (record.checkIn && dayjs(record.checkIn).isAfter(expectedStart.add(10, 'minute'))) {
      alerts.push({
        type: 'late_login',
        message: `${record.user?.name} clocked in at ${dayjs(record.checkIn).format('HH:mm')}`
      });
    }
    if (
      record.checkOut &&
      dayjs(record.checkOut).isBefore(expectedEnd.subtract(30, 'minute'))
    ) {
      alerts.push({
        type: 'early_logout',
        message: `${record.user?.name} clocked out at ${dayjs(record.checkOut).format('HH:mm')}`
      });
    }
    if (record.status !== 'completed') {
      idleUsers.push(record.user);
    }
  });

  const [dailyHours, weeklyHours, monthlyHours] = await Promise.all([
    Attendance.aggregate([
      { $match: { date: { $gte: dayjs().startOf('day').toDate() } } },
      { $group: { _id: null, minutes: { $sum: '$workedMinutes' } } }
    ]),
    Attendance.aggregate([
      { $match: { date: { $gte: dayjs().subtract(7, 'day').startOf('day').toDate() } } },
      { $group: { _id: null, minutes: { $sum: '$workedMinutes' } } }
    ]),
    Attendance.aggregate([
      { $match: { date: { $gte: dayjs().subtract(30, 'day').startOf('day').toDate() } } },
      { $group: { _id: null, minutes: { $sum: '$workedMinutes' } } }
    ])
  ]);

  res.json({
    metrics: {
      totalEmployees,
      activeEmployees,
      totalProjects,
      onlineEmployees: onlineUsers.length,
      hoursToday: asHours(dailyHours[0]?.minutes || 0),
      hoursWeek: asHours(weeklyHours[0]?.minutes || 0),
      hoursMonth: asHours(monthlyHours[0]?.minutes || 0)
    },
    taskSummary,
    attendanceToday,
    focusTrend: trend.map((entry) => ({ label: entry._id, focusScore: Math.round(entry.focusScore) })),
    alerts,
    idleUsers,
    recentActivity: await fetchRecentAuditLogs({}, 12)
  });
};

export const getOnlineEmployees = async (req, res) => {
  const ids = getOnlineUsers();
  const users = await User.find({ _id: { $in: ids } }).select('-password');
  res.json(users);
};

export const getProductivity = async (req, res) => {
  const since = dayjs().subtract(7, 'day').toDate();
  const sessions = await WorkSession.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: '$user',
        avgFocusScore: { $avg: '$focusScore' },
        totalSessions: { $sum: 1 },
        totalIdle: { $sum: '$idleTime' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        user: { name: '$user.name', email: '$user.email' },
        avgFocusScore: 1,
        totalSessions: 1,
        totalIdle: 1
      }
    }
  ]);
  res.json(sessions);
};

export const getActivityFeed = async (req, res) => {
  const activity = await fetchRecentAuditLogs({}, Number(req.query.limit) || 20);
  res.json(activity);
};

const buildReport = async ({ title, startDate }) => {
  const logs = await DailyLog.find({ createdAt: { $gte: startDate } }).populate(
    'user',
    'name email'
  );
  const pdf = await generateLogReport({ title, logs });
  return pdf.toString('base64');
};

export const weeklyReport = async (req, res) => {
  const startDate = dayjs().subtract(7, 'day').startOf('day').toDate();
  const file = await buildReport({ title: 'Weekly Productivity Report', startDate });
  res.json({ file });
};

export const monthlyReport = async (req, res) => {
  const startDate = dayjs().subtract(30, 'day').startOf('day').toDate();
  const file = await buildReport({
    title: 'Monthly Productivity Report',
    startDate
  });
  res.json({ file });
};

export const getAdminTasks = async (req, res) => {
  const tasks = await Task.find()
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role')
    .populate('comments.user', 'name email role')
    .populate('project', 'name code status')
    .sort({ createdAt: -1 });
  res.json(tasks);
};

export const getAllLogs = async (req, res) => {
  const logs = await DailyLog.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.json(logs);
};
