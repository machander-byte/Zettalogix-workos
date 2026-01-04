import { Server } from 'socket.io';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import CallLog from './models/CallLog.js';
import { getAllowedOrigins, isOriginAllowed } from './config/origins.js';
import {
  startSession,
  pauseSession,
  resumeSession,
  stopSession,
  listLiveSessions,
  getActiveSession,
  addIdleTime
} from './services/workSessionService.js';
import { dispatchRuleEvent } from './services/notificationService.js';
import { getSettings } from './services/settingsService.js';
import { logAlert } from './services/alertService.js';

const IDLE_THRESHOLD_MS = Number(process.env.IDLE_THRESHOLD_MINUTES || 2) * 60 * 1000;
const BROADCAST_DEBOUNCE_MS = 400;

let ioInstance;
const presence = new Map();
let broadcastScheduled = false;
const SETTINGS_TTL_MS = 30 * 1000;
let cachedSettings = null;
let settingsLoadedAt = 0;
const activeCalls = new Map();
const logCall = async (call, finalStatus) => {
  if (!call) return;
  const startedAt = call.startedAt || call.createdAt || new Date();
  const endedAt = call.endedAt || new Date();
  const durationSec =
    finalStatus === 'answered' && call.startedAt
      ? Math.max(0, Math.round((endedAt.getTime() - new Date(call.startedAt).getTime()) / 1000))
      : 0;
  try {
    await CallLog.create({
      callId: call.callId,
      fromUserId: call.from,
      toUserId: call.to,
      type: call.type,
      status: finalStatus,
      startedAt,
      endedAt,
      durationSec
    });
  } catch (error) {
    console.error('Failed to write call log', error);
  }
};

const persistUserActivity = async (userId, updates) => {
  try {
    await User.updateOne({ _id: userId }, updates);
  } catch (error) {
    console.error('Failed to update user activity', error);
  }
};

const getCurrentSettings = async () => {
  const now = Date.now();
  if (!cachedSettings || now - settingsLoadedAt > SETTINGS_TTL_MS) {
    cachedSettings = await getSettings();
    settingsLoadedAt = now;
  }
  return cachedSettings;
};

const authenticateSocket = async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name role isDeactivated');
    if (!user || user.isDeactivated) throw new Error('Invalid user');
    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};

const refreshUserSession = async (entry) => {
  if (!entry) return;
  const session = await getActiveSession(entry.userId);
  entry.sessionStatus = session?.status || 'idle';
  entry.sessionStart = session?.startTime;
};

const markIdle = async (entry) => {
  if (!entry || entry.idle) return;
  entry.idle = true;
  entry.activityStatus = 'idle';
  entry.idleSince = new Date();
  entry.idleTimer = null;
  const durationMs = Math.max(0, Date.now() - (entry.lastActiveAt?.getTime() || Date.now()));
  const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
  try {
      await Promise.all([
        addIdleTime(entry.userId, durationMs, entry.userId),
        pauseSession(entry.userId, entry.userId),
        persistUserActivity(entry.userId, {
          activityStatus: 'idle',
          isOnline: true,
          idleSince: entry.idleSince,
          lastActiveAt: entry.lastActiveAt
        })
      ]);
  } catch (error) {
    console.error('Failed to record idle state', error);
  }
  await dispatchRuleEvent('idle_threshold', {
    user: entry.userId,
    userName: entry.name,
    role: entry.role,
    idleMinutes: durationMinutes
  });
  try {
    const settings = await getCurrentSettings();
    if (settings.alertsEnabled) {
      const adminMinutes = Number(settings.idleAlertAdminMinutes || 30);
      const softMinutes = Number(settings.idleAlertSoftMinutes || 15);
      if (durationMinutes >= adminMinutes && entry.lastIdleAlert !== 'admin') {
        entry.lastIdleAlert = 'admin';
        await logAlert({
          userId: entry.userId,
          type: 'idle_admin',
          severity: 'critical',
          message: `${entry.name} has been idle for ${durationMinutes} minutes`,
          metadata: { durationMinutes }
        });
      } else if (durationMinutes >= softMinutes && entry.lastIdleAlert !== 'soft') {
        entry.lastIdleAlert = 'soft';
        await logAlert({
          userId: entry.userId,
          type: 'idle_soft',
          severity: 'warning',
          message: `${entry.name} idle for ${durationMinutes} minutes`,
          metadata: { durationMinutes }
        });
      }
    }
  } catch (error) {
    console.error('Failed to emit idle alert', error);
  }
  schedulePresenceBroadcast();
};

