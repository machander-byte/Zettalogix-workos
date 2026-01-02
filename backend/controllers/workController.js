import { dispatchRuleEvent } from '../services/notificationService.js';
import {
  startSession,
  stopSession,
  pauseSession,
  resumeSession,
  addIdleTime,
  getActiveSession
} from '../services/workSessionService.js';
import {
  applyTick,
  endSessionTimer,
  ensureSession,
  getTodayTotals,
  toTimerResponse
} from '../services/workTimerService.js';
import { requestPresenceUpdate } from '../socket.js';

export const startWork = async (req, res) => {
  const { session, created } = await startSession(req.user._id, req.user._id);
  await requestPresenceUpdate(req.user._id);
  res.status(created ? 201 : 200).json(session);
};

export const stopWork = async (req, res) => {
  const session = await stopSession(req.user._id, req.user._id);
  if (!session) return res.status(404).json({ message: 'No active session' });
  await requestPresenceUpdate(req.user._id);
  res.json(session);
};

export const recordActivePage = async (req, res) => {
  const { url, title, duration } = req.body;
  const session = await getActiveSession(req.user._id);
  if (!session) return res.status(404).json({ message: 'No active session' });

  session.activePages.push({
    url,
    title,
    duration: duration || 0,
    lastVisited: new Date()
  });
  session.tabSwitchCount += 1;
  await session.save();

  res.json(session);
};

export const recordIdle = async (req, res) => {
  const { duration } = req.body;
  const session = await addIdleTime(req.user._id, Number(duration || 0), req.user._id);
  if (!session) return res.status(404).json({ message: 'No active session' });
  await dispatchRuleEvent('idle_threshold', {
    user: req.user._id,
    userName: req.user.name,
    role: req.user.role,
    idleMinutes: Math.round(session.idleTime / 60000)
  });
  await requestPresenceUpdate(req.user._id);
  res.json(session);
};

export const getCurrentSession = async (req, res) => {
  const session = await getActiveSession(req.user._id);
  res.json(session || null);
};

export const pauseWork = async (req, res) => {
  const session = await pauseSession(req.user._id, req.user._id);
  if (!session) return res.status(404).json({ message: 'No active session to pause' });
  await requestPresenceUpdate(req.user._id);
  res.json(session);
};

export const resumeWork = async (req, res) => {
  const session = await resumeSession(req.user._id, req.user._id);
  if (!session) return res.status(404).json({ message: 'No paused session to resume' });
  await requestPresenceUpdate(req.user._id);
  res.json(session);
};

export const startWorkTimer = async (req, res) => {
  const { session, created } = await ensureSession(req.user._id);
  res.status(created ? 201 : 200).json(toTimerResponse(session));
};

export const tickWorkTimer = async (req, res) => {
  const status = req.body?.status === 'idle' ? 'idle' : 'active';
  const session = await applyTick(req.user._id, status);
  res.json(toTimerResponse(session));
};

export const endWorkTimer = async (req, res) => {
  const status = req.body?.status === 'idle' ? 'idle' : 'active';
  const session = await endSessionTimer(req.user._id, status);
  if (!session) return res.status(204).send();
  res.json(toTimerResponse(session));
};

export const getTodayWorkTotals = async (req, res) => {
  const totals = await getTodayTotals(req.user._id);
  res.json(totals);
};
