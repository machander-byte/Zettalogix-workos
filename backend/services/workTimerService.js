import WorkSession from '../models/WorkSession.js';

const ACTIVE_STATUSES = ['active', 'paused'];
const IDLE_STATUS = 'paused';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const normalizeSessionStatus = (status) => (status === IDLE_STATUS ? 'idle' : 'active');

const findActiveSession = (userId) =>
  WorkSession.findOne({ user: userId, status: { $in: ACTIVE_STATUSES } }).sort({ createdAt: -1 });

const createSession = async (userId) => {
  const now = new Date();
  return WorkSession.create({
    user: userId,
    startTime: now,
    startAt: now,
    lastTickAt: now,
    activeMs: 0,
    idleMs: 0,
    idleTime: 0,
    status: 'active'
  });
};

export const ensureSession = async (userId) => {
  const existing = await findActiveSession(userId);
  if (existing) return { session: existing, created: false };
  const session = await createSession(userId);
  return { session, created: true };
};

export const applyTick = async (userId, status) => {
  const targetStatus = status === 'idle' ? IDLE_STATUS : 'active';
  let session = await findActiveSession(userId);
  if (!session) {
    const created = await createSession(userId);
    session = created;
  }
  const now = new Date();
  const lastTick = session.lastTickAt ? new Date(session.lastTickAt) : session.startTime || now;
  const delta = Math.max(0, now.getTime() - lastTick.getTime());

  if (targetStatus === IDLE_STATUS) {
    session.idleMs = (session.idleMs || 0) + delta;
    session.idleTime = (session.idleTime || 0) + delta;
  } else {
    session.activeMs = (session.activeMs || 0) + delta;
  }

  session.status = targetStatus;
  session.lastTickAt = now;
  await session.save();
  return session;
};

export const endSessionTimer = async (userId, status = 'active') => {
  let session = await findActiveSession(userId);
  if (!session) return null;

  session = await applyTick(userId, status);
  const now = new Date();
  session.endTime = now;
  session.endAt = now;
  session.status = 'stopped';
  await session.save();
  return session;
};

export const getTodayTotals = async (userId) => {
  const today = startOfToday();
  const sessions = await WorkSession.find({
    user: userId,
    startTime: { $gte: today }
  }).sort({ createdAt: 1 });

  let activeMs = 0;
  let idleMs = 0;

  sessions.forEach((session) => {
    const sessionActive = session.activeMs || 0;
    const sessionIdle = session.idleMs || session.idleTime || 0;
    activeMs += sessionActive;
    idleMs += sessionIdle;
  });

  return { activeMs, idleMs };
};

export const toTimerResponse = (session) => ({
  sessionId: session?._id,
  status: normalizeSessionStatus(session?.status),
  startAt: session?.startAt || session?.startTime,
  endAt: session?.endAt || session?.endTime,
  activeMs: session?.activeMs || 0,
  idleMs: session?.idleMs || session?.idleTime || 0,
  lastTickAt: session?.lastTickAt
});
