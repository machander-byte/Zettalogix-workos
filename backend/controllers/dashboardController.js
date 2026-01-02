import dayjs from 'dayjs';
import Task from '../models/Task.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import WorkSession from '../models/WorkSession.js';
import AuditLog from '../models/AuditLog.js';

const hoursFromMinutes = (minutes = 0) => Math.round((minutes / 60) * 10) / 10;

export const getDashboardOverview = async (req, res) => {
  const role = req.user.role;
  const payload = {};
  const today = dayjs().startOf('day').toDate();

  if (role === 'admin') {
    const [totalUsers, activeUsers, tasks, attendance] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ status: 'active' }),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Attendance.aggregate([
        { $match: { date: { $gte: today } } },
        { $group: { _id: null, minutes: { $sum: '$workedMinutes' } } }
      ])
    ]);
    payload.summary = {
      totalUsers,
      activeUsers,
      hoursToday: hoursFromMinutes(attendance[0]?.minutes || 0),
      taskSummary: tasks.reduce((acc, entry) => ({ ...acc, [entry._id]: entry.count }), {})
    };
  } else if (role === 'manager') {
    const teamTasks = await Task.find({
      $or: [{ assignedBy: req.user._id }, { assignedTo: req.user._id }]
    })
      .populate('assignedTo', 'name email role')
      .sort({ updatedAt: -1 })
      .limit(15);
    payload.tasks = teamTasks;
  } else if (role === 'hr') {
    const attendance = await Attendance.find({
      date: { $gte: dayjs().subtract(7, 'day').startOf('day').toDate() }
    })
      .populate('user', 'name department')
      .sort({ date: -1 })
      .limit(30);
    payload.attendance = attendance;
  } else if (role === 'auditor') {
    const logs = await AuditLog.find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('user', 'name email role');
    payload.auditLog = logs;
  } else {
    const [tasks, attendance] = await Promise.all([
      Task.find({ assignedTo: req.user._id }).sort({ updatedAt: -1 }).limit(10),
      Attendance.find({ user: req.user._id }).sort({ date: -1 }).limit(10)
    ]);
    payload.tasks = tasks;
    payload.attendance = attendance;
  }

  const latestSession = await WorkSession.findOne({
    user: req.user._id,
    status: 'active'
  }).sort({ createdAt: -1 });
  payload.workSession = latestSession;

  res.json({ role, payload });
};
