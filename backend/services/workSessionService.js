import WorkSession from '../models/WorkSession.js';
import { calculateFocusScore } from '../utils/focusScore.js';

const ACTIVE_STATUSES = ['active', 'paused'];

const pushEvent = (session, type, actor, metadata) => {
  session.events = session.events || [];
  session.events.push({
    type,
    actor,
    metadata,
    timestamp: new Date()
  });
};

export const startSession = async (userId, actor) => {
  const existing = await WorkSession.findOne({
    user: userId,
    status: { $in: ACTIVE_STATUSES }
  });
  if (existing) return { session: existing, created: false };

  const session = await WorkSession.create({
    user: userId,
    startTime: new Date(),
    status: 'active',
    events: []
  });
  pushEvent(session, 'work:start', actor, { status: session.status });
  await session.save();
  return { session, created: true };
};

export const stopSession = async (userId, actor) => {
  const session = await WorkSession.findOne({
    user: userId,
    status: { $in: ACTIVE_STATUSES }
  }).sort({ createdAt: -1 });
  if (!session) return null;

  session.endTime = new Date();
  session.status = 'stopped';
  session.focusScore = calculateFocusScore(session);
  pushEvent(session, 'work:stop', actor, { focusScore: session.focusScore });
  await session.save();
  return session;
};

export const pauseSession = async (userId, actor) => {
  const session = await WorkSession.findOne({
    user: userId,
    status: 'active'
  }).sort({ createdAt: -1 });
  if (!session) return null;

  session.status = 'paused';
  pushEvent(session, 'work:pause', actor, {});
  await session.save();
  return session;
};

export const resumeSession = async (userId, actor) => {
  const session = await WorkSession.findOne({
    user: userId,
    status: 'paused'
  }).sort({ createdAt: -1 });
  if (!session) return null;

  session.status = 'active';
  pushEvent(session, 'work:resume', actor, {});
  await session.save();
  return session;
};

export const addIdleTime = async (userId, durationMs, actor) => {
  const session = await WorkSession.findOne({
    user: userId,
    status: { $in: ACTIVE_STATUSES }
  }).sort({ createdAt: -1 });
  if (!session) return null;

  session.idleTime = (session.idleTime || 0) + Number(durationMs || 0);
  pushEvent(session, 'work:idle', actor, { durationMs });
  await session.save();
  return session;
};

export const getActiveSession = async (userId) =>
  WorkSession.findOne({
    user: userId,
    status: { $in: ACTIVE_STATUSES }
  }).sort({ createdAt: -1 });

export const listLiveSessions = () =>
  WorkSession.find({
    status: { $in: ACTIVE_STATUSES }
  });
