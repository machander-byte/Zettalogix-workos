import User from '../models/User.js';
import {
  ACTIVE_THRESHOLD_MS,
  buildPresenceRecord,
  getPresenceStatus,
  IDLE_THRESHOLD_MS,
  OFFLINE_THRESHOLD_MS
} from '../services/presenceService.js';

const parseLastActiveAt = (value) => {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export const heartbeat = async (req, res) => {
  const lastActiveAt = parseLastActiveAt(req.body?.lastActiveAt);
  req.user.lastActiveAt = lastActiveAt;
  req.user.isOnline = true;
  req.user.activityStatus = 'active';
  req.user.idleSince = null;
  await req.user.save();

  res.json({
    status: getPresenceStatus(req.user),
    lastActiveAt: req.user.lastActiveAt,
    thresholds: {
      activeMs: ACTIVE_THRESHOLD_MS,
      idleMs: IDLE_THRESHOLD_MS,
      offlineMs: OFFLINE_THRESHOLD_MS
    }
  });
};

export const goOffline = async (req, res) => {
  req.user.isOnline = false;
  req.user.activityStatus = 'offline';
  req.user.idleSince = null;
  await req.user.save();
  res.json({ status: 'offline', lastActiveAt: req.user.lastActiveAt });
};

export const listPresence = async (_req, res) => {
  const users = await User.find({ role: { $ne: 'admin' } })
    .select('name role lastActiveAt isOnline')
    .sort({ name: 1 });
  const payload = users.map((user) => buildPresenceRecord(user));
  res.json({ updatedAt: new Date().toISOString(), users: payload });
};