const resetIdleTimer = (entry) => {
  if (!entry) return;
  if (entry.idleTimer) clearTimeout(entry.idleTimer);
  entry.idleTimer = setTimeout(() => markIdle(entry).catch(console.error), IDLE_THRESHOLD_MS);
};

const touchActivity = async (entry) => {
  if (!entry) return;
  const settings = await getCurrentSettings().catch((error) => {
    console.error('Failed to load settings for activity', error);
    return null;
  });
  const wasIdle = entry.idle || entry.activityStatus === 'idle';
  entry.lastActiveAt = new Date();
  entry.idle = false;
  entry.idleSince = undefined;
  entry.activityStatus = 'active';
  resetIdleTimer(entry);
  try {
    if (settings) {
      const hour = entry.lastActiveAt.getHours();
      const workStart = Number(settings.workStartHour ?? 9);
      const workEnd = Number(settings.workEndHour ?? 18);
      const outsideWork = hour < workStart || hour >= workEnd;
      if (settings.activeOutsideWorkHours && outsideWork && !entry.activeOutsideAlerted) {
        entry.activeOutsideAlerted = true;
        await logAlert({
          userId: entry.userId,
          type: 'active_outside',
          severity: 'info',
          message: `${entry.name} active outside configured work hours`,
          metadata: { hour }
        });
      } else if (!outsideWork) {
        entry.activeOutsideAlerted = false;
      }
    }
  } catch (error) {
    console.error('Failed to emit active outside alert', error);
  }
  if (wasIdle) {
    await resumeSession(entry.userId, entry.userId).catch((error) =>
      console.error('Failed to resume session after activity', error)
    );
  }
  await persistUserActivity(entry.userId, {
    activityStatus: 'active',
    isOnline: true,
    idleSince: null,
    lastActiveAt: entry.lastActiveAt
  });
  if (wasIdle) {
    schedulePresenceBroadcast();
  }
};

const buildPresencePayload = async () => {
  const entries = Array.from(presence.values());
  const sessions = await listLiveSessions();
  const now = Date.now();
  const liveMs = sessions.reduce((sum, session) => {
    const startMs = session.startTime?.getTime() || now;
    const duration = Math.max(0, now - startMs - (session.idleTime || 0));
    return sum + duration;
  }, 0);
  const sessionMap = new Map(sessions.map((session) => [session.user.toString(), session]));
  const activeUsers = entries.map((entry) => {
    const session = sessionMap.get(entry.userId);
    return {
      _id: entry.userId,
      name: entry.name,
      role: entry.role,
      idle: entry.idle,
      lastActiveAt: entry.lastActiveAt?.toISOString(),
      activityStatus: entry.activityStatus || 'offline',
      idleSince: entry.idleSince?.toISOString(),
      sessionStatus: session?.status || entry.sessionStatus || 'idle',
      sessionStart: session?.startTime?.toISOString()
    };
  });
  const idleUsers = activeUsers.filter((user) => user.idle);
  return {
    timestamp: new Date().toISOString(),
    liveMetrics: {
      onlineUsers: entries.length,
      idleUsers: idleUsers.length,
      activeSessions: sessions.length,
      liveHours: Number((liveMs / 3600000).toFixed(2))
    },
    activeUsers,
    idleUsers
  };
};

const broadcastPresence = async () => {
  if (!ioInstance) return;
  const payload = await buildPresencePayload();
  ioInstance.to('admins').emit('presence:update', payload);
  ioInstance.emit('presence:summary', payload.liveMetrics);
};

const schedulePresenceBroadcast = () => {
  if (broadcastScheduled) return;
  broadcastScheduled = true;
  setTimeout(() => {
    broadcastScheduled = false;
    broadcastPresence().catch(console.error);
  }, BROADCAST_DEBOUNCE_MS);
};

const requestPresenceUpdate = async (userId) => {
  const entry = presence.get(String(userId));
  if (!entry) return;
  await refreshUserSession(entry);
  schedulePresenceBroadcast();
};

