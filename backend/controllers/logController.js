import DailyLog from '../models/DailyLog.js';
import { respondIfInvalidObjectId } from '../utils/objectId.js';

export const createDailyLog = async (req, res) => {
  const payload = {
    ...req.body,
    user: req.user._id
  };
  const log = await DailyLog.create(payload);
  res.status(201).json(log);
};

export const getLogsForUser = async (req, res) => {
  const { id } = req.params;
  if (respondIfInvalidObjectId(res, id, 'user id')) return;
  if (req.user.role !== 'admin' && String(req.user._id) !== id)
    return res.status(403).json({ message: 'Forbidden' });

  const logs = await DailyLog.find({ user: id })
    .populate('timeSpentPerTask.task', 'title')
    .sort({ createdAt: -1 });
  res.json(logs);
};

