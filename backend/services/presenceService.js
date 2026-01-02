const ACTIVE_THRESHOLD_MS = 2 * 60 * 1000;
const IDLE_THRESHOLD_MS = 5 * 60 * 1000;
const OFFLINE_THRESHOLD_MS = 10 * 60 * 1000;

export const getPresenceStatus = (user) => {
  const now = Date.now();
  const lastActive = user?.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
  if (!user?.isOnline || !lastActive || now - lastActive > OFFLINE_THRESHOLD_MS) return 'offline';
  if (now - lastActive <= ACTIVE_THRESHOLD_MS) return 'active';
  if (now - lastActive <= IDLE_THRESHOLD_MS) return 'idle';
  return 'idle';
};

export const getIdleMinutesFromLastActive = (user, status) => {
  if (status !== 'idle') return 0;
  const lastActive = user?.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
  if (!lastActive) return 0;
  const diff = Math.max(0, Date.now() - lastActive);
  return Math.round(diff / 60000);
};

export const buildPresenceRecord = (user) => ({
  _id: user._id,
  name: user.name,
  role: user.role,
  lastActiveAt: user.lastActiveAt,
  status: getPresenceStatus(user)
});

export { ACTIVE_THRESHOLD_MS, IDLE_THRESHOLD_MS, OFFLINE_THRESHOLD_MS };