const registerSocket = async (socket, user) => {
  if (!user) return;
  const userId = user._id.toString();
  let entry = presence.get(userId);
  if (!entry) {
    entry = {
      userId,
      name: user.name,
      role: user.role,
      sockets: new Set(),
      connectedAt: new Date(),
      lastActiveAt: new Date(),
      idle: false,
      idleTimer: null,
      sessionStatus: 'idle',
      activityStatus: 'active',
      idleSince: null,
      lastIdleAlert: null,
      activeOutsideAlerted: false
    };
    presence.set(userId, entry);
    await persistUserActivity(userId, {
      activityStatus: 'active',
      idleSince: null,
      lastActiveAt: entry.lastActiveAt
    });
  }
  entry.sockets.add(socket.id);
  socket.data.userId = userId;
  socket.data.role = user.role;
  socket.join(userId);
  await refreshUserSession(entry);
  touchActivity(entry).catch((error) => console.error('Initial activity sync failed', error));
  socket.join('presence');
  if (user.role === 'admin') {
    socket.join('admins');
  }
  schedulePresenceBroadcast();
};

const cleanupSocket = (socket) => {
  const userId = socket.data.userId;
  if (!userId) return;
  const entry = presence.get(userId);
  if (!entry) return;
  entry.sockets.delete(socket.id);
  if (entry.sockets.size === 0) {
    if (entry.idleTimer) clearTimeout(entry.idleTimer);
    entry.activityStatus = 'offline';
    entry.idle = false;
    entry.idleSince = undefined;
    persistUserActivity(userId, {
      activityStatus: 'offline',
      isOnline: false,
      idleSince: null
    }).catch((error) =>
      console.error('Failed to mark user offline', error)
    );
    const now = new Date();
    (async () => {
      try {
        const settings = await getCurrentSettings();
        const hour = now.getHours();
        const workStart = Number(settings.workStartHour ?? 9);
        const workEnd = Number(settings.workEndHour ?? 18);
        if (
          settings.alertsEnabled &&
          hour >= workStart &&
          hour < workEnd
        ) {
          await logAlert({
            userId,
            type: 'offline_work_hours',
            severity: 'warning',
            message: `${entry.name} disconnected during work hours`,
            metadata: { timestamp: now.toISOString() }
          });
        }
      } catch (error) {
        console.error('Offline alert failed', error);
      }
    })();
    presence.delete(userId);
  }
  schedulePresenceBroadcast();
};

