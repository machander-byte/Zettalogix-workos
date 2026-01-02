import dayjs from 'dayjs';
import Attendance from '../models/Attendance.js';
import { recordAuditLog } from '../utils/auditLogger.js';

const startOfDay = (date = new Date()) => dayjs(date).startOf('day').toDate();

const findOrCreateRecord = async (userId, date = new Date()) => {
  const day = startOfDay(date);
  let record = await Attendance.findOne({ user: userId, date: day });
  if (!record) {
    record = await Attendance.create({ user: userId, date: day });
  }
  return record;
};

export const getMyAttendance = async (req, res) => {
  const days = Number(req.query.days || 14);
  const fromDate = dayjs().subtract(days - 1, 'day').startOf('day').toDate();
  const records = await Attendance.find({
    user: req.user._id,
    date: { $gte: fromDate }
  }).sort({ date: -1 });
  res.json(records);
};

export const checkIn = async (req, res) => {
  const record = await findOrCreateRecord(req.user._id);
  if (record.checkIn) return res.status(400).json({ message: 'Already checked in' });

  record.checkIn = new Date();
  record.status = 'in_progress';
  await record.save();
  res.json(record);
};

export const checkOut = async (req, res) => {
  const record = await findOrCreateRecord(req.user._id);
  if (!record.checkIn) return res.status(400).json({ message: 'No active session' });
  if (record.checkOut) return res.status(400).json({ message: 'Already checked out' });

  record.checkOut = new Date();
  record.status = 'completed';
  record.calculateWorkedMinutes();
  record.summary = `Worked ${Math.floor(record.workedMinutes / 60)}h ${
    record.workedMinutes % 60
  }m`;
  await record.save();

  res.json(record);
};

export const startBreak = async (req, res) => {
  const record = await findOrCreateRecord(req.user._id);
  if (!record.checkIn) return res.status(400).json({ message: 'You must check in first' });
  const activeBreak = record.breaks.find((entry) => !entry.end);
  if (activeBreak) return res.status(400).json({ message: 'Break already started' });
  record.breaks.push({ start: new Date() });
  await record.save();
  res.json(record);
};

export const endBreak = async (req, res) => {
  const record = await findOrCreateRecord(req.user._id);
  const activeBreak = record.breaks.find((entry) => !entry.end);
  if (!activeBreak) return res.status(400).json({ message: 'No active break' });
  activeBreak.end = new Date();
  record.calculateWorkedMinutes();
  await record.save();
  res.json(record);
};

export const listAttendance = async (req, res) => {
  const { from, to, userId } = req.query;
  const query = {};
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = dayjs(from).startOf('day').toDate();
    if (to) query.date.$lte = dayjs(to).endOf('day').toDate();
  }
  if (userId) query.user = userId;

  const records = await Attendance.find(query)
    .populate('user', 'name email role department')
    .sort({ date: -1 })
    .limit(200);
  res.json(records);
};

export const overrideAttendance = async (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const record = await Attendance.findById(id);
  if (!record) return res.status(404).json({ message: 'Attendance not found' });

  if (updates.checkIn) record.checkIn = new Date(updates.checkIn);
  if (updates.checkOut) record.checkOut = new Date(updates.checkOut);
  if (updates.status) record.status = updates.status;
  if (updates.notes) record.notes = updates.notes;
  if (updates.summary) record.summary = updates.summary;
  if (Array.isArray(updates.breaks)) record.breaks = updates.breaks;

  record.manualOverride = {
    active: true,
    reason: updates.reason,
    appliedBy: req.user._id,
    appliedAt: new Date()
  };
  record.calculateWorkedMinutes();
  await record.save();

  await recordAuditLog({
    user: req.user._id,
    role: req.user.role,
    action: 'attendance:override',
    entityType: 'attendance',
    entityId: record._id,
    description: `Attendance manually updated for ${record.date.toDateString()}`,
    metadata: updates,
    ipAddress: req.ip
  });

  res.json(record);
};