export const initSocket = (server) => {
  const allowedOrigins = getAllowedOrigins();
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin, allowedOrigins)) return callback(null, true);
        return callback(new Error(`CORS policy blocks requests from ${origin}`));
      },
      credentials: true
    }
  });
  io.use(authenticateSocket);
  io.on('connection', (socket) => {
    const user = socket.data.user;
    registerSocket(socket, user).catch(console.error);

    socket.on('heartbeat', () => {
      const entry = presence.get(socket.data.userId);
      touchActivity(entry).catch((error) => console.error('Heartbeat activity failed', error));
    });

    socket.on('activity', () => {
      const entry = presence.get(socket.data.userId);
      touchActivity(entry).catch((error) => console.error('Activity pulse failed', error));
    });

    const createWorkHandler = (handler) => async (_payload, callback) => {
      if (!socket.data.userId) {
        callback?.({ success: false, message: 'Unauthorized' });
        return;
      }
      try {
        const result = await handler(socket.data.userId, socket.data.userId);
        await requestPresenceUpdate(socket.data.userId);
        callback?.({ success: true, payload: result });
      } catch (error) {
        console.error('Work socket failure', error);
        callback?.({ success: false, message: error.message || 'Work action failed' });
      }
    };

    socket.on('work:start', createWorkHandler(startSession));
    socket.on('work:pause', createWorkHandler(pauseSession));
    socket.on('work:resume', createWorkHandler(resumeSession));
  socket.on('work:stop', createWorkHandler(stopSession));

    const getCall = (callId) => activeCalls.get(callId);
    const isParticipant = (call, uid) => call && (call.from === uid || call.to === uid);
    const endCall = (callId, status, finalStatusOverride) => {
      const call = activeCalls.get(callId);
      if (!call) return null;
      const endedAt = new Date();
      const updated = { ...call, status, endedAt };
      activeCalls.delete(callId);
      const finalStatus = finalStatusOverride || status;
      logCall(updated, finalStatus);
      return updated;
    };

    socket.on('call:invite', (payload, cb) => {
      const toUserId = String(payload?.toUserId || '');
      const type = payload?.type === 'video' ? 'video' : 'audio';
      if (!toUserId || toUserId === socket.data.userId) {
        cb?.({ error: 'Invalid call target' });
        return;
      }
      const callId = randomUUID();
      const call = {
        callId,
        from: socket.data.userId,
        to: toUserId,
        type,
        status: 'ringing',
        createdAt: new Date(),
        fromName: socket.data.user?.name,
        toName: typeof payload?.toName === 'string' ? payload.toName : undefined
      };
      activeCalls.set(callId, call);
      ioInstance.to(toUserId).emit('call:ringing', call);
      socket.emit('call:outgoing', call);
      cb?.({ callId });
    });

    socket.on('call:accept', (payload, cb) => {
      const callId = payload?.callId;
      const call = getCall(callId);
      if (!call || call.status !== 'ringing' || socket.data.userId !== call.to) {
        cb?.({ error: 'Cannot accept call' });
        return;
      }
      const updated = { ...call, status: 'accepted', startedAt: call.startedAt || new Date() };
      activeCalls.set(callId, updated);
      ioInstance.to(call.from).emit('call:accepted', updated);
      ioInstance.to(call.to).emit('call:accepted', updated);
      cb?.({ callId });
    });

    socket.on('call:reject', (payload, cb) => {
      const callId = payload?.callId;
      const call = getCall(callId);
      if (!isParticipant(call, socket.data.userId) || call?.status === 'ended') {
        cb?.({ error: 'Cannot reject call' });
        return;
      }
      const updated = endCall(callId, 'rejected', 'rejected');
      if (updated) {
        ioInstance.to(updated.from).emit('call:rejected', updated);
        ioInstance.to(updated.to).emit('call:rejected', updated);
      }
      cb?.({ callId });
    });

    socket.on('call:cancel', (payload, cb) => {
      const callId = payload?.callId;
      const call = getCall(callId);
      if (!call || call.from !== socket.data.userId) {
        cb?.({ error: 'Cannot cancel call' });
        return;
      }
      const updated = endCall(callId, 'canceled', 'cancelled');
      if (updated) {
        ioInstance.to(updated.to).emit('call:canceled', updated);
        ioInstance.to(updated.from).emit('call:canceled', updated);
      }
      cb?.({ callId });
    });

    socket.on('call:end', (payload, cb) => {
      const callId = payload?.callId;
      const call = getCall(callId);
      if (!isParticipant(call, socket.data.userId)) {
        cb?.({ error: 'Cannot end call' });
        return;
      }
      const finalStatus =
        call?.status === 'accepted' ? 'answered' : call?.status === 'rejected' ? 'rejected' : 'missed';
      const updated = endCall(callId, 'ended', finalStatus);
      if (updated) {
        ioInstance.to(updated.to).emit('call:ended', updated);
        ioInstance.to(updated.from).emit('call:ended', updated);
      }
      cb?.({ callId });
    });

    socket.on('webrtc:offer', (payload, cb) => {
      const callId = payload?.callId;
      const call = getCall(callId);
      if (!call || !isParticipant(call, socket.data.userId)) {
        cb?.({ error: 'Invalid call' });
        return;
      }
      const target = call.from === socket.data.userId ? call.to : call.from;
      ioInstance.to(target).emit('webrtc:offer', { callId, sdp: payload?.sdp });
      cb?.({ ok: true });
    });

    socket.on('webrtc:answer', (payload, cb) => {
      const callId = payload?.callId;
      const call = getCall(callId);
      if (!call || !isParticipant(call, socket.data.userId)) {
        cb?.({ error: 'Invalid call' });
        return;
      }
      const target = call.from === socket.data.userId ? call.to : call.from;
      ioInstance.to(target).emit('webrtc:answer', { callId, sdp: payload?.sdp });
      cb?.({ ok: true });
    });

    socket.on('webrtc:ice', (payload, cb) => {
      const callId = payload?.callId;
      const call = getCall(callId);
      if (!call || !isParticipant(call, socket.data.userId)) {
        cb?.({ error: 'Invalid call' });
        return;
      }
      const target = call.from === socket.data.userId ? call.to : call.from;
      ioInstance.to(target).emit('webrtc:ice', { callId, candidate: payload?.candidate });
      cb?.({ ok: true });
    });

    socket.on('disconnect', () => cleanupSocket(socket));
  });
  ioInstance = io;
  return io;
};

export const getOnlineUsers = () =>
  Array.from(presence.entries())
    .filter(([, entry]) => entry.sockets?.size)
    .map(([userId]) => userId);

export { requestPresenceUpdate };
